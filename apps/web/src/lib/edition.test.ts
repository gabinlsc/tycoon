import { describe, expect, it } from 'vitest';
import { editionNumber, formatLongDate } from './edition';

describe('édition', () => {
  it('numérote 1 le jour du lancement', () => {
    expect(editionNumber(new Date(2026, 0, 5, 23, 59))).toBe(1);
  });

  it("incrémente de un par jour, quelle que soit l'heure", () => {
    expect(editionNumber(new Date(2026, 0, 6, 0, 1))).toBe(2);
    expect(editionNumber(new Date(2026, 9, 17, 12))).toBe(286);
  });

  it('écrit la date en français', () => {
    expect(formatLongDate(new Date(2026, 9, 17))).toBe('samedi 17 octobre 2026');
  });
});
