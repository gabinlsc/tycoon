import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { SYNC, labelGame, newGame, scoutTalents, syncOffersWeek } from './index';

const withRelease = (quality: number) => {
  const s = newGame('sync');
  const d = s.engine.data;
  scoutTalents(d, Rng.fromSeed('s'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  d.projets.push({
    id: 700,
    artisteId: a.id,
    type: 'single',
    clip: 'aucun',
    studio: 1,
    producteur: 1,
    mixage: 0,
    debut: 0,
    fin: 0,
    retard: 0,
    statut: 'sortie',
    qualite: quality,
    sortieLe: 0,
    s1: 0,
    hit: 0,
    viral: null,
    derniers: 0,
    certification: null,
    streams: 0,
  });
  return s;
};

describe('offres', () => {
  it('arrivent pour les bonnes sorties seulement, plafonnées, rejouables', () => {
    const run = (q: number) => {
      const s = withRelease(q);
      const sigs: string[] = [];
      for (let t = 1; t <= 600; t += 1)
        syncOffersWeek(s.engine.data, t, Rng.fromSeed(`o${t}`), (x) => sigs.push(x.kind));
      return { offers: s.engine.data.offresSynchro, sigs };
    };
    const good = run(85);
    expect(good.sigs.length).toBeGreaterThan(0);
    expect(good.offers.length).toBeLessThanOrEqual(SYNC.maxPending);
    expect(run(20).sigs).toHaveLength(0);
    expect(run(85)).toEqual(good);
  });

  it('expirent', () => {
    const s = withRelease(90);
    s.engine.data.offresSynchro.push({
      id: 5,
      projetId: 700,
      type: 'film',
      marque: 'Aurore',
      cachet: 1000,
      expire: 3,
    });
    syncOffersWeek(s.engine.data, 10, Rng.fromSeed('x'), () => undefined);
    expect(s.engine.data.offresSynchro.some((o) => o.id === 5)).toBe(false);
  });
});

describe('réponse', () => {
  it('accepter encaisse la part du label, donne hype et fans ; refuser ne coûte rien', () => {
    const s = withRelease(90);
    s.engine.data.offresSynchro.push({
      id: 5,
      projetId: 700,
      type: 'film',
      marque: 'Aurore',
      cachet: money.euros(20_000),
      expire: 99,
    });
    const a = s.engine.data.artistes[0];
    const fans = a?.fanbase ?? 0;
    const treso = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, { type: 'accepter-synchro', offreId: 5 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.session.engine.data;
    expect(d.label.tresorerie).toBe(
      treso + Math.round((money.euros(20_000) * SYNC.labelBps) / 10_000),
    );
    expect(d.artistes[0]?.fanbase).toBe(fans + SYNC.kinds.film.fans);
    expect(d.offresSynchro).toHaveLength(0);
    s.engine.data.offresSynchro.push({
      id: 6,
      projetId: 700,
      type: 'pub',
      marque: 'Vektor',
      cachet: 500,
      expire: 99,
    });
    const refused = labelGame.dispatch(s, { type: 'refuser-synchro', offreId: 6 });
    expect(refused.ok && refused.session.engine.data.offresSynchro.some((o) => o.id === 6)).toBe(
      false,
    );
    expect(labelGame.dispatch(s, { type: 'accepter-synchro', offreId: 123 })).toMatchObject({
      ok: false,
      rejection: { code: 'offre-introuvable' },
    });
  });
});
