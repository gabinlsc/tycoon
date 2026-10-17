import { describe, expect, it } from 'vitest';
import { FEATURED_SYMBOL, GAMES } from './games';

describe('catalogue des jeux', () => {
  it('a des symboles uniques', () => {
    const symbols = GAMES.map((g) => g.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it("ne relie les crossovers qu'à des jeux existants", () => {
    const symbols = new Set<string>(GAMES.map((g) => g.symbol));
    for (const game of GAMES) {
      for (const link of game.crossovers) expect(symbols.has(link.with)).toBe(true);
    }
  });

  it('met en avant un jeu du catalogue', () => {
    expect(GAMES.some((g) => g.symbol === FEATURED_SYMBOL)).toBe(true);
  });
});
