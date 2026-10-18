import { describe, expect, it } from 'vitest';
import { runBot } from './bots';
import { type PointValorisation, analyserDivergence } from './sim-longue';
import { labelScore } from './valuation';

const euros = (m: number): number => m * 1e8;
const serie = (valeurs: Record<number, number>): PointValorisation[] =>
  Object.entries(valeurs).map(([annee, m]) => ({ annee: Number(annee), valeur: euros(m) }));

describe('garde-fou de divergence', () => {
  it('accepte une croissance qui ralentit (mesures réelles de 30 ans)', () => {
    // Agressif, graine t30-a, puis prudent, graine t30-b : relevés de la simulation.
    expect(
      analyserDivergence(serie({ 5: 1.1, 10: 8, 15: 16, 20: 34.3, 25: 85, 30: 200.6 })).divergent,
    ).toBe(false);
    expect(
      analyserDivergence(serie({ 5: 1.5, 10: 12.3, 15: 38.6, 20: 84.5, 25: 155.6, 30: 261.1 }))
        .divergent,
    ).toBe(false);
    expect(
      analyserDivergence(serie({ 5: 0.4, 10: 8.3, 15: 53.5, 20: 140.3, 25: 272.1, 30: 467.4 }))
        .divergent,
    ).toBe(false);
    expect(
      analyserDivergence(serie({ 5: 2.4, 10: 24.1, 15: 96, 20: 285.6, 25: 772.1, 30: 1642.9 }))
        .divergent,
    ).toBe(false);
  });
  it('refuse une valorisation qui s’emballe', () => {
    const a = analyserDivergence(serie({ 5: 1, 10: 10, 15: 100, 20: 2000, 25: 40000, 30: 800000 }));
    expect(a.divergent).toBe(true);
    expect(a.raison).toContain('cinq ans');
  });
  it('refuse une croissance qui ne ralentit jamais', () => {
    // ×5 tous les cinq ans, sans jamais fléchir.
    const a = analyserDivergence(serie({ 5: 1, 10: 5, 15: 25, 20: 125, 25: 625, 30: 3125 }));
    expect(a.divergent).toBe(true);
    expect(a.raison).toContain('ralentit');
  });
  it('ignore les années manquantes (faillite avant 30 ans)', () => {
    expect(analyserDivergence(serie({ 5: 1, 10: 2 })).divergent).toBe(false);
  });
});

/**
 * Simulation réelle de 30 ans avec un bot : lente (de une à six minutes), donc lancée seulement à la
 * demande avec `pnpm sim:30ans`.
 */
describe.runIf(process.env['SIM_LONGUE'] === '1')('simulation de 30 ans', () => {
  for (const strategie of ['agressif', 'prudent'] as const) {
    it(`${strategie} ne diverge pas et ne fait pas faillite`, { timeout: 1_200_000 }, () => {
      const points: PointValorisation[] = [];
      const run = runBot(strategie, 't30-a', 1560, undefined, (semaines, etat) => {
        if (semaines % 52 === 0 && semaines / 52 >= 5)
          points.push({ annee: semaines / 52, valeur: labelScore(etat, semaines) });
      });
      expect(run.faillite).toBeNull();
      const a = analyserDivergence(points);
      expect(a.raison).toBeNull();
      expect(a.divergent).toBe(false);
    });
  }
});
