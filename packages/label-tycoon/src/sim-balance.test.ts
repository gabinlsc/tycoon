import { describe, expect, it } from 'vitest';
import { BOT_STRATEGIES, renderReport, simulate, summarize } from './index';

const options = { games: 2, weeks: 60, seedPrefix: 'test' };

describe('simulation d’équilibrage', () => {
  const results = simulate(options);

  it('joue chaque stratégie sur les mêmes graines', () => {
    expect(results).toHaveLength(BOT_STRATEGIES.length * options.games);
    expect(new Set(results.map((r) => r.graine)).size).toBe(options.games);
  });

  it('est déterministe', () => {
    expect(simulate(options)).toEqual(results);
  });

  it('résume par stratégie avec des taux valides', () => {
    for (const s of summarize(results)) {
      expect(s.parties).toBe(options.games);
      expect(s.tauxFaillite).toBeGreaterThanOrEqual(0);
      expect(s.tauxFaillite).toBeLessThanOrEqual(1);
    }
  });

  it('produit un rapport Markdown complet', () => {
    const report = renderReport(results, options);
    for (const strategy of BOT_STRATEGIES) expect(report).toContain(`| ${strategy} |`);
    expect(report).toContain('Stratégie gagnante');
    expect(report).toContain('Genres dominants');
  });
});
