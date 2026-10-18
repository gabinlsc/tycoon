import { Rng, hashState } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  COMEBACK,
  CULT,
  PROGRESSION,
  defaultConfig,
  generateArtist,
  initialMarket,
  initialState,
  labelGame,
  newId,
  progressionMultiplier,
  stepSkills,
  updatePhase,
  weeklyDecline,
  yearlyDeclineRoll,
} from './index';
import type { Artist } from './index';

const base = (over: Partial<Artist> = {}): Artist => ({
  ...generateArtist(
    Rng.fromSeed('c'),
    { id: 1, market: initialMarket(), cities: ['Vendel'], takenNames: new Set() },
    { level: 'espoir' },
  ),
  plume: 40,
  flow: 40,
  voix: 40,
  charisme: 40,
  scene: 40,
  potentiel: 80,
  ethique: 50,
  moral: 60,
  fatigue: 10,
  age: 22,
  agePic: 28,
  phase: 'montee',
  traits: [],
  retours: 0,
  fanbase: 50_000,
  rue: 50,
  hype: 20,
  ...over,
});

describe('progression', () => {
  it('progresse vers le potentiel sans jamais le dépasser', () => {
    const a = base();
    for (let i = 0; i < 52 * 15; i += 1) stepSkills(a);
    for (const s of [a.plume, a.flow, a.voix, a.charisme, a.scene]) {
      expect(s).toBeGreaterThan(40);
      expect(s).toBeLessThanOrEqual(80);
    }
  });

  it('progresse plus vite avec une bonne éthique, un bon moral et de bons producteurs', () => {
    const good = base({ ethique: 90, moral: 90 });
    const bad = base({ ethique: 10, moral: 20 });
    for (let i = 0; i < 100; i += 1) {
      stepSkills(good, { producerLevel: 90 });
      stepSkills(bad, { producerLevel: 20 });
    }
    expect(good.plume - 40).toBeGreaterThan((bad.plume - 40) * 2);
  });

  it("stagne quand l'artiste ne travaille pas assez, et s'effondre quand il est surmené", () => {
    const idle = progressionMultiplier(base(), { workload: 0 }).value;
    const optimal = progressionMultiplier(base(), { workload: 1 }).value;
    const overworked = progressionMultiplier(base(), { workload: 2 }).value;
    expect(idle).toBeLessThan(optimal * 0.2);
    expect(overworked).toBe(0);
    expect(optimal).toBeGreaterThan(0);
  });

  it('explique le multiplicateur terme par terme', () => {
    const m = progressionMultiplier(base({ traits: ['bosseur'] }));
    expect(m.terms.map((t) => t.key)).toEqual([
      'base',
      'ethique',
      'producteurs',
      'moral',
      'charge',
      'traits',
      'phase',
    ]);
    expect(m.terms.reduce((s, t) => s + t.contribution, 0)).toBeCloseTo(m.value, 9);
  });

  it('ne progresse plus au plateau ni en déclin', () => {
    for (const phase of ['plateau', 'declin'] as const) {
      expect(PROGRESSION.phaseMultiplier[phase]).toBe(0);
      expect(progressionMultiplier(base({ phase })).value).toBe(0);
    }
  });

  it('garde les compétences entre 0 et 100 (propriété)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.constantFrom('emergent', 'montee', 'pic', 'plateau', 'declin', 'culte' as const),
        (skill, potentiel, phase) => {
          const a = base({ plume: skill, flow: skill, potentiel, phase: phase as Artist['phase'] });
          for (let i = 0; i < 200; i += 1) stepSkills(a);
          return a.plume >= 0 && a.plume <= 100 && a.flow >= 0 && a.flow <= 100;
        },
      ),
    );
  });
});

describe('déclin', () => {
  it('fait perdre des points en déclin, de plus en plus avec les années', () => {
    const early = weeklyDecline(base({ phase: 'declin', age: 29, agePic: 28 }));
    const late = weeklyDecline(base({ phase: 'declin', age: 40, agePic: 28 }));
    expect(early).toBeGreaterThan(0);
    expect(late).toBeGreaterThan(early);
    expect(weeklyDecline(base({ phase: 'pic' }))).toBe(0);
  });

  it('un artiste culte décline presque pas', () => {
    const declin = weeklyDecline(base({ phase: 'declin', age: 35 }));
    const culte = weeklyDecline(base({ phase: 'culte', age: 35 }));
    expect(culte).toBeLessThan(declin * 0.2);
  });

  it('les compétences baissent bien en déclin', () => {
    const a = base({ phase: 'declin', age: 36, plume: 80, potentiel: 90 });
    for (let i = 0; i < 52 * 3; i += 1) stepSkills(a);
    expect(a.plume).toBeLessThan(80 - 5);
  });
});

describe('phases de carrière', () => {
  it("suivent l'âge et ne reculent jamais", () => {
    const a = base({ age: 20, agePic: 28, phase: 'emergent' });
    const seen: string[] = [];
    for (let age = 20; age <= 40; age += 1) {
      a.age = age;
      updatePhase(a);
      seen.push(a.phase);
    }
    const order = ['emergent', 'montee', 'pic', 'plateau', 'declin'];
    const ranks = seen.map((p) => order.indexOf(p));
    expect(ranks).toEqual([...ranks].sort((x, y) => x - y));
    expect(seen[seen.length - 1]).toBe('declin');
  });

  it('ne sort jamais du statut culte', () => {
    const a = base({ phase: 'culte', age: 20 });
    updatePhase(a);
    expect(a.phase).toBe('culte');
  });
});

describe('retour en grâce et statut culte', () => {
  const declining = () =>
    base({ phase: 'declin', age: 36, agePic: 28, ethique: 90, fanbase: 500_000, rue: 90 });

  it("ne fait rien pour un artiste qui n'est pas en déclin, mais consomme ses tirages", () => {
    const rng = Rng.fromSeed('x');
    const before = rng.snapshot();
    expect(yearlyDeclineRoll(base({ phase: 'pic' }), rng)).toBeNull();
    expect(rng.snapshot()).not.toEqual(before);
  });

  it('produit des retours et des statuts culte sur la durée, dans des proportions plausibles', () => {
    const rng = Rng.fromSeed('issues');
    const counts = { retour: 0, culte: 0, rien: 0 };
    for (let i = 0; i < 3000; i += 1) counts[yearlyDeclineRoll(declining(), rng) ?? 'rien'] += 1;
    const pComeback = COMEBACK.yearlyChance * 1.4;
    expect(counts.retour / 3000).toBeGreaterThan(pComeback * 0.75);
    expect(counts.retour / 3000).toBeLessThan(pComeback * 1.25);
    expect(counts.culte).toBeGreaterThan(100);
  });

  it('un retour en grâce relance la carrière : montée, nouveau pic, hype et moral', () => {
    const rng = Rng.fromSeed('r');
    for (let i = 0; i < 500; i += 1) {
      const a = declining();
      a.hype = 5;
      a.moral = 40;
      if (yearlyDeclineRoll(a, rng) === 'retour') {
        expect(a).toMatchObject({
          phase: 'montee',
          agePic: 36 + COMEBACK.newPeakShift,
          retours: 1,
        });
        expect(a.hype).toBe(5 + COMEBACK.hypeBoost);
        expect(a.moral).toBe(40 + COMEBACK.moralBoost);
        return;
      }
    }
    throw new Error('aucun retour en grâce en 500 essais');
  });

  it('limite le nombre de retours par carrière', () => {
    const rng = Rng.fromSeed('lim');
    for (let i = 0; i < 400; i += 1) {
      const a = { ...declining(), retours: COMEBACK.maxPerCareer };
      expect(yearlyDeclineRoll(a, rng)).not.toBe('retour');
    }
  });

  it('exige un noyau de fans pour devenir culte', () => {
    const rng = Rng.fromSeed('culte');
    for (let i = 0; i < 400; i += 1) {
      const a = { ...declining(), fanbase: CULT.minFanbase - 1, ethique: 0 };
      expect(yearlyDeclineRoll(a, rng)).not.toBe('culte');
    }
  });
});

describe('dans la simulation', () => {
  function roster() {
    const state = initialState('carriere', defaultConfig());
    state.config.difficulty.rivalAggression = 0;
    const rng = Rng.fromSeed('roster');
    for (let i = 0; i < 12; i += 1) {
      state.artistes.push(
        generateArtist(rng, {
          id: newId(state),
          market: state.marche,
          cities: state.villes,
          takenNames: new Set(state.artistes.map((x) => x.nomScene)),
        }),
      );
    }
    return state;
  }

  it("fait vieillir les artistes d'un an à chaque fin d'année", () => {
    const session = labelGame.newSession('carriere', roster());
    const ages = session.engine.data.artistes.map((a) => a.age);
    const after = labelGame.advance(session, 52).session.engine.data.artistes.map((a) => a.age);
    after.forEach((age, i) => expect(age).toBe((ages[i] ?? 0) + 1));
  });

  it('fait évoluer les compétences et les phases sur dix ans, sans jamais sortir des bornes', () => {
    const run = labelGame.advance(labelGame.newSession('carriere', roster()), 520).session.engine
      .data;
    for (const a of run.artistes) {
      for (const s of [a.plume, a.flow, a.voix, a.charisme, a.scene]) {
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThanOrEqual(100);
      }
    }
    expect(new Set(run.artistes.map((a) => a.phase)).size).toBeGreaterThan(1);
  });

  it('est déterministe et se rejoue au même hash', () => {
    const play = () => labelGame.advance(labelGame.newSession('carriere', roster()), 300).session;
    expect(hashState(play().engine)).toBe(hashState(play().engine));
  });

  it('signale les retours en grâce et les statuts culte', () => {
    const state = roster();
    for (const a of state.artistes)
      Object.assign(a, {
        phase: 'declin',
        age: 38,
        agePic: 27,
        ethique: 100,
        rue: 100,
        fanbase: 900_000,
      });
    let kinds = 0;
    for (let seed = 0; seed < 8 && kinds === 0; seed += 1) {
      const result = labelGame.advance(
        labelGame.newSession(`s${seed}`, structuredClone(state)),
        52,
      );
      kinds = result.signals.filter(
        (s) => s.kind === 'retour-en-grace' || s.kind === 'statut-culte',
      ).length;
    }
    expect(kinds).toBeGreaterThan(0);
  });
});
