import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  GENERATIONS,
  bilanDeGeneration,
  labelGame,
  legendes,
  naissanceEnfant,
  newGame,
  prendreRetraite,
  retraiteChance,
  scoutTalents,
} from './index';
import type { Artist } from './index';

const signe = () => {
  const session = newGame('gen');
  const d = session.engine.data;
  d.label.tresorerie = money.euros(500_000);
  scoutTalents(d, Rng.fromSeed('g'), 'plateforme', 0);
  const artiste = d.artistes.find((a) => a.employeur === 'libre');
  if (!artiste) throw new Error('artiste attendu');
  artiste.employeur = 'joueur';
  return { session, d, artiste };
};

const noop = () => undefined;

describe('retraite', () => {
  it('ne concerne que les artistes âgés, plus vite en déclin, moins en culte', () => {
    const base = { age: 60, phase: 'plateau' } as Pick<Artist, 'age' | 'phase'>;
    expect(retraiteChance({ ...base, age: GENERATIONS.retirementAge - 1 })).toBe(0);
    const normal = retraiteChance(base);
    expect(normal).toBeGreaterThan(0);
    expect(retraiteChance({ ...base, phase: 'declin' })).toBeGreaterThan(normal);
    expect(retraiteChance({ ...base, phase: 'culte' })).toBeLessThan(normal);
    expect(retraiteChance({ age: 120, phase: 'declin' })).toBeLessThanOrEqual(
      GENERATIONS.retirementMax,
    );
  });
  it('retire l’artiste du roster, garde son contrat et le range parmi les légendes', () => {
    const { d, artiste } = signe();
    artiste.fanbase = 2_000_000;
    d.contrats.push({
      id: 900,
      artisteId: artiste.id,
      clauses: {
        avance: 0 as never,
        royaltiesArtisteBps: 5000,
        dureeAnnees: 2,
        exclusivite: false,
        part360Bps: 0,
        clauseRachat: 0 as never,
      },
      signeLe: 0,
      echeance: 50,
      recette360: 0,
    });
    const signaux: string[] = [];
    prendreRetraite(d, artiste, 10, (s) => signaux.push(s.kind));
    expect(artiste.employeur).toBe('retraite');
    expect(signaux).toEqual(['retraite']);
    expect(d.contrats[0]?.echeance).toBeGreaterThan(500);
    expect(legendes(d).map((a) => a.id)).toContain(artiste.id);
  });
  it('un artiste obscur n’est pas une légende', () => {
    const { d, artiste } = signe();
    artiste.fanbase = 10;
    prendreRetraite(d, artiste, 10, noop);
    expect(legendes(d)).toHaveLength(0);
  });
});

describe('relève', () => {
  it('un enfant hérite du genre et du nom, avec une avance de loyauté si le parent était au label', () => {
    const { d, artiste } = signe();
    artiste.fanbase = 2_000_000;
    prendreRetraite(d, artiste, 10, noop);
    const enfant = naissanceEnfant(d, artiste, Rng.fromSeed('e'), noop);
    expect(enfant.parentId).toBe(artiste.id);
    expect(enfant.genre).toBe(artiste.genre);
    expect(enfant.nom).toBe(artiste.nom);
    expect(enfant.employeur).toBe('libre');
    expect(enfant.loyaute).toBeGreaterThanOrEqual(GENERATIONS.childLoyalty);
  });
  it('le bilan de fin d’année est déterministe', () => {
    const run = () => {
      const { d, artiste } = signe();
      artiste.age = 80;
      artiste.fanbase = 3_000_000;
      const rng = Rng.fromSeed('bilan');
      for (let i = 0; i < 5 && artiste.employeur !== 'retraite'; i += 1)
        bilanDeGeneration(d, artiste, i, rng, noop);
      return [artiste.employeur, d.artistes.length];
    };
    expect(run()).toEqual(run());
    expect(run()[0]).toBe('retraite');
  });
});

describe('parrainage par une légende', () => {
  it('une légende peut parrainer un jeune du même genre', () => {
    const { session, d, artiste } = signe();
    artiste.fanbase = 2_000_000;
    const jeune = d.artistes.find((a) => a.employeur === 'libre' && a.id !== artiste.id);
    if (!jeune) throw new Error('jeune attendu');
    jeune.employeur = 'joueur';
    jeune.genre = artiste.genre;
    jeune.phase = 'emergent';
    prendreRetraite(d, artiste, 10, noop);
    const r = labelGame.dispatch(session, {
      type: 'parrainer',
      mentorId: artiste.id,
      protegeId: jeune.id,
    });
    expect(r.ok).toBe(true);
  });
});

describe('simulation', () => {
  it('sur trente ans, des artistes prennent leur retraite sans bloquer le jeu', () => {
    let s = newGame('longue-vie');
    s = labelGame.advance(s, 52 * 30).session;
    const retraites = s.engine.data.artistes.filter((a) => a.employeur === 'retraite');
    expect(retraites.length).toBeGreaterThan(0);
    expect(retraites.every((a) => a.retraite !== undefined)).toBe(true);
  });
});
