import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { TOUR, VENUES, labelGame, newGame, scoutTalents, venueCost } from './index';

const setup = (fans = 40_000) => {
  const s = newGame('tour');
  const d = s.engine.data;
  d.label.tresorerie = money.euros(2_000_000);
  scoutTalents(d, Rng.fromSeed('t'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  a.fanbase = fans;
  a.hype = 50;
  return { s, id: a.id };
};
const tour = (id: number, over: Record<string, unknown> = {}) =>
  ({
    type: 'lancer-tournee',
    artisteId: id,
    salle: 'club',
    prix: 18,
    dates: 6,
    merch: 1000,
    ...over,
  }) as never;

describe('lancement', () => {
  it('programme une date par semaine et débite salles et merch', () => {
    const { s, id } = setup();
    const before = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, tour(id));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.session.engine.data;
    expect(d.concerts).toHaveLength(6);
    const dates = d.concerts.map((c) => c.date);
    expect(dates.every((x, i) => i === 0 || x === (dates[i - 1] ?? 0) + 1)).toBe(true);
    expect(d.label.tresorerie).toBe(before - (6 * venueCost(d, 'club') + 1000 * TOUR.merchCost));
    expect(d.tournees[0]?.concertIds).toHaveLength(6);
  });

  it('un tourneur réduit le coût des salles', () => {
    const { s } = setup();
    const base = venueCost(s.engine.data, 'salle');
    s.engine.data.personnel.push({
      id: 5,
      nom: 'T',
      role: 'tourneur',
      niveau: 80,
      specialite: null,
      salaire: 0,
      moral: 60,
      trait: 'loyal',
      experience: 0,
    });
    expect(venueCost(s.engine.data, 'salle')).toBeLessThan(base);
    expect(base).toBe(VENUES.salle.cout);
  });

  it('refuse les dates hors bornes, la tournée en double et le manque de fonds', () => {
    const { s, id } = setup();
    expect(labelGame.dispatch(s, tour(id, { dates: 1 }))).toMatchObject({
      ok: false,
      rejection: { code: 'dates-invalides' },
    });
    const r = labelGame.dispatch(s, tour(id));
    if (!r.ok) throw new Error('tournée attendue');
    expect(labelGame.dispatch(r.session, tour(id))).toMatchObject({
      ok: false,
      rejection: { code: 'tournee-en-cours' },
    });
    s.engine.data.label.tresorerie = cents(10);
    expect(labelGame.dispatch(s, tour(id))).toMatchObject({
      ok: false,
      rejection: { code: 'fonds-insuffisants' },
    });
  });
});

describe('déroulé', () => {
  it('vend du merch pendant la tournée, dans la limite du stock', () => {
    const { s, id } = setup(100_000);
    const r = labelGame.dispatch(s, tour(id, { merch: 50, dates: 5 }));
    if (!r.ok) throw new Error('tournée attendue');
    const d = labelGame.advance(r.session, 12).session.engine.data;
    expect(d.tournees[0]?.merchVendu).toBeGreaterThan(0);
    expect(d.tournees[0]?.merchVendu).toBeLessThanOrEqual(50);
  });

  it('une fatigue élevée provoque un burnout : tournée annulée, moral en chute, repos forcé', () => {
    const { s, id } = setup(100_000);
    const art = s.engine.data.artistes[0];
    if (art) art.fatigue = 95;
    const r = labelGame.dispatch(s, tour(id, { dates: 10 }));
    if (!r.ok) throw new Error('tournée attendue');
    const run = labelGame.advance(r.session, 4);
    const d = run.session.engine.data;
    expect(run.signals.some((x) => x.kind === 'burnout')).toBe(true);
    expect(d.tournees[0]?.annulee).toBe(true);
    expect(d.concerts.filter((c) => c.spectateurs > 0).length).toBeLessThan(10);
    expect(d.artistes[0]?.repos).toBeGreaterThan(0);
    expect(labelGame.dispatch(run.session, tour(id))).toMatchObject({
      ok: false,
      rejection: { code: 'artiste-au-repos' },
    });
  });
});
