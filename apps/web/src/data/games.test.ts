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

describe('catalogue et registre des jeux', () => {
  it('un jeu est « Disponible » exactement quand il est enregistré dans le registre', async () => {
    const { GAME_MODULES } = await import('../games/registry');
    for (const game of GAMES)
      expect(game.status === 'Disponible', game.slug).toBe(game.slug in GAME_MODULES);
  });

  it('Label Tycoon est disponible et mis en avant', () => {
    expect(findGame('label-tycoon')?.status).toBe('Disponible');
    expect(FEATURED_SLUG).toBe('label-tycoon');
  });
});
