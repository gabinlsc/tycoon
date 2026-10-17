import { describe, expect, it } from 'vitest';
import { FEATURED_SLUG, GAMES, findGame } from './games';

describe('catalogue des jeux', () => {
  it('a des slugs et des sigles uniques', () => {
    const slugs = GAMES.map((g) => g.slug);
    const symbols = GAMES.map((g) => g.symbol);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(symbols).size).toBe(symbols.length);
  });

  it('a des slugs utilisables dans une URL', () => {
    for (const game of GAMES) expect(game.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('met en avant un jeu du catalogue', () => {
    expect(findGame(FEATURED_SLUG)).toBeDefined();
  });

  it('retourne undefined pour un slug inconnu', () => {
    expect(findGame('nope')).toBeUndefined();
    expect(findGame(undefined)).toBeUndefined();
  });
});
