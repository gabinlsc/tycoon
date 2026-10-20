// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { GAMES } from '../data/games';
import { OFFRES, offreDe } from './pass';

describe('Pass Tycoon', () => {
  it('couvre les six jeux du portail avec trois offres croissantes', () => {
    expect(GAMES).toHaveLength(6);
    expect(OFFRES.map((o) => o.id)).toEqual(['gratuit', 'pro', 'legende']);
    expect(offreDe('legende').prixMensuel).toBeGreaterThan(offreDe('pro').prixMensuel);
  });
});
