import { Rng, money } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  STREAMS,
  cumulativeStreams,
  decayRate,
  hitPotential,
  labelGame,
  marketingFactor,
  newGame,
  scoutTalents,
  weeklyStreams,
} from './index';

describe('formules de streams', () => {
  it('le potentiel de hit croît avec la qualité, la tendance, la hype et le marketing', () => {
    const h = (q: number, t = 1, hype = 0, m = 1) => hitPotential(q, t, hype, m).value;
    expect(h(80)).toBeGreaterThan(h(40));
    expect(h(60, 1.4)).toBeGreaterThan(h(60, 0.6));
    expect(h(60, 1, 80)).toBeGreaterThan(h(60, 1, 0));
    expect(marketingFactor(20_000)).toBeGreaterThan(marketingFactor(0));
    expect(marketingFactor(1e9)).toBeLessThanOrEqual(STREAMS.marketingCap);
  });

  it('une meilleure qualité décroît plus lentement', () => {
    expect(decayRate(90)).toBeLessThan(decayRate(20));
  });

  it('le cumul en forme fermée égale la somme semaine par semaine (propriété)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 80 }),
        fc.integer({ min: 0, max: 80 }),
        (s1, q, a, b) => {
          const from = Math.min(a, b);
          const to = Math.max(a, b);
          let sum = 0;
          for (let t = from; t <= to; t += 1) sum += weeklyStreams(s1, q, t);
          return Math.abs(sum - cumulativeStreams(s1, q, from, to)) <= 1e-6 * Math.max(1, sum);
        },
      ),
    );
  });

  it('après la fenêtre active, il ne reste que la traîne constante', () => {
    const late = weeklyStreams(1000, 50, STREAMS.activeWindow + 10);
    expect(late).toBeCloseTo(1000 * STREAMS.tail, 9);
    expect(weeklyStreams(1000, 50, STREAMS.activeWindow + 50)).toBeCloseTo(late, 9);
  });
});

describe('dans la simulation', () => {
  it('une sortie rapporte des streams et du revenu au label, de façon rejouable', () => {
    const run = () => {
      const session = newGame('str');
      const d = session.engine.data;
      d.label.tresorerie = money.euros(500_000);
      d.batiments.niveaux.studio = 5;
      scoutTalents(d, Rng.fromSeed('s'), 'plateforme', 0);
      const artist = d.artistes[0];
      if (!artist) throw new Error('artiste attendu');
      artist.employeur = 'joueur';
      artist.fanbase = 20_000;
      const l = labelGame.dispatch(session, {
        type: 'lancer-projet',
        artisteId: artist.id,
        sortie: 'single',
        clip: 'aucun',
        studio: 60,
        producteur: 60,
        mixage: money.euros(800),
      });
      if (!l.ok) throw new Error('lancement attendu');
      const fin = l.session.engine.data.projets[0]?.fin ?? 0;
      const ready = labelGame.advance(l.session, fin + 1).session;
      const out = labelGame.dispatch(ready, {
        type: 'sortir-projet',
        projetId: ready.engine.data.projets[0]?.id ?? 0,
      });
      if (!out.ok) throw new Error('sortie attendue');
      const before = out.session.engine.data.label.tresorerie;
      const after = labelGame.advance(out.session, 10).session.engine.data;
      return { projet: after.projets[0], gain: after.label.tresorerie - before };
    };
    const a = run();
    expect(a.projet?.s1).toBeGreaterThan(0);
    expect(a.projet?.streams).toBeGreaterThan(0);
    expect(run()).toEqual(a);
  });
});
