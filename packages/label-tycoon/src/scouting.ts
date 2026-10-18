import { type ActionHandler, type Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { type Artist, generateArtist, notoriety, takenStageNames } from './artists';
import { RIVAL_SCOUTING, type ScoutSource, SCOUTING, SCOUTS, SOURCES } from './balance';
import type { TalentLevel } from './balance/artists';
import { canAfford, spend } from './finance';
import type { LabelSignal } from './pipeline';
import { type LabelState, newId } from './state';

export const VISIBLE_ATTRIBUTES = ['plume', 'flow', 'voix', 'charisme', 'scene'] as const;
export const HIDDEN_ATTRIBUTES = ['potentiel', 'ethique', 'ego', 'loyaute', 'polyvalence'] as const;
export type VisibleAttribute = (typeof VISIBLE_ATTRIBUTES)[number];
export type HiddenAttribute = (typeof HIDDEN_ATTRIBUTES)[number];
export type ScoutedAttribute = VisibleAttribute | HiddenAttribute;

/** Talent suivi : ce que le joueur sait de lui n'est jamais la valeur exacte, mais une fourchette. */
export interface Prospect {
  artisteId: number;
  source: ScoutSource;
  /** Semaine du premier repérage. */
  depuis: number;
  /** Semaines d'observation cumulées : elles resserrent les fourchettes. */
  observations: number;
  /** Dénicheur à l'origine du repérage (`null` : le label seul). */
  denicheurId: number | null;
  /** Vrai après un essai en studio : les attributs cachés deviennent visibles (en fourchette). */
  essai: boolean;
  /**
   * Décalage fixe de chaque attribut, tiré à la découverte : sans lui, le centre d'une fourchette
   * serait la vérité et l'on pourrait la deviner. Il se résorbe à mesure que la fourchette se resserre.
   */
  decalages: Record<string, number>;
}

/** Dénicheur employé : son niveau resserre les fourchettes, son genre fétiche oriente le repérage. */
export interface Denicheur {
  id: number;
  nom: string;
  /** Niveau (0-100). */
  niveau: number;
  /** Genre qu'il connaît le mieux (id de genre). */
  genreFetiche: string;
}

export type Range = readonly [low: number, high: number];

/** Demi-largeur d'une fourchette pour une source, un attribut, un temps d'observation et un dénicheur. */
export function rangeWidth(
  source: ScoutSource,
  attribute: ScoutedAttribute,
  observations: number,
  scoutLevel = 0,
): number {
  const hidden = (HIDDEN_ATTRIBUTES as readonly string[]).includes(attribute);
  const initial = SOURCES[source].width * (hidden ? SCOUTING.hiddenWidthFactor : 1);
  const precision =
    1 +
    observations / SCOUTING.halfLifeWeeks +
    (scoutLevel / 25) * SCOUTING.precisionPerScoutLevel25;
  return Math.max(SCOUTING.minWidth, initial / precision);
}

/**
 * Fourchette connue d'un attribut, ou `null` s'il est encore caché. La valeur réelle est toujours
 * dans la fourchette ; celle-ci se resserre avec le temps d'observation et le niveau du dénicheur.
 */
export function knownRange(
  prospect: Prospect,
  artist: Artist,
  attribute: ScoutedAttribute,
  scoutLevel = 0,
): Range | null {
  const hidden = (HIDDEN_ATTRIBUTES as readonly string[]).includes(attribute);
  if (hidden && !prospect.essai) return null;
  const width = rangeWidth(prospect.source, attribute, prospect.observations, scoutLevel);
  const initial = SOURCES[prospect.source].width * (hidden ? SCOUTING.hiddenWidthFactor : 1);
  const center = artist[attribute] + (prospect.decalages[attribute] ?? 0) * (width / initial);
  return [clamp(Math.round(center - width), 0, 100), clamp(Math.round(center + width), 0, 100)];
}

function pickLevel(rng: Rng, source: ScoutSource): TalentLevel {
  const weights = SOURCES[source].levels;
  return rng.pickWeighted(Object.keys(weights) as TalentLevel[], (l) => weights[l]);
}

/** Ajoute un talent à la liste de suivi, avec les décalages fixes qui rendent ses fourchettes imprécises. */
export function suivre(
  state: LabelState,
  rng: Rng,
  artist: Artist,
  source: ScoutSource,
  tick: number,
  denicheurId: number | null,
): void {
  const profile = SOURCES[source];
  const decalages: Record<string, number> = {};
  for (const attribute of [...VISIBLE_ATTRIBUTES, ...HIDDEN_ATTRIBUTES]) {
    const hidden = (HIDDEN_ATTRIBUTES as readonly string[]).includes(attribute);
    const initial = profile.width * (hidden ? SCOUTING.hiddenWidthFactor : 1);
    const limit = initial * SCOUTING.maxOffsetShare;
    decalages[attribute] =
      Math.round(clamp(rng.gaussian(0, initial / 3), -limit, limit) * 100) / 100;
  }
  state.suivis.push({
    artisteId: artist.id,
    source,
    depuis: tick,
    denicheurId,
    observations: 0,
    essai: false,
    decalages,
  });
}

/** Découvre `count` nouveaux talents via une source : ils rejoignent le monde (libres) et la liste de suivi. */
export function scoutTalents(
  state: LabelState,
  rng: Rng,
  source: ScoutSource,
  tick: number,
  denicheur: Denicheur | null = null,
): Artist[] {
  const profile = SOURCES[source];
  const found: Artist[] = [];
  for (let i = 0; i < profile.count; i += 1) {
    const options: { level: TalentLevel; genre?: string } = { level: pickLevel(rng, source) };
    if (denicheur && rng.chance(SCOUTS.biasShare)) options.genre = denicheur.genreFetiche;
    else if (profile.genres.length > 0) options.genre = rng.pick(profile.genres);
    const artist = generateArtist(
      rng,
      {
        id: newId(state),
        market: state.marche,
        cities: state.villes,
        takenNames: takenStageNames(state.artistes),
      },
      options,
    );
    state.artistes.push(artist);
    suivre(state, rng, artist, source, tick, denicheur?.id ?? null);
    found.push(artist);
  }
  return found;
}

/** Un talent suivi de plus d'une semaine d'observation : appelé chaque semaine par la phase artistes. */
export function observeProspects(state: LabelState): void {
  for (const prospect of state.suivis) prospect.observations += 1;
}

// --- Actions du joueur ---

export interface ScoutAction extends Action {
  readonly type: 'reperer';
  readonly source: ScoutSource;
  /** Dénicheur chargé de la session (facultatif). */
  readonly denicheurId?: number;
}
export interface HireScoutAction extends Action {
  readonly type: 'recruter-denicheur';
  readonly genre: string;
}
export interface FireScoutAction extends Action {
  readonly type: 'renvoyer-denicheur';
  readonly denicheurId: number;
}
export interface DropProspectAction extends Action {
  readonly type: 'abandonner-suivi';
  readonly artisteId: number;
}
export interface TrialAction extends Action {
  readonly type: 'essai-studio';
  readonly artisteId: number;
}

export const scout: ActionHandler<LabelState, ScoutAction, LabelSignal> = {
  validate(state, action) {
    const profile = SOURCES[action.source] as (typeof SOURCES)[ScoutSource] | undefined;
    if (!profile) return reject('source-inconnue');
    if (action.denicheurId !== undefined && !findScout(state, action.denicheurId))
      return reject('denicheur-introuvable');
    if (state.suivis.length + profile.count > SCOUTING.maxFollowed)
      return reject('trop-de-suivis', { max: SCOUTING.maxFollowed });
    if (!canAfford(state, profile.cost))
      return reject('fonds-insuffisants', { besoin: profile.cost });
    return null;
  },
  apply(state, action, ctx) {
    spend(state, 'reperage', SOURCES[action.source].cost);
    const denicheur =
      action.denicheurId === undefined ? null : (findScout(state, action.denicheurId) ?? null);
    const found = scoutTalents(state, ctx.rng('reperage'), action.source, ctx.tick, denicheur);
    ctx.emit({ kind: 'talents-reperes', payload: { source: action.source, nombre: found.length } });
  },
};

export const dropProspect: ActionHandler<LabelState, DropProspectAction, LabelSignal> = {
  validate: (state, action) =>
    state.suivis.some((p) => p.artisteId === action.artisteId) ? null : reject('suivi-introuvable'),
  apply(state, action) {
    state.suivis = state.suivis.filter((p) => p.artisteId !== action.artisteId);
  },
};

export const studioTrial: ActionHandler<LabelState, TrialAction, LabelSignal> = {
  validate(state, action) {
    const prospect = state.suivis.find((p) => p.artisteId === action.artisteId);
    if (!prospect) return reject('suivi-introuvable');
    if (prospect.essai) return reject('essai-deja-fait');
    if (!canAfford(state, SCOUTING.trialCost))
      return reject('fonds-insuffisants', { besoin: SCOUTING.trialCost });
    return null;
  },
  apply(state, action) {
    spend(state, 'reperage', SCOUTING.trialCost);
    const prospect = state.suivis.find((p) => p.artisteId === action.artisteId);
    if (prospect) prospect.essai = true;
  },
};

// --- Dénicheurs et rivaux ---

export function findScout(state: LabelState, id: number): Denicheur | undefined {
  return state.denicheurs.find((d) => d.id === id);
}

/** Niveau du dénicheur d'un talent suivi (0 sans dénicheur). */
export function scoutLevelOf(state: LabelState, prospect: Prospect): number {
  return prospect.denicheurId === null ? 0 : (findScout(state, prospect.denicheurId)?.niveau ?? 0);
}

export const hireScout: ActionHandler<LabelState, HireScoutAction, LabelSignal> = {
  validate(state, action) {
    if (state.denicheurs.length >= SCOUTS.max)
      return reject('trop-de-denicheurs', { max: SCOUTS.max });
    if (!state.marche.genres[action.genre]) return reject('genre-inconnu');
    if (!canAfford(state, SCOUTS.hireCost))
      return reject('fonds-insuffisants', { besoin: SCOUTS.hireCost });
    return null;
  },
  apply(state, action, ctx) {
    spend(state, 'reperage', SCOUTS.hireCost);
    const rng = ctx.rng('personnel');
    const id = newId(state);
    state.denicheurs.push({
      id,
      nom: `Dénicheur n°${state.denicheurs.length + 1}`,
      niveau: rng.int(SCOUTS.levelMin, SCOUTS.levelMax),
      genreFetiche: action.genre,
    });
  },
};

export const fireScout: ActionHandler<LabelState, FireScoutAction, LabelSignal> = {
  validate: (state, action) =>
    findScout(state, action.denicheurId) ? null : reject('denicheur-introuvable'),
  apply(state, action) {
    state.denicheurs = state.denicheurs.filter((d) => d.id !== action.denicheurId);
    for (const prospect of state.suivis) {
      if (prospect.denicheurId === action.denicheurId) prospect.denicheurId = null;
    }
  },
};

/** Salaires hebdomadaires des dénicheurs (phase artistes, avant la clôture financière). */
export function payScouts(state: LabelState): void {
  if (state.denicheurs.length > 0)
    spend(state, 'salaires', cents(state.denicheurs.length * SCOUTS.weeklyWage));
}

/**
 * Les rivaux signent parfois un talent libre que le joueur suit : plus il est connu, plus il part
 * vite. Il disparaît alors de la liste de suivi et son employeur devient `rival`.
 */
export function rivalsPoach(
  state: LabelState,
  rng: Rng,
  emit: (signal: { kind: string; payload: Record<string, unknown> }) => void,
): void {
  const aggression = state.config.difficulty.rivalAggression;
  const kept: Prospect[] = [];
  for (const prospect of state.suivis) {
    const artist = state.artistes.find((a) => a.id === prospect.artisteId);
    if (!artist || artist.employeur !== 'libre') {
      kept.push(prospect);
      continue;
    }
    const boost = 1 + (notoriety(artist.fanbase) / 100) * (RIVAL_SCOUTING.notorietyBoost - 1);
    if (rng.chance(RIVAL_SCOUTING.weeklyBase * aggression * boost)) {
      artist.employeur = 'rival';
      emit({ kind: 'talent-signe-par-rival', payload: { artisteId: artist.id } });
    } else {
      kept.push(prospect);
    }
  }
  state.suivis = kept;
}
