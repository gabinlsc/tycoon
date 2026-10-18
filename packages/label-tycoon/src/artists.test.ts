import { Rng, hashState } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  type Artist,
  GENRES,
  GENRE_IDS,
  LEVELS,
  PEAK_AGE,
  TRAITS,
  TRAIT_IDS,
  careerPhaseFor,
  generateArtist,
  generateWorld,
  initialMarket,
  initialState,
  defaultConfig,
  newGame,
  normalizeForCompare,
  notoriety,
  takenStageNames,
} from './index';
import type { TalentLevel } from './index';

const market = initialMarket();
const cities = ['Port-Lune', 'Vendel', 'Mont-Marais'];
const generate = (rng: Rng, id: number, taken: ReadonlySet<string> = new Set(), options = {}) =>
  generateArtist(rng, { id, market, cities, takenNames: taken }, options);

function population(count: number, seed: string, options = {}): Artist[] {
  const rng = Rng.fromSeed(seed);
  const artists: Artist[] = [];
  for (let i = 0; i < count; i += 1)
    artists.push(generate(rng, i + 1, takenStageNames(artists), options));
  return artists;
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const visibleAverage = (a: Artist) =>
  (a.plume + Math.max(a.flow, a.voix) + a.charisme + a.scene) / 4;

describe('notoriété et phase de carrière', () => {
  it('la notoriété est logarithmique et bornée', () => {
    expect(notoriety(0)).toBe(0);
    expect(notoriety(-5)).toBe(0);
    expect(notoriety(20_000_000)).toBeCloseTo(100, 6);
    expect(notoriety(1e12)).toBe(100);
    expect(notoriety(1000)).toBeGreaterThan(notoriety(100));
    // doubler la fanbase ajoute toujours à peu près le même nombre de points
    const gain1 = notoriety(2000) - notoriety(1000);
    const gain2 = notoriety(2_000_000) - notoriety(1_000_000);
    expect(Math.abs(gain1 - gain2)).toBeLessThan(0.2);
  });

  it("déduit la phase de l'âge par rapport au pic", () => {
    expect(careerPhaseFor(18, 28, 'espoir')).toBe('emergent');
    expect(careerPhaseFor(24, 28, 'espoir')).toBe('montee');
    expect(careerPhaseFor(28, 28, 'confirme')).toBe('pic');
    expect(careerPhaseFor(30, 28, 'confirme')).toBe('pic');
    expect(careerPhaseFor(33, 28, 'confirme')).toBe('plateau');
    expect(careerPhaseFor(40, 28, 'star')).toBe('declin');
    expect(careerPhaseFor(40, 28, 'amateur')).toBe('emergent');
  });
});

describe("génération d'un artiste", () => {
  it('est déterministe', () => {
    expect(population(40, 'a')).toEqual(population(40, 'a'));
    expect(population(40, 'a')).not.toEqual(population(40, 'b'));
  });

  it('respecte les invariants : entiers dans les bornes, genres existants (propriété)', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 8 }), (seed) => {
        for (const a of population(25, seed)) {
          for (const key of [
            'plume',
            'flow',
            'voix',
            'charisme',
            'scene',
            'potentiel',
            'ethique',
            'ego',
            'loyaute',
            'polyvalence',
            'hype',
            'moral',
            'fatigue',
            'rue',
          ] as const) {
            if (!Number.isInteger(a[key]) || a[key] < 0 || a[key] > 100) return false;
          }
          if (!Number.isInteger(a.fanbase) || a.fanbase < 0) return false;
          if (!Number.isInteger(a.age) || a.age < 16 || a.age > 42) return false;
          if (!(GENRE_IDS as readonly string[]).includes(a.genre)) return false;
          if (
            a.genresSecondaires.some(
              (g) => g === a.genre || !(GENRE_IDS as readonly string[]).includes(g),
            )
          )
            return false;
          if (new Set(a.genresSecondaires).size !== a.genresSecondaires.length) return false;
          if (a.potentiel < Math.round(visibleAverage(a))) return false;
          if (a.employeur !== 'libre' || a.affinite !== 0) return false;
        }
        return true;
      }),
      { numRuns: 40 },
    );
  });

  it('donne des noms de scène uniques et jamais exclus sur 800 artistes', () => {
    const artists = population(800, 'uniques');
    const keys = artists.map((a) => normalizeForCompare(a.nomScene));
    expect(new Set(keys).size).toBe(800);
  });

  it('attribue 1 à 3 traits compatibles entre eux', () => {
    for (const a of population(600, 'traits')) {
      expect(a.traits.length).toBeGreaterThanOrEqual(1);
      expect(a.traits.length).toBeLessThanOrEqual(3);
      expect(new Set(a.traits).size).toBe(a.traits.length);
      for (const t of a.traits) {
        for (const other of a.traits) {
          if (t !== other) expect(TRAITS[t].incompatibles).not.toContain(other);
        }
      }
    }
  });

  it('les incompatibilités de traits sont symétriques et connues', () => {
    for (const id of TRAIT_IDS) {
      for (const other of TRAITS[id].incompatibles) {
        expect(TRAIT_IDS).toContain(other);
        expect(TRAITS[other].incompatibles).toContain(id);
      }
    }
  });

  it("les niveaux sont ordonnés : une star est meilleure, plus connue et plus âgée qu'un amateur", () => {
    const levels: TalentLevel[] = ['amateur', 'espoir', 'confirme', 'star'];
    const stats = levels.map((level) => {
      const artists = population(300, `niv-${level}`, { level });
      return {
        skill: mean(artists.map(visibleAverage)),
        fans: mean(artists.map((a) => Math.log10(a.fanbase + 1))),
        hype: mean(artists.map((a) => a.hype)),
      };
    });
    for (let i = 1; i < stats.length; i += 1) {
      expect(stats[i]?.skill).toBeGreaterThan(stats[i - 1]?.skill ?? 0);
      expect(stats[i]?.fans).toBeGreaterThan(stats[i - 1]?.fans ?? 0);
      expect(stats[i]?.hype).toBeGreaterThan(stats[i - 1]?.hype ?? 0);
    }
  });

  it("respecte la fourchette de fans et d'âge de chaque niveau", () => {
    for (const level of Object.keys(LEVELS) as TalentLevel[]) {
      for (const a of population(150, `fourchette-${level}`, { level })) {
        expect(a.fanbase).toBeGreaterThanOrEqual(Math.floor(LEVELS[level].fansMin));
        expect(a.fanbase).toBeLessThanOrEqual(Math.ceil(LEVELS[level].fansMax));
        expect(a.age).toBeGreaterThanOrEqual(LEVELS[level].ageMin);
        expect(a.age).toBeLessThanOrEqual(LEVELS[level].ageMax);
      }
    }
  });

  it('le genre oriente le talent vocal (flow pour le rap, voix pour le R&B)', () => {
    const rappeurs = population(300, 'rap', { genre: 'rap', level: 'confirme' });
    const chanteurs = population(300, 'rnb', { genre: 'rnb', level: 'confirme' });
    expect(mean(rappeurs.map((a) => a.flow - a.voix))).toBeGreaterThan(10);
    expect(mean(chanteurs.map((a) => a.voix - a.flow))).toBeGreaterThan(10);
  });

  it("l'ego grimpe avec la notoriété (à traits comparables)", () => {
    const amateurs = population(400, 'ego-a', { level: 'amateur' });
    const stars = population(400, 'ego-s', { level: 'star' });
    expect(mean(stars.map((a) => a.ego))).toBeGreaterThan(mean(amateurs.map((a) => a.ego)) + 8);
  });

  it('les traits orientent les attributs cachés', () => {
    const artists = population(2000, 'traits-effets');
    const withTrait = (t: string) => artists.filter((a) => a.traits.includes(t as never));
    expect(mean(withTrait('diva').map((a) => a.ego))).toBeGreaterThan(
      mean(withTrait('humble').map((a) => a.ego)) + 20,
    );
    expect(mean(withTrait('loyal').map((a) => a.loyaute))).toBeGreaterThan(
      mean(withTrait('opportuniste').map((a) => a.loyaute)) + 20,
    );
    expect(mean(withTrait('bosseur').map((a) => a.ethique))).toBeGreaterThan(
      mean(withTrait('paresseux').map((a) => a.ethique)) + 15,
    );
  });

  it('place le pic de carrière autour de la valeur de la famille de genre', () => {
    const rap = population(600, 'pic-rap', { genre: 'rap' });
    const variete = population(600, 'pic-var', { genre: 'variete' });
    expect(Math.abs(mean(rap.map((a) => a.agePic)) - PEAK_AGE[GENRES.rap.famille])).toBeLessThan(1);
    expect(mean(variete.map((a) => a.agePic))).toBeGreaterThan(
      mean(rap.map((a) => a.agePic)) + 1.5,
    );
    for (const a of [...rap, ...variete]) {
      expect(a.agePic).toBeGreaterThanOrEqual(21);
      expect(a.agePic).toBeLessThanOrEqual(40);
    }
  });

  it("les phases de départ sont cohérentes avec l'âge", () => {
    for (const a of population(400, 'phases')) {
      expect(a.phase).toBe(careerPhaseFor(a.age, a.agePic, a.niveau));
    }
  });

  it('prend en compte les options imposées', () => {
    const a = generate(Rng.fromSeed('opt'), 7, new Set(), {
      level: 'star',
      genre: 'drill',
      origin: 'afrique',
      ville: 'Vendel',
    });
    expect(a).toMatchObject({
      id: 7,
      niveau: 'star',
      genre: 'drill',
      origine: 'afrique',
      ville: 'Vendel',
    });
  });

  it('tire sa ville dans la liste du monde', () => {
    for (const a of population(100, 'villes')) expect(cities).toContain(a.ville);
  });

  it('est une donnée simple sans référence partagée', () => {
    const a = generate(Rng.fromSeed('s'), 1);
    expect(() => hashState(a)).not.toThrow();
    const b = generate(Rng.fromSeed('s'), 1);
    a.traits.push('diva');
    expect(b.traits).not.toContain('diva' as never);
  });

  it('refuse un style de vie impossible : pas de genre à tirer sur un marché vide', () => {
    expect(() =>
      generateArtist(Rng.fromSeed('v'), {
        id: 1,
        market: { genres: {}, facteurStreaming: 1 },
        cities,
        takenNames: new Set(),
      }),
    ).toThrow(RangeError);
  });
});

describe('monde de départ', () => {
  it('génère 12 villes uniques et fictives, déduites de la seule graine', () => {
    const world = generateWorld('graine');
    expect(world.villes).toHaveLength(12);
    expect(new Set(world.villes.map(normalizeForCompare)).size).toBe(12);
    expect(generateWorld('graine')).toEqual(world);
    expect(generateWorld('autre').villes).not.toEqual(world.villes);
  });

  it("est dans l'état de départ, identique à chaque appel avec la même graine", () => {
    const a = initialState('x', defaultConfig());
    expect(a.villes).toEqual(generateWorld('x').villes);
    expect(a.artistes).toEqual([]);
    expect(hashState(newGame('x').engine)).toBe(hashState(newGame('x').engine));
    expect(hashState(newGame('x').engine)).not.toBe(hashState(newGame('y').engine));
  });
});
