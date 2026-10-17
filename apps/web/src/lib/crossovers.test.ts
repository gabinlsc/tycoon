import { describe, expect, it } from 'vitest';
import { GAMES } from '../data/games';
import { crossoverEdges, layoutNodes } from './crossovers';

describe('crossovers', () => {
  it('ne produit aucune paire en double', () => {
    const keys = crossoverEdges().map((e) => [e.from, e.to].sort().join('-'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('place chaque jeu une fois, dans le cadre', () => {
    const nodes = layoutNodes(600, 440, 60);
    expect(nodes).toHaveLength(GAMES.length);
    for (const n of nodes) {
      expect(n.x).toBeGreaterThanOrEqual(60 - 1e-6);
      expect(n.x).toBeLessThanOrEqual(540 + 1e-6);
      expect(n.y).toBeGreaterThanOrEqual(60 - 1e-6);
      expect(n.y).toBeLessThanOrEqual(380 + 1e-6);
    }
  });
});
