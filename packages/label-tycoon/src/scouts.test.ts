import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  SCOUTS,
  describeRejection,
  labelGame,
  newGame,
  rivalsPoach,
  scoutLevelOf,
  scoutTalents,
} from './index';
import type { LabelAction, Prospect } from './index';

const rich = (seed = 'den') => {
  const session = newGame(seed);
  session.engine.data.label.tresorerie = money.euros(100_000);
  return session;
};
type Session = ReturnType<typeof rich>;
const act = (session: Session, action: LabelAction) => {
  const result = labelGame.dispatch(session, action);
  return { ok: result.ok, session: result.ok ? result.session : session, result };
};
const data = (session: Session) => session.engine.data;

describe('dénicheurs', () => {
  it('se recrutent contre des frais, avec un niveau borné et un genre fétiche', () => {
    const result = act(rich(), { type: 'recruter-denicheur', genre: 'rap' });
    expect(result.ok).toBe(true);
    const d = data(result.session).denicheurs[0];
    expect(d?.genreFetiche).toBe('rap');
    expect(d?.niveau).toBeGreaterThanOrEqual(SCOUTS.levelMin);
    expect(d?.niveau).toBeLessThanOrEqual(SCOUTS.levelMax);
  });

  it("refusent un genre inconnu, un excès d'effectif et des fonds insuffisants", () => {
    let session = rich();
    expect(act(session, { type: 'recruter-denicheur', genre: 'zzz' }).ok).toBe(false);
    for (let i = 0; i < SCOUTS.max; i += 1)
      session = act(session, { type: 'recruter-denicheur', genre: 'rap' }).session;
    const over = labelGame.dispatch(session, { type: 'recruter-denicheur', genre: 'rap' });
    expect(over.ok).toBe(false);
    if (!over.ok) expect(describeRejection(over.rejection)).toContain(String(SCOUTS.max));
    const poor = newGame('pauvre');
    poor.engine.data.label.tresorerie = money.euros(10);
    expect(act(poor, { type: 'recruter-denicheur', genre: 'rap' }).ok).toBe(false);
  });

  it('orientent le repérage vers leur genre fétiche et relèvent la précision', () => {
    const session = act(rich(), { type: 'recruter-denicheur', genre: 'rap' }).session;
    const state = data(session);
    const d = state.denicheurs[0];
    if (!d) throw new Error('dénicheur attendu');
    for (let i = 0; i < 20; i += 1) scoutTalents(state, Rng.fromSeed(`g${i}`), 'plateforme', 1, d);
    const share = state.artistes.filter((a) => a.genre === 'rap').length / state.artistes.length;
    expect(share).toBeGreaterThan(0.5);
    expect(state.suivis.every((p) => p.denicheurId === d.id)).toBe(true);
    expect(scoutLevelOf(state, state.suivis[0] as Prospect)).toBe(d.niveau);
  });

  it('renvoyer un dénicheur détache ses talents suivis', () => {
    const hired = act(rich(), { type: 'recruter-denicheur', genre: 'rap' }).session;
    const d = data(hired).denicheurs[0];
    if (!d) throw new Error('dénicheur attendu');
    const found = act(hired, { type: 'reperer', source: 'open-mic', denicheurId: d.id });
    expect(found.ok).toBe(true);
    const fired = act(found.session, { type: 'renvoyer-denicheur', denicheurId: d.id });
    expect(data(fired.session).denicheurs).toHaveLength(0);
    expect(data(fired.session).suivis.every((p) => p.denicheurId === null)).toBe(true);
    expect(act(fired.session, { type: 'reperer', source: 'open-mic', denicheurId: d.id }).ok).toBe(
      false,
    );
  });

  it('sont payés chaque semaine', () => {
    const hired = act(rich(), { type: 'recruter-denicheur', genre: 'rap' }).session;
    const after = labelGame.advance(hired, 1).session;
    expect(data(after).label.tresorerie).toBeLessThan(data(hired).label.tresorerie);
  });
});

describe('rivaux', () => {
  it('finissent par signer un talent libre suivi, de façon rejouable', () => {
    const run = () => {
      const state = data(rich('riv'));
      state.config.difficulty.rivalAggression = 50;
      scoutTalents(state, Rng.fromSeed('r'), 'plateforme', 0);
      const signals: string[] = [];
      for (let w = 0; w < 80; w += 1)
        rivalsPoach(state, Rng.fromSeed(`w${w}`), (s) => signals.push(s.kind));
      return { state, signals };
    };
    const a = run();
    expect(a.signals.length).toBeGreaterThan(0);
    expect(a.state.artistes.filter((x) => x.employeur === 'rival')).toHaveLength(a.signals.length);
    expect(run().signals).toEqual(a.signals);
  });

  it('sont inoffensifs à agressivité nulle', () => {
    const state = data(rich('calm'));
    state.config.difficulty.rivalAggression = 0;
    scoutTalents(state, Rng.fromSeed('r'), 'plateforme', 0);
    const n = state.suivis.length;
    for (let w = 0; w < 200; w += 1) rivalsPoach(state, Rng.fromSeed(`w${w}`), () => undefined);
    expect(state.suivis).toHaveLength(n);
  });
});
