import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { CONCERTS, VENUES, fillRate, labelGame, newGame, scoutTalents } from './index';

describe('remplissage', () => {
  it('croît avec les fans et la hype, décroît avec le prix, reste dans [0, 1]', () => {
    expect(fillRate(50_000, 0, 'zenith', 45)).toBeGreaterThan(fillRate(500, 0, 'zenith', 45));
    expect(fillRate(2_000, 80, 'zenith', 45)).toBeGreaterThan(fillRate(2_000, 0, 'zenith', 45));
    expect(fillRate(20_000, 0, 'zenith', 45)).toBeGreaterThan(fillRate(20_000, 0, 'zenith', 150));
    for (const v of [0, 100, 1e7]) {
      const f = fillRate(v, v, 'stade', 5, 3);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
  it('une grande salle demande plus de notoriété', () => {
    expect(fillRate(5_000, 0, 'bar', 10)).toBeGreaterThan(fillRate(5_000, 0, 'stade', 70));
  });
});

const setup = (fans: number) => {
  const s = newGame('conc');
  const d = s.engine.data;
  d.label.tresorerie = money.euros(1_000_000);
  scoutTalents(d, Rng.fromSeed('c'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  a.fanbase = fans;
  a.hype = 60;
  return { s, id: a.id };
};

describe('organisation', () => {
  it('débite la salle, tient le concert après le délai, encaisse la commission, fatigue et fait gagner des fans', () => {
    const { s, id } = setup(60_000);
    const before = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, {
      type: 'organiser-concert',
      artisteId: id,
      salle: 'club',
      prix: 18,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.engine.data.label.tresorerie).toBe(before - VENUES.club.cout);
    const art0 = r.session.engine.data.artistes[0];
    const fatigue0 = art0?.fatigue ?? 0;
    const fans0 = art0?.fanbase ?? 0;
    const run = labelGame.advance(r.session, CONCERTS.leadWeeks + 1);
    const d = run.session.engine.data;
    const c = d.concerts[0];
    expect(c?.resolu).toBe(true);
    expect(c?.spectateurs).toBeGreaterThan(0);
    expect(c?.spectateurs).toBeLessThanOrEqual(VENUES.club.capacite);
    expect(c?.recette).toBe(
      Math.round((cents((c?.spectateurs ?? 0) * 18 * 100) * CONCERTS.commissionBps) / 10_000),
    );
    expect(d.artistes[0]?.fatigue).toBeGreaterThan(fatigue0 - 10);
    expect(d.artistes[0]?.fanbase).toBeGreaterThan(fans0);
    expect(run.signals.some((x) => x.kind === 'concert')).toBe(true);
  });

  it('refuse un artiste non signé, une salle ou un prix invalide, un manque de fonds', () => {
    const { s, id } = setup(1000);
    expect(
      labelGame.dispatch(s, {
        type: 'organiser-concert',
        artisteId: id,
        salle: 'zzz' as never,
        prix: 10,
      }),
    ).toMatchObject({ ok: false, rejection: { code: 'salle-inconnue' } });
    expect(
      labelGame.dispatch(s, { type: 'organiser-concert', artisteId: id, salle: 'bar', prix: 0 }),
    ).toMatchObject({ ok: false, rejection: { code: 'prix-invalide' } });
    s.engine.data.label.tresorerie = cents(10);
    expect(
      labelGame.dispatch(s, { type: 'organiser-concert', artisteId: id, salle: 'bar', prix: 10 }),
    ).toMatchObject({ ok: false, rejection: { code: 'fonds-insuffisants' } });
    const art = s.engine.data.artistes[0];
    if (art) art.employeur = 'libre';
    s.engine.data.label.tresorerie = money.euros(1000);
    expect(
      labelGame.dispatch(s, { type: 'organiser-concert', artisteId: id, salle: 'bar', prix: 10 }),
    ).toMatchObject({ ok: false, rejection: { code: 'artiste-non-signe' } });
  });
});
