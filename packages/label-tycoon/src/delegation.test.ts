import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { DELEGATION, SCOUTING, chooseSource, labelGame, newGame } from './index';
import type { Cadre } from './index';

const cadre = (over: Partial<Cadre> = {}): Cadre => ({
  actif: true,
  budgetMax: money.euros(500),
  genres: [],
  seuilAlerte: 0,
  ...over,
});

const setup = (level: number, c: Cadre) => {
  const s = newGame('deleg');
  s.engine.data.label.tresorerie = money.euros(200_000);
  s.engine.data.denicheurs.push({ id: 1, nom: 'A', niveau: level, genreFetiche: 'rap' });
  const r = labelGame.dispatch(s, { type: 'configurer-delegation', domaine: 'reperage', cadre: c });
  if (!r.ok) throw new Error('cadre attendu');
  return r.session;
};

describe('choix de source', () => {
  it('un bon dénicheur choisit mieux, et reste dans le budget', () => {
    expect(chooseSource(80, money.euros(500))).toBe('plateforme');
    expect(chooseSource(10, money.euros(500))).toBe('open-mic');
    expect(chooseSource(80, money.euros(10))).toBe('candidature');
    expect(chooseSource(80, -1)).toBeNull();
  });
});

describe('repérage délégué', () => {
  it('agit dans le cadre : rapport, coût et suivis ajoutés', () => {
    const s = labelGame.advance(setup(70, cadre()), DELEGATION.every * 2).session.engine.data;
    expect(s.rapports.length).toBeGreaterThan(0);
    expect(s.suivis.length).toBeGreaterThan(0);
    expect(s.rapports.every((r) => r.cout <= money.euros(500))).toBe(true);
  });

  it('ne dépasse jamais le cadre : genres écartés, seuil d’alerte et plafond de suivis', () => {
    const rap = labelGame.advance(setup(70, cadre({ genres: ['rap'] })), 60).session.engine.data;
    expect(
      rap.suivis.every((p) => rap.artistes.find((a) => a.id === p.artisteId)?.genre === 'rap'),
    ).toBe(true);
    const broke = setup(70, cadre({ seuilAlerte: money.euros(10_000_000) }));
    const r = labelGame.advance(broke, 20);
    expect(r.session.engine.data.suivis).toHaveLength(0);
    expect(r.signals.some((x) => x.kind === 'delegation-bloquee')).toBe(true);
    const long = labelGame.advance(setup(70, cadre()), 400).session.engine.data;
    expect(long.suivis.length).toBeLessThanOrEqual(SCOUTING.maxFollowed);
  });

  it('inactive ou sans dénicheur, rien ne se passe ; domaine inconnu refusé', () => {
    expect(
      labelGame.advance(setup(70, cadre({ actif: false })), 40).session.engine.data.rapports,
    ).toHaveLength(0);
    const s = newGame('x');
    const r = labelGame.dispatch(s, {
      type: 'configurer-delegation',
      domaine: 'peche' as never,
      cadre: cadre(),
    });
    expect(r).toMatchObject({ ok: false, rejection: { code: 'domaine-inconnu' } });
  });
});
