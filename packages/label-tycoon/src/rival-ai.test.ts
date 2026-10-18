import { Rng } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  GENRE_IDS,
  RIVAL_AI,
  generateRival,
  labelGame,
  newGame,
  rivalIncome,
  rosterOf,
  scoutTalents,
  signingUtility,
} from './index';

const setup = () => {
  const s = newGame('ai');
  s.engine.data.config.difficulty.rivalAggression = 4;
  return s;
};

describe('utilité de signature', () => {
  it('récompense la notoriété pour une major et le potentiel précoce pour un indé pointu', () => {
    const s = newGame('u');
    const d = s.engine.data;
    scoutTalents(d, Rng.fromSeed('u'), 'plateforme', 0);
    const a = d.artistes[0];
    if (!a) throw new Error('artiste attendu');
    const major = {
      ...generateRival(Rng.fromSeed('m'), 1, GENRE_IDS, 0),
      personnalite: 'major' as const,
      genreFetiche: 'zzz',
    };
    const pointu = { ...major, personnalite: 'pointu' as const };
    a.phase = 'emergent';
    a.potentiel = 95;
    a.fanbase = 10;
    const lowFame = { major: signingUtility(d, major, a), pointu: signingUtility(d, pointu, a) };
    expect(lowFame.pointu).toBeGreaterThan(lowFame.major);
    a.phase = 'pic';
    a.fanbase = 2_000_000;
    expect(signingUtility(d, major, a)).toBeGreaterThan(signingUtility(d, pointu, a));
  });
  it('le genre fétiche ajoute un bonus', () => {
    const d = newGame('g').engine.data;
    scoutTalents(d, Rng.fromSeed('g'), 'plateforme', 0);
    const a = d.artistes[0];
    if (!a) throw new Error('artiste attendu');
    const r = generateRival(Rng.fromSeed('x'), 1, GENRE_IDS, 0);
    expect(signingUtility(d, { ...r, genreFetiche: a.genre }, a)).toBeGreaterThan(
      signingUtility(d, { ...r, genreFetiche: 'zzz' }, a),
    );
  });
});

describe('dans la simulation', () => {
  it('les rivaux repèrent, signent des talents et préparent des sorties, de façon rejouable', () => {
    const run = () => labelGame.advance(setup(), 156);
    const a = run();
    const d = a.session.engine.data;
    expect(d.artistes.length).toBeGreaterThan(0);
    expect(d.artistes.some((x) => x.employeur.startsWith('rival:'))).toBe(true);
    expect(a.signals.some((x) => x.kind === 'signature-rivale')).toBe(true);
    expect(d.sortiesRivales.some((x) => x.artisteId !== null)).toBe(true);
    expect(run().session.engine.data.rivaux).toEqual(d.rivaux);
  });

  it('leur trésorerie évolue avec les revenus de leur roster moins les frais', () => {
    const s = newGame('inc');
    const d = s.engine.data;
    const rival = d.rivaux[0];
    if (!rival) throw new Error('rival attendu');
    expect(rivalIncome([])).toBe(0);
    const before = rival.tresorerie;
    const after = labelGame.advance(s, 1).session.engine.data.rivaux[0];
    expect(after?.tresorerie).toBe(before - RIVAL_AI.weeklyOverhead);
    expect(rosterOf(d, rival)).toHaveLength(0);
  });

  it('sans trésorerie, un rival ne dépense plus et son compteur négatif monte', () => {
    const s = newGame('neg');
    const r = s.engine.data.rivaux[0];
    if (r) r.tresorerie = -10_000_000;
    const out = labelGame.advance(s, 5).session.engine.data.rivaux[0];
    expect(out?.semainesNegatives).toBe(5);
  });
});
