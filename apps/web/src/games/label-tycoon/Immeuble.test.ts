import { describe, expect, it } from 'vitest';
import type { VueArtiste } from '@tycoon/label-tycoon';
import { etageDe } from './Immeuble';

const artiste = (p: Partial<VueArtiste>): VueArtiste =>
  ({ enProduction: false, fatigue: 10, moral: 80, ...p }) as VueArtiste;

describe('immeuble du label', () => {
  it('place chaque artiste selon son activité', () => {
    expect(etageDe(artiste({ enProduction: true }), true)).toBe('studio');
    expect(etageDe(artiste({ fatigue: 90 }), true)).toBe('bureaux');
    expect(etageDe(artiste({ moral: 20 }), true)).toBe('bureaux');
    expect(etageDe(artiste({}), true)).toBe('repetition');
    expect(etageDe(artiste({}), false)).toBe('bureaux');
  });
});
