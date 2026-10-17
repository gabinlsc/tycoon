import { describe, expect, it } from 'vitest';
import {
  dailyChallenge,
  dailyPodium,
  dayKey,
  previousDayKey,
  secondsUntilNextChallenge,
} from './daily';

describe('défi du jour', () => {
  it('change de jour à minuit heure de Paris', () => {
    // 22:30 UTC le 17 octobre = 00:30 à Paris le 18 (heure d'été)
    expect(dayKey(new Date(Date.UTC(2026, 9, 17, 22, 30)))).toBe('2026-10-18');
    expect(dayKey(new Date(Date.UTC(2026, 9, 17, 21, 30)))).toBe('2026-10-17');
  });

  it("compte à rebours jusqu'à minuit", () => {
    // 10:00 UTC = 12:00 à Paris : il reste douze heures
    expect(secondsUntilNextChallenge(new Date(Date.UTC(2026, 9, 17, 10, 0, 0)))).toBe(43_200);
  });

  it('donne la veille', () => {
    expect(previousDayKey(new Date(Date.UTC(2026, 9, 17, 10)))).toBe('2026-10-16');
  });

  it('produit le même défi pour tout le monde un jour donné', () => {
    expect(dailyChallenge('2026-10-17')).toEqual(dailyChallenge('2026-10-17'));
  });

  it('produit un podium décroissant et reproductible', () => {
    const podium = dailyPodium('2026-10-16');
    expect(podium).toEqual(dailyPodium('2026-10-16'));
    const [a, b, c] = podium;
    expect(a && b && c && a.score > b.score && b.score > c.score).toBe(true);
    expect(new Set(podium.map((p) => p.name)).size).toBe(3);
  });
});
