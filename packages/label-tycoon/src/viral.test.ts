import { Rng } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { VIRALITY, fansGained, newGame, scoutTalents, viralStep } from './index';
import type { Projet } from './index';

const projet = (hit: number): Projet => ({
  id: 1,
  artisteId: 1,
  type: 'single',
  clip: 'aucun',
  studio: 50,
  producteur: 50,
  mixage: 0,
  debut: 0,
  fin: 3,
  retard: 0,
  statut: 'sortie',
  qualite: 70,
  sortieLe: 3,
  s1: 1000,
  hit,
  viral: null,
  derniers: 0,
  streams: 0,
});

const artist = () => {
  const s = newGame('v');
  scoutTalents(s.engine.data, Rng.fromSeed('v'), 'plateforme', 0);
  const a = s.engine.data.artistes[0];
  if (!a) throw new Error('artiste attendu');
  return a;
};

describe('conversion en fans', () => {
  it('croît avec les streams et le charisme', () => {
    expect(fansGained(10_000, 80)).toBeGreaterThan(fansGained(10_000, 20));
    expect(fansGained(20_000, 50)).toBeGreaterThan(fansGained(10_000, 50));
    expect(fansGained(0, 90)).toBe(0);
  });
});

describe('viralité', () => {
  it('se déclenche plus souvent avec un potentiel de hit élevé', () => {
    const count = (hit: number) => {
      const rng = Rng.fromSeed('c');
      let n = 0;
      for (let i = 0; i < 4000; i += 1) if (viralStep(projet(hit), artist(), rng)) n += 1;
      return n;
    };
    expect(count(1.5)).toBeGreaterThan(count(0.2));
  });

  it("dure entre 3 et 6 semaines, multiplie les streams puis s'éteint", () => {
    const rng = Rng.fromSeed('d');
    const p = projet(1);
    const a = artist();
    const hype = a.hype;
    let started = false;
    for (let i = 0; i < 5000 && !started; i += 1) started = viralStep(p, a, rng);
    expect(started).toBe(true);
    expect(p.viral?.mult).toBeGreaterThanOrEqual(VIRALITY.multiplier.min);
    expect(p.viral?.mult).toBeLessThanOrEqual(VIRALITY.multiplier.max);
    expect(a.hype).toBeGreaterThan(hype);
    const weeks = p.viral?.semaines ?? 0;
    expect(weeks).toBeGreaterThanOrEqual(VIRALITY.weeks.min);
    for (let i = 0; i < weeks; i += 1) viralStep(p, a, rng);
    expect(p.viral).toBeNull();
  });
});
