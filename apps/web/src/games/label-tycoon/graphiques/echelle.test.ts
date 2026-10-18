import { describe, expect, it } from 'vitest';
import { abrege, cheminAire, cheminLigne, graduations, plageDe, projeter } from './echelle';

describe('plage et projection', () => {
  it('englobe les valeurs, inclut zéro et n’est jamais vide', () => {
    expect(plageDe([3, 8])).toEqual({ min: 0, max: 8 });
    expect(plageDe([-5, 2])).toEqual({ min: -5, max: 2 });
    expect(plageDe([3, 8], false)).toEqual({ min: 3, max: 8 });
    expect(plageDe([])).toEqual({ min: 0, max: 1 });
    const plate = plageDe([4, 4], false);
    expect(plate.max).toBeGreaterThan(plate.min);
  });
  it('projette linéairement, y compris sur un axe inversé', () => {
    const p = { min: 0, max: 10 };
    expect(projeter(0, p, 0, 100)).toBe(0);
    expect(projeter(10, p, 0, 100)).toBe(100);
    expect(projeter(5, p, 100, 0)).toBe(50);
  });
});

describe('graduations', () => {
  it('sont rondes, croissantes et dans la plage', () => {
    const t = graduations({ min: 0, max: 87 });
    expect(t[0]).toBe(0);
    expect(t.every((v, i) => i === 0 || v > (t[i - 1] ?? 0))).toBe(true);
    expect(t.every((v) => v <= 87 + 1e-6)).toBe(true);
    expect(t.length).toBeGreaterThanOrEqual(3);
    expect(t.length).toBeLessThanOrEqual(9);
    expect((t[1] ?? 0) - (t[0] ?? 0)).toBe(20);
  });
  it('gèrent les plages négatives', () => {
    const t = graduations({ min: -50, max: 50 });
    expect(t).toContain(0);
    expect(Math.min(...t)).toBeGreaterThanOrEqual(-50);
  });
});

describe('tracés', () => {
  it('construisent une ligne et une aire refermée', () => {
    const pts = [
      { x: 0, y: 10 },
      { x: 5, y: 4 },
      { x: 10, y: 8 },
    ];
    expect(cheminLigne(pts)).toBe('M0.0,10.0 L5.0,4.0 L10.0,8.0');
    expect(cheminAire(pts, 20)).toBe('M0.0,10.0 L5.0,4.0 L10.0,8.0 L10.0,20.0 L0.0,20.0 Z');
    expect(cheminAire([], 20)).toBe('');
  });
});

describe('abréviations', () => {
  it('raccourcissent milliers et millions', () => {
    expect(abrege(950)).toBe('950');
    expect(abrege(1200)).toMatch(/1,2\s?k/);
    expect(abrege(3_400_000)).toMatch(/3,4\s?M/);
    expect(abrege(-2500)).toMatch(/-2,5\s?k/);
  });
});
