import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { FESTIVALS, festivalOffer, labelGame, newGame, scoutTalents } from './index';
import type { Festival } from './index';

const fest = (over: Partial<Festival> = {}): Festival => ({
  id: 1,
  nom: 'Nova Fest',
  semaine: 30,
  notorieteMin: 30,
  cachet: money.euros(5000),
  artisteId: null,
  tete: false,
  tenu: false,
  ...over,
});

describe('offre', () => {
  it('refuse un artiste trop peu connu, accepte au minimum, tête d’affiche au-delà de la marge', () => {
    expect(festivalOffer(fest(), 10)).toBeNull();
    const mid = festivalOffer(fest({ notorieteMin: 10 }), 20);
    expect(mid?.tete).toBe(false);
    const head = festivalOffer(fest({ notorieteMin: 10 }), 5_000_000);
    expect(head?.tete).toBe(true);
    expect(head?.cachet).toBeGreaterThan(mid?.cachet ?? 0);
  });
});

describe('saison', () => {
  it('ouvre des festivals en été chaque année, de façon rejouable', () => {
    const run = () =>
      labelGame.advance(newGame('fest'), FESTIVALS.openWeek + 2).session.engine.data.festivals;
    const a = run();
    expect(a.length).toBeGreaterThanOrEqual(FESTIVALS.perYear);
    expect(
      a.every((f) => f.semaine >= FESTIVALS.summer.min && f.semaine <= FESTIVALS.summer.max),
    ).toBe(true);
    expect(run()).toEqual(a);
  });

  it('une candidature acceptée rapporte un cachet, de la hype, et de la crédibilité en tête d’affiche', () => {
    const s = labelGame.advance(newGame('fest2'), FESTIVALS.openWeek + 1).session;
    const d = s.engine.data;
    d.label.tresorerie = money.euros(100_000);
    scoutTalents(d, Rng.fromSeed('f'), 'plateforme', 0);
    const a = d.artistes[0];
    if (!a) throw new Error('artiste attendu');
    a.employeur = 'joueur';
    a.fanbase = 5_000_000;
    const f = d.festivals[0];
    if (!f) throw new Error('festival attendu');
    const hype0 = a.hype;
    const cred0 = d.label.credibilite[a.genre] ?? 0;
    const r = labelGame.dispatch(s, {
      type: 'candidater-festival',
      festivalId: f.id,
      artisteId: a.id,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(
      labelGame.dispatch(r.session, {
        type: 'candidater-festival',
        festivalId: f.id,
        artisteId: a.id,
      }),
    ).toMatchObject({ ok: false, rejection: { code: 'festival-complet' } });
    const run = labelGame.advance(r.session, f.semaine - FESTIVALS.openWeek + 2);
    expect(run.signals.some((x) => x.kind === 'festival')).toBe(true);
    const after = run.session.engine.data;
    expect(after.artistes[0]?.hype ?? 0).toBeGreaterThan(0);
    expect(after.label.credibilite[a.genre] ?? 0).toBeGreaterThan(cred0);
    void hype0;
  });

  it('refuse un artiste non signé ou trop peu connu', () => {
    const s = labelGame.advance(newGame('fest3'), FESTIVALS.openWeek + 1).session;
    const d = s.engine.data;
    scoutTalents(d, Rng.fromSeed('f'), 'plateforme', 0);
    const a = d.artistes[0];
    const f = d.festivals[0];
    if (!a || !f) throw new Error('données attendues');
    expect(
      labelGame.dispatch(s, { type: 'candidater-festival', festivalId: f.id, artisteId: a.id }),
    ).toMatchObject({ ok: false, rejection: { code: 'artiste-non-signe' } });
    a.employeur = 'joueur';
    a.fanbase = 1;
    expect(
      labelGame.dispatch(s, { type: 'candidater-festival', festivalId: f.id, artisteId: a.id }),
    ).toMatchObject({ ok: false, rejection: { code: 'candidature-refusee' } });
  });
});
