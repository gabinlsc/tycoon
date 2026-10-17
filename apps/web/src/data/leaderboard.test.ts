import { describe, expect, it } from 'vitest';
import { weekKey, weeklyFortunes } from './leaderboard';

describe('classement de la semaine', () => {
  it('garde la même clé du lundi au dimanche', () => {
    // lundi 12 et dimanche 18 octobre 2026
    expect(weekKey(new Date(Date.UTC(2026, 9, 12, 10)))).toBe(
      weekKey(new Date(Date.UTC(2026, 9, 18, 10))),
    );
    expect(weekKey(new Date(Date.UTC(2026, 9, 19, 10)))).not.toBe(
      weekKey(new Date(Date.UTC(2026, 9, 18, 10))),
    );
  });

  it('est décroissant, numéroté et reproductible', () => {
    const rows = weeklyFortunes('semaine-test');
    expect(rows).toEqual(weeklyFortunes('semaine-test'));
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1]?.amount).toBeGreaterThan(rows[i]?.amount ?? Infinity);
    }
    expect(new Set(rows.map((r) => r.player)).size).toBe(rows.length);
  });
});
