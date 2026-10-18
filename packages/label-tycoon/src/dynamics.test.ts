import { Rng, hashState } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DYNAMICS,
  adjustArtist,
  defaultConfig,
  driftArtist,
  generateArtist,
  initialMarket,
  initialState,
  labelGame,
  newGame,
  newId,
} from './index';
import type { Artist } from './index';

const artist = (over: Partial<Artist> = {}): Artist => ({
  ...generateArtist(
    Rng.fromSeed('dyn'),
    { id: 1, market: initialMarket(), cities: ['Vendel'], takenNames: new Set() },
    { level: 'confirme' },
  ),
  hype: 50,
  moral: 60,
  fatigue: 20,
  fanbase: 1000,
  rue: 40,
  affinite: 0,
  ...over,
});

describe('dérive hebdomadaire', () => {
  it('la hype baisse de 5 % par semaine', () => {
    const a = artist({ hype: 80 });
    driftArtist(a);
    expect(a.hype).toBe(76);
  });

  it('la hype converge vers 0 sans jamais devenir négative', () => {
    const a = artist({ hype: 100 });
    for (let i = 0; i < 300; i += 1) driftArtist(a);
    expect(a.hype).toBeGreaterThanOrEqual(0);
    expect(a.hype).toBeLessThan(0.1);
  });

  it('le moral revient vers 60, par le haut comme par le bas', () => {
    const high = artist({ moral: 100, fatigue: 0 });
    const low = artist({ moral: 10, fatigue: 0 });
    for (let i = 0; i < 80; i += 1) {
      driftArtist(high);
      driftArtist(low);
    }
    expect(Math.abs(high.moral - DYNAMICS.moralTarget)).toBeLessThan(1);
    expect(Math.abs(low.moral - DYNAMICS.moralTarget)).toBeLessThan(1);
  });

  it('un artiste épuisé voit son moral baisser, pas remonter', () => {
    const tired = artist({ moral: 60, fatigue: 95 });
    driftArtist(tired);
    expect(tired.moral).toBeLessThan(60);
    const rested = artist({ moral: 60, fatigue: 20 });
    driftArtist(rested);
    expect(rested.moral).toBe(60);
  });

  it("la fatigue se résorbe jusqu'à 0", () => {
    const a = artist({ fatigue: 30 });
    for (let i = 0; i < 20; i += 1) driftArtist(a);
    expect(a.fatigue).toBe(0);
  });

  it('ne touche ni la fanbase ni les compétences', () => {
    const a = artist();
    const before = { fanbase: a.fanbase, plume: a.plume, flow: a.flow, voix: a.voix, rue: a.rue };
    for (let i = 0; i < 50; i += 1) driftArtist(a);
    expect({ fanbase: a.fanbase, plume: a.plume, flow: a.flow, voix: a.voix, rue: a.rue }).toEqual(
      before,
    );
  });
});

describe('variations appliquées par les systèmes', () => {
  it('applique les deltas et garde chaque attribut dans ses bornes (propriété)', () => {
    fc.assert(
      fc.property(
        fc.record({
          hype: fc.double({ min: -500, max: 500, noNaN: true }),
          moral: fc.double({ min: -500, max: 500, noNaN: true }),
          fatigue: fc.double({ min: -500, max: 500, noNaN: true }),
          fans: fc.double({ min: -1e7, max: 1e7, noNaN: true }),
          rue: fc.double({ min: -500, max: 500, noNaN: true }),
          affinite: fc.double({ min: -500, max: 500, noNaN: true }),
        }),
        (delta) => {
          const a = artist();
          adjustArtist(a, delta);
          return (
            a.hype >= 0 &&
            a.hype <= 100 &&
            a.moral >= 0 &&
            a.moral <= 100 &&
            a.fatigue >= 0 &&
            a.fatigue <= 100 &&
            a.rue >= 0 &&
            a.rue <= 100 &&
            a.affinite >= -100 &&
            a.affinite <= 100 &&
            Number.isInteger(a.fanbase) &&
            a.fanbase >= 0
          );
        },
      ),
    );
  });

  it('ajoute et retire des fans, sans passer sous zéro', () => {
    const a = artist({ fanbase: 1000 });
    adjustArtist(a, { fans: 250.6 });
    expect(a.fanbase).toBe(1251);
    adjustArtist(a, { fans: -999_999 });
    expect(a.fanbase).toBe(0);
  });

  it('un delta vide ne change rien', () => {
    const a = artist();
    const before = JSON.stringify(a);
    adjustArtist(a, {});
    expect(JSON.stringify(a)).toBe(before);
  });
});

describe('dans la simulation', () => {
  function withRoster() {
    const state = initialState('roster', defaultConfig());
    state.config.difficulty.rivalAggression = 0;
    for (let i = 0; i < 5; i += 1) {
      state.artistes.push(
        generateArtist(
          Rng.fromSeed(`a${i}`),
          {
            id: newId(state),
            market: state.marche,
            cities: state.villes,
            takenNames: new Set(state.artistes.map((x) => x.nomScene.toLowerCase())),
          },
          { level: 'star' },
        ),
      );
    }
    return state;
  }

  it('fait retomber la hype de tout le roster semaine après semaine', () => {
    const session = labelGame.newSession('roster', withRoster());
    const before = session.engine.data.artistes.map((a) => a.hype);
    const after = labelGame.advance(session, 10).session.engine.data.artistes.map((a) => a.hype);
    after.forEach((h, i) => expect(h).toBeLessThan(before[i] ?? 0));
  });

  it('reste déterministe et rejouable', () => {
    const run = () => labelGame.advance(labelGame.newSession('roster', withRoster()), 40).session;
    expect(hashState(run().engine)).toBe(hashState(run().engine));
  });

  it('une partie vide traverse la phase sans erreur', () => {
    expect(labelGame.advance(newGame('vide'), 5).session.engine.tick).toBe(5);
  });
});
