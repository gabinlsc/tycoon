import { Rng } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  QUALITY,
  baseQuality,
  estimateQuality,
  producerFit,
  scoutTalents,
  trackQuality,
} from './index';
import type { Producer, QualityInputs } from './index';
import { initialState, defaultConfig } from './index';

const inputs = (over: Partial<QualityInputs> = {}, producer?: Producer): QualityInputs => {
  const state = initialState('q', defaultConfig());
  scoutTalents(state, Rng.fromSeed('q'), 'plateforme', 0);
  const artist = state.artistes[0];
  if (!artist) throw new Error('artiste attendu');
  return {
    artist,
    genre: artist.genre,
    producer: producer ?? { niveau: 60, genre: artist.genre },
    studio: 50,
    mixage: 50,
    featuring: 0,
    ...over,
  };
};

describe("qualité d'un titre", () => {
  it('la base est la somme pondérée des termes', () => {
    const i = inputs();
    const base = baseQuality(i);
    expect(base.terms.map((t) => t.key)).toEqual([
      'talent',
      'producteur',
      'adequation',
      'studio',
      'mixage',
      'featuring',
    ]);
    const w = QUALITY.weights;
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 9);
    expect(base.value).toBeGreaterThanOrEqual(0);
    expect(base.value).toBeLessThanOrEqual(100);
  });

  it('un meilleur producteur et un meilleur studio relèvent la qualité', () => {
    const lo = baseQuality(inputs({ studio: 10 }, { niveau: 10, genre: 'zzz' })).value;
    const hi = baseQuality(inputs({ studio: 90 }, undefined)).value;
    expect(hi).toBeGreaterThan(lo);
    expect(producerFit({ niveau: 1, genre: 'a' }, 'a')).toBeGreaterThan(
      producerFit({ niveau: 1, genre: 'b' }, 'a'),
    );
  });

  it('le moral bas pénalise, le bruit est rejouable et le résultat reste borné (propriété)', () => {
    const i = inputs();
    const sad = { ...i, artist: { ...i.artist, moral: 0 } };
    const happy = { ...i, artist: { ...i.artist, moral: 100 } };
    const noNoise = (x: QualityInputs) => trackQuality(x, Rng.fromSeed('same')).value;
    expect(noNoise(happy)).toBeGreaterThan(noNoise(sad));
    expect(noNoise(i)).toBe(noNoise(i));
    fc.assert(
      fc.property(fc.string({ maxLength: 8 }), (seed) => {
        const q = trackQuality(i, Rng.fromSeed(seed)).value;
        return q >= 0 && q <= 100;
      }),
    );
  });
});

describe('estimation avant sortie', () => {
  it('contient toujours la qualité réelle et se resserre avec les niveaux (propriété)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        (q, eng, scout) => {
          const [lo, hi] = estimateQuality(q, eng, scout);
          return lo <= q && q <= hi;
        },
      ),
    );
    const wide = estimateQuality(50, 0, 0);
    const narrow = estimateQuality(50, 100, 100);
    expect(narrow[1] - narrow[0]).toBeLessThan(wide[1] - wide[0]);
  });
});
