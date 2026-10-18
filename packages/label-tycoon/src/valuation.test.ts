import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  discount,
  labelScore,
  labelGame,
  newGame,
  releaseValue,
  scoutTalents,
  valuation,
} from './index';

const withRelease = () => {
  const s = newGame('val');
  const d = s.engine.data;
  scoutTalents(d, Rng.fromSeed('v'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  d.projets.push({
    id: 800,
    artisteId: a.id,
    type: 'single',
    clip: 'aucun',
    studio: 1,
    producteur: 1,
    mixage: 0,
    debut: 0,
    fin: 0,
    retard: 0,
    statut: 'sortie',
    qualite: 80,
    sortieLe: 0,
    s1: 500_000,
    hit: 1,
    viral: null,
    derniers: 0,
    certification: null,
    streams: 0,
  });
  return s;
};

describe('actualisation', () => {
  it('décroît avec le temps et vaut 1 à zéro', () => {
    expect(discount(0)).toBe(1);
    expect(discount(104)).toBeLessThan(discount(52));
  });
});

describe('catalogue', () => {
  it('vaut plus pour une sortie récente et de bonne qualité', () => {
    const s = withRelease();
    const fresh = releaseValue(s.engine.data, 800, 1);
    expect(fresh).toBeGreaterThan(0);
    expect(releaseValue(s.engine.data, 800, 200)).toBeLessThan(fresh);
    const p = s.engine.data.projets[0];
    if (p) p.qualite = 20;
    expect(releaseValue(s.engine.data, 800, 1)).toBeLessThan(fresh);
    expect(releaseValue(s.engine.data, 999, 1)).toBe(0);
  });
});

describe('valorisation', () => {
  it('somme trésorerie, catalogue, contrats et dettes, avec le détail', () => {
    const s = withRelease();
    const d = s.engine.data;
    d.prets.push({
      id: 1,
      restant: money.euros(10_000),
      capital: money.euros(10_000),
      tauxBps: 500,
      semainesRestantes: 50,
    });
    const v = valuation(d, 1);
    expect(v.terms.map((t) => t.key)).toEqual(['tresorerie', 'catalogue', 'contrats', 'dettes']);
    expect(v.value).toBeCloseTo(
      v.terms.reduce((x, t) => x + t.contribution, 0),
      6,
    );
    expect(v.terms.find((t) => t.key === 'dettes')?.contribution).toBe(-money.euros(10_000));
  });
  it('le score retranche la part des investisseurs et reste positif', () => {
    const s = withRelease();
    const d = s.engine.data;
    const base = labelScore(d, 1);
    d.investisseurs.push({
      id: 5,
      nom: 'x',
      apport: 1,
      partBps: 2000,
      objectifCA: 0,
      echeance: 99,
      statut: 'actif',
    });
    expect(labelScore(d, 1)).toBeLessThan(base);
    d.label.tresorerie = money.euros(-9_999_999);
    expect(labelScore(d, 1)).toBeGreaterThanOrEqual(0);
    expect(labelGame.advance(s, 3).session.engine.data.projets).toHaveLength(1);
  });
});
