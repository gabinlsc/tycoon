import {
  type ActionHandler,
  type Phase,
  type Rng,
  Rng as RngClass,
  clamp,
  reject,
} from '@tycoon/core';
import type { Action, Seed } from '@tycoon/core';
import { generateArtist, takenStageNames } from './artists';
import type { TalentLevel } from './balance/artists';
import { SCENES, SCOUTING, SOURCES } from './balance';
import { GENRE_IDS } from './content/genres';
import { canAfford, spend } from './finance';
import type { LabelSignal } from './pipeline';
import { suivre } from './scouting';
import { type LabelState, newId } from './state';

/** Scène musicale d'une ville : profil de genres et chaleur du moment. */
export interface SceneLocale {
  ville: string;
  genre: string;
  secondaire: string;
  /** Chaleur de la scène, de 0 à 100. */
  chaleur: number;
  /** Tendance lissée de la chaleur (points par semaine). */
  elan: number;
  /** Vrai tant que la scène est signalée comme émergente (pour n'annoncer qu'une fois). */
  signalee: boolean;
}

/** Scènes de départ : déduites de la graine seule, comme le reste du monde. */
export function initialScenes(seed: Seed, villes: readonly string[]): SceneLocale[] {
  const rng = RngClass.fromSeed(`${String(seed)}\u0000scenes`);
  return villes.map((ville) => {
    const genre = rng.pick(GENRE_IDS);
    const secondaire = rng.pick(GENRE_IDS.filter((g) => g !== genre));
    return {
      ville,
      genre,
      secondaire,
      chaleur: Math.round(rng.range(SCENES.startHeat.min, SCENES.startHeat.max)),
      elan: 0,
      signalee: false,
    };
  });
}

export const estEmergente = (s: SceneLocale): boolean =>
  s.chaleur >= SCENES.emergentHeat && s.elan >= SCENES.emergentMomentum;

/** Fait évoluer les scènes : bruit, retour vers la moyenne, popularité du genre, éveils soudains. */
export const scenesPhase: Phase<LabelState, LabelSignal> = {
  name: 'marche',
  run(state, ctx) {
    const rng = ctx.rng('scenes');
    for (const s of state.scenes) {
      const populaire = state.marche.genres[s.genre]?.popularite ?? 50;
      const delta =
        rng.gaussian(0, SCENES.noise) +
        (50 - s.chaleur) * SCENES.meanReversion +
        (populaire - 50) * SCENES.genreInfluence +
        (rng.chance(SCENES.awakenChance) ? SCENES.awakenBoost : 0);
      const apres = clamp(s.chaleur + delta, 0, 100);
      s.elan += (apres - s.chaleur - s.elan) * SCENES.momentumSmoothing;
      s.chaleur = Math.round(apres * 100) / 100;
      if (estEmergente(s) && !s.signalee) {
        s.signalee = true;
        ctx.emit({ kind: 'scene-emergente', payload: { ville: s.ville, genre: s.genre } });
      } else if (s.signalee && s.chaleur < SCENES.emergentHeat - 10) s.signalee = false;
    }
  },
};

export interface ScoutSceneAction extends Action {
  readonly type: 'reperer-scene';
  readonly ville: string;
}

const NIVEAUX: readonly TalentLevel[] = ['amateur', 'espoir', 'confirme', 'star'];

/** Niveau d'un talent de la scène : la chaleur pousse vers les bons niveaux. */
function niveau(rng: Rng, chaleur: number): TalentLevel {
  const base = SOURCES.plateforme.levels;
  return rng.pickWeighted(NIVEAUX, (l) =>
    l === 'amateur' ? base[l] : base[l] * (1 + (chaleur / 100) * SCENES.levelBoostPerHeat),
  );
}

export const scoutScene: ActionHandler<LabelState, ScoutSceneAction, LabelSignal> = {
  validate(state, action) {
    if (!state.scenes.some((s) => s.ville === action.ville)) return reject('scene-introuvable');
    if (state.suivis.length + SCENES.scoutCount > SCOUTING.maxFollowed)
      return reject('trop-de-suivis', { max: SCOUTING.maxFollowed });
    return canAfford(state, SCENES.scoutCost)
      ? null
      : reject('fonds-insuffisants', { besoin: SCENES.scoutCost });
  },
  apply(state, action, ctx) {
    const scene = state.scenes.find((s) => s.ville === action.ville);
    if (!scene) return;
    spend(state, 'reperage', SCENES.scoutCost);
    const rng = ctx.rng('reperage');
    for (let i = 0; i < SCENES.scoutCount; i += 1) {
      const tirage = rng.float();
      const genre =
        tirage < SCENES.dominantShare
          ? scene.genre
          : tirage < SCENES.dominantShare + SCENES.secondaryShare
            ? scene.secondaire
            : undefined;
      const artist = generateArtist(
        rng,
        {
          id: newId(state),
          market: state.marche,
          cities: state.villes,
          takenNames: takenStageNames(state.artistes),
        },
        { level: niveau(rng, scene.chaleur), ville: scene.ville, ...(genre ? { genre } : {}) },
      );
      artist.potentiel = Math.min(
        100,
        artist.potentiel + Math.round(scene.chaleur * SCENES.potentialPerHeat),
      );
      state.artistes.push(artist);
      suivre(state, rng, artist, 'plateforme', ctx.tick, null);
    }
    ctx.emit({
      kind: 'talents-reperes',
      payload: { source: 'scene', nombre: SCENES.scoutCount, ville: scene.ville },
    });
  },
};
