import { Rng, cents, hashState, money } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  HIDDEN_ATTRIBUTES,
  SCOUTING,
  SOURCES,
  VISIBLE_ATTRIBUTES,
  defaultConfig,
  describeRejection,
  initialState,
  knownRange,
  labelGame,
  newGame,
  rangeWidth,
  scoutTalents,
} from './index';
import type { LabelAction, ScoutSource } from './index';

const SOURCE_IDS = Object.keys(SOURCES) as ScoutSource[];
const scouted = (source: ScoutSource = 'plateforme', seed = 'rep') => {
  const state = initialState(seed, defaultConfig());
  scoutTalents(state, Rng.fromSeed(seed), source, 0);
  return state;
};

describe('fourchettes', () => {
  it("contiennent toujours la valeur réelle, à tout moment de l'observation (propriété)", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 6 }),
        fc.constantFrom(...SOURCE_IDS),
        fc.integer({ min: 0, max: 400 }),
        fc.integer({ min: 0, max: 100 }),
        (seed, source, weeks, level) => {
          const state = scouted(source, seed);
          for (const prospect of state.suivis) {
            prospect.observations = weeks;
            prospect.essai = true;
            const artist = state.artistes.find((a) => a.id === prospect.artisteId);
            if (!artist) return false;
            for (const attribute of [...VISIBLE_ATTRIBUTES, ...HIDDEN_ATTRIBUTES]) {
              const range = knownRange(prospect, artist, attribute, level);
              if (!range || artist[attribute] < range[0] || artist[attribute] > range[1])
                return false;
            }
          }
          return true;
        },
      ),
      { numRuns: 80 },
    );
  });

  it("se resserrent avec le temps d'observation et avec le niveau du dénicheur", () => {
    const state = scouted();
    const prospect = state.suivis[0];
    const artist = state.artistes[0];
    if (!prospect || !artist) throw new Error('attendu');
    const width = (obs: number, level = 0) => {
      const r = knownRange({ ...prospect, observations: obs }, artist, 'plume', level);
      return r ? r[1] - r[0] : -1;
    };
    expect(width(0)).toBeGreaterThan(width(8));
    expect(width(8)).toBeGreaterThan(width(40));
    expect(width(0)).toBeGreaterThan(width(0, 75));
    expect(rangeWidth('plateforme', 'plume', 1000)).toBe(SCOUTING.minWidth);
  });

  it("une source floue donne des fourchettes plus larges qu'une source précise", () => {
    expect(rangeWidth('candidature', 'plume', 0)).toBeGreaterThan(
      rangeWidth('plateforme', 'plume', 0),
    );
    expect(rangeWidth('open-mic', 'plume', 0)).toBeGreaterThan(
      rangeWidth('plateforme', 'plume', 0),
    );
  });

  it("les attributs cachés sont invisibles avant l'essai, puis plus flous que les visibles", () => {
    const state = scouted();
    const prospect = state.suivis[0];
    const artist = state.artistes[0];
    if (!prospect || !artist) throw new Error('attendu');
    for (const attribute of HIDDEN_ATTRIBUTES)
      expect(knownRange(prospect, artist, attribute)).toBeNull();
    for (const attribute of VISIBLE_ATTRIBUTES)
      expect(knownRange(prospect, artist, attribute)).not.toBeNull();
    prospect.essai = true;
    expect(rangeWidth('plateforme', 'potentiel', 0)).toBeGreaterThan(
      rangeWidth('plateforme', 'plume', 0),
    );
    expect(knownRange(prospect, artist, 'potentiel')).not.toBeNull();
  });

  it('ne révèle pas la vérité par le centre de la fourchette (le décalage est fixe)', () => {
    const state = scouted('open-mic', 'centre');
    const offCenter = state.suivis.filter((p) => {
      const artist = state.artistes.find((a) => a.id === p.artisteId);
      const r = artist ? knownRange(p, artist, 'plume') : null;
      return r && Math.abs((r[0] + r[1]) / 2 - (artist?.plume ?? 0)) >= 1;
    });
    expect(offCenter.length).toBeGreaterThan(0);
  });

  it('borne les fourchettes entre 0 et 100', () => {
    const state = scouted('candidature');
    for (const p of state.suivis) {
      const artist = state.artistes.find((a) => a.id === p.artisteId);
      if (!artist) continue;
      const r = knownRange(p, artist, 'plume');
      expect(r?.[0]).toBeGreaterThanOrEqual(0);
      expect(r?.[1]).toBeLessThanOrEqual(100);
    }
  });
});

describe('découverte de talents', () => {
  it('crée des talents libres, suivis, aux noms uniques', () => {
    const state = scouted('plateforme');
    expect(state.artistes).toHaveLength(SOURCES.plateforme.count);
    expect(state.suivis).toHaveLength(SOURCES.plateforme.count);
    expect(state.artistes.every((a) => a.employeur === 'libre')).toBe(true);
    expect(new Set(state.artistes.map((a) => a.id)).size).toBe(state.artistes.length);
  });

  it('une source de genre ne remonte que ses genres (battle)', () => {
    const state = initialState('b', defaultConfig());
    const rng = Rng.fromSeed('b');
    for (let i = 0; i < 20; i += 1) scoutTalents(state, rng, 'battle', i);
    for (const a of state.artistes) expect(SOURCES.battle.genres).toContain(a.genre);
  });

  it('les sources se distinguent par le niveau des talents', () => {
    const mean = (source: ScoutSource) => {
      const state = initialState('n', defaultConfig());
      const rng = Rng.fromSeed('n');
      for (let i = 0; i < 80; i += 1) scoutTalents(state, rng, source, i);
      return (
        state.artistes.reduce((s, a) => s + (a.plume + a.charisme) / 2, 0) / state.artistes.length
      );
    };
    expect(mean('plateforme')).toBeGreaterThan(mean('candidature'));
  });
});

describe('actions du joueur', () => {
  it("repérer coûte de l'argent et ajoute des talents suivis", () => {
    const before = newGame('a');
    const result = labelGame.dispatch(before, { type: 'reperer', source: 'plateforme' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.session.engine.data;
    expect(data.label.tresorerie).toBe(
      before.engine.data.label.tresorerie - SOURCES.plateforme.cost,
    );
    expect(data.suivis).toHaveLength(SOURCES.plateforme.count);
    expect(result.signals[0]).toMatchObject({ kind: 'talents-reperes' });
  });

  it('refuse sans fonds, avec un message lisible, sans rien changer', () => {
    const session = newGame('a');
    session.engine.data.label.tresorerie = cents(100);
    const result = labelGame.dispatch(session, { type: 'reperer', source: 'plateforme' });
    expect(result).toMatchObject({ ok: false, rejection: { code: 'fonds-insuffisants' } });
    if (!result.ok) expect(describeRejection(result.rejection)).toContain('Fonds insuffisants');
    expect(session.engine.data.suivis).toHaveLength(0);
  });

  it('la candidature spontanée est gratuite', () => {
    const before = newGame('a');
    const result = labelGame.dispatch(before, { type: 'reperer', source: 'candidature' });
    expect(result.ok && result.session.engine.data.label.tresorerie).toBe(
      before.engine.data.label.tresorerie,
    );
  });

  it('refuse une source inconnue et plafonne le nombre de talents suivis', () => {
    const session = newGame('a');
    expect(
      labelGame.dispatch(session, { type: 'reperer', source: 'telepathie' as ScoutSource }),
    ).toMatchObject({ ok: false, rejection: { code: 'source-inconnue' } });
    let current = session;
    let refused = false;
    for (let i = 0; i < 20 && !refused; i += 1) {
      const r = labelGame.dispatch(current, { type: 'reperer', source: 'candidature' });
      if (r.ok) current = r.session;
      else refused = r.rejection.code === 'trop-de-suivis';
    }
    expect(refused).toBe(true);
    expect(current.engine.data.suivis.length).toBeLessThanOrEqual(SCOUTING.maxFollowed);
  });

  it('abandonner un suivi le retire de la liste mais laisse le talent dans le monde', () => {
    let session = newGame('a');
    const scoutResult = labelGame.dispatch(session, { type: 'reperer', source: 'candidature' });
    if (!scoutResult.ok) throw new Error('attendu');
    session = scoutResult.session;
    const id = session.engine.data.suivis[0]?.artisteId ?? -1;
    const dropped = labelGame.dispatch(session, { type: 'abandonner-suivi', artisteId: id });
    expect(dropped.ok).toBe(true);
    if (!dropped.ok) return;
    expect(dropped.session.engine.data.suivis.some((p) => p.artisteId === id)).toBe(false);
    expect(dropped.session.engine.data.artistes.some((a) => a.id === id)).toBe(true);
    expect(
      labelGame.dispatch(dropped.session, { type: 'abandonner-suivi', artisteId: id }),
    ).toMatchObject({ ok: false, rejection: { code: 'suivi-introuvable' } });
  });

  it("l'essai en studio révèle les attributs cachés, une seule fois", () => {
    let session = newGame('a');
    const first = labelGame.dispatch(session, { type: 'reperer', source: 'plateforme' });
    if (!first.ok) throw new Error('attendu');
    session = first.session;
    const id = session.engine.data.suivis[0]?.artisteId ?? -1;
    const trial = labelGame.dispatch(session, { type: 'essai-studio', artisteId: id });
    expect(trial.ok).toBe(true);
    if (!trial.ok) return;
    expect(trial.session.engine.data.suivis[0]?.essai).toBe(true);
    expect(trial.session.engine.data.label.tresorerie).toBe(
      session.engine.data.label.tresorerie - SCOUTING.trialCost,
    );
    expect(
      labelGame.dispatch(trial.session, { type: 'essai-studio', artisteId: id }),
    ).toMatchObject({ ok: false, rejection: { code: 'essai-deja-fait' } });
    expect(labelGame.dispatch(session, { type: 'essai-studio', artisteId: 9999 })).toMatchObject({
      ok: false,
      rejection: { code: 'suivi-introuvable' },
    });
  });
});

describe('dans la simulation', () => {
  it("chaque semaine d'observation resserre les fourchettes", () => {
    let session = newGame('obs');
    const r = labelGame.dispatch(session, { type: 'reperer', source: 'plateforme' });
    if (!r.ok) throw new Error('attendu');
    session = r.session;
    const later = labelGame.advance(session, 12).session.engine.data;
    expect(later.suivis.every((p) => p.observations === 12)).toBe(true);
  });

  it('se rejoue au même hash avec repérage, essai et abandon', () => {
    let session = newGame('rj');
    const actions: LabelAction[] = [
      { type: 'reperer', source: 'plateforme' },
      { type: 'reperer', source: 'battle' },
    ];
    for (const action of actions) {
      session = labelGame.advance(session, 3).session;
      const res = labelGame.dispatch(session, action);
      if (res.ok) session = res.session;
    }
    const id = session.engine.data.suivis[0]?.artisteId ?? -1;
    for (const action of [
      { type: 'essai-studio', artisteId: id },
      { type: 'abandonner-suivi', artisteId: id },
    ] as LabelAction[]) {
      const res = labelGame.dispatch(session, action);
      if (res.ok) session = res.session;
    }
    session = labelGame.advance(session, 20).session;
    const replayed = labelGame.replay(
      'rj',
      initialState('rj', defaultConfig()),
      session.journal,
      session.engine.tick,
    );
    expect(hashState(replayed.engine)).toBe(hashState(session.engine));
    expect(money.euros(1)).toBe(100);
  });
});
