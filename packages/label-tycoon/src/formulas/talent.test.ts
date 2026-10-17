import { Rng, dominantTerms } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { GENRES, artisticTalent, generateArtist, initialMarket, termLabel } from '../index';

const make = (genre: string, over: Record<string, number> = {}) => {
  const artist = generateArtist(
    Rng.fromSeed('t'),
    { id: 1, market: initialMarket(), cities: ['Vendel'], takenNames: new Set() },
    { genre, level: 'confirme' },
  );
  return { ...artist, ...over };
};

describe('talent artistique', () => {
  it('combine plume et flow dans un genre « flow »', () => {
    const a = make('rap', { plume: 80, flow: 60, voix: 10 });
    const r = artisticTalent(a, 'rap');
    const w = GENRES.rap.poidsPlume;
    expect(r.value).toBeCloseTo(80 * w + 60 * (1 - w), 10);
    expect(r.terms.map((t) => t.key)).toEqual(['plume', 'flow', 'bornes']);
  });

  it('combine plume et voix dans un genre « voix »', () => {
    const a = make('rnb', { plume: 50, flow: 10, voix: 90 });
    const r = artisticTalent(a, 'rnb');
    const w = GENRES.rnb.poidsPlume;
    expect(r.value).toBeCloseTo(50 * w + 90 * (1 - w), 10);
    expect(r.terms.map((t) => t.key)).toEqual(['plume', 'voix', 'bornes']);
  });

  it('prend la moyenne du flow et de la voix dans un genre « mixte »', () => {
    const a = make('afro', { plume: 40, flow: 80, voix: 60 });
    const r = artisticTalent(a, 'afro');
    const w = GENRES.afro.poidsPlume;
    expect(r.value).toBeCloseTo(40 * w + 70 * (1 - w), 10);
    expect(r.terms.map((t) => t.key)).toEqual(['plume', 'flow', 'voix', 'bornes']);
  });

  it('se rabat sur un genre mixte pour un genre inconnu (sous-genre fictif)', () => {
    const a = make('rap', { plume: 30, flow: 70, voix: 50 });
    expect(artisticTalent(a, 'sous-genre-fictif').value).toBeCloseTo(30 * 0.35 + 60 * 0.65, 10);
  });

  it('reste entre 0 et 100, et ses contributions expliquent la valeur (propriété)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.constantFrom(...Object.keys(GENRES)),
        (plume, flow, voix, genre) => {
          const r = artisticTalent(make(genre, { plume, flow, voix }), genre);
          const sum = r.terms.reduce((acc, t) => acc + t.contribution, 0);
          return r.value >= 0 && r.value <= 100 && Math.abs(sum - r.value) < 1e-9;
        },
      ),
    );
  });

  it("désigne le terme dominant pour l'infobulle", () => {
    const r = artisticTalent(make('rap', { plume: 20, flow: 95, voix: 0 }), 'rap');
    expect(dominantTerms(r, 1)[0]?.key).toBe('flow');
  });

  it('chaque terme produit un libellé français, avec repli sur la clé', () => {
    expect(termLabel('plume')).toBe('Plume');
    expect(termLabel('flow')).toBe('Flow');
    expect(termLabel('inconnu-xyz')).toBe('inconnu-xyz');
  });
});
