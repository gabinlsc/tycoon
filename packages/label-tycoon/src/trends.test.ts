import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { TRENDS, cyclicPopularity, genreKeys, labelGame, newGame } from './index';

describe('cycles', () => {
  it('oscillent autour de la base, dans la limite des amplitudes', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 8 }), fc.integer({ min: 0, max: 2000 }), (i, t) => {
        const v = cyclicPopularity(50, i, t);
        return Math.abs(v - 50) <= TRENDS.slowAmplitude + TRENDS.seasonAmplitude + 1e-9;
      }),
    );
  });
  it('la composante saisonnière revient à la même valeur chaque année', () => {
    const a = cyclicPopularity(50, 1, 10);
    const b = cyclicPopularity(50, 1, 10 + TRENDS.seasonPeriod * (TRENDS.slowPeriod / 52));
    expect(Math.abs(a - b)).toBeLessThan(1e-6);
  });
});

describe('popularité dans la simulation', () => {
  it("reste dans [0, 100], bouge, revient vers la moyenne, et se rejoue à l'identique", () => {
    const run = () => labelGame.advance(newGame('trend'), 520).session.engine.data.marche;
    const a = run();
    const start = newGame('trend').engine.data.marche;
    for (const id of genreKeys(a)) {
      const g = a.genres[id];
      expect(g?.popularite).toBeGreaterThanOrEqual(0);
      expect(g?.popularite).toBeLessThanOrEqual(100);
      expect(Math.abs(g?.bruit ?? 0)).toBeLessThanOrEqual(TRENDS.noiseLimit);
    }
    expect(
      genreKeys(a).some((id) => a.genres[id]?.popularite !== start.genres[id]?.popularite),
    ).toBe(true);
    expect(run()).toEqual(a);
  });
  it('une volatilité plus forte écarte davantage les genres de leur base', () => {
    const spread = (volatility: number) => {
      const s = newGame('vol');
      s.engine.data.config.difficulty.marketVolatility = volatility;
      const m = labelGame.advance(s, 300).session.engine.data.marche;
      return genreKeys(m).reduce((sum, id) => sum + Math.abs(m.genres[id]?.bruit ?? 0), 0);
    };
    expect(spread(3)).toBeGreaterThan(spread(0.2));
  });
});
