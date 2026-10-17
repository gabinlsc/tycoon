import { type ActionHandler, type Rng, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { type Artist, generateArtist, takenStageNames } from './artists';
import { type ScoutSource, SCOUTING, SOURCES } from './balance';
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
  /** Vrai après un essai en studio : les attributs cachés deviennent visibles (en fourchette). */
  essai: boolean;
  /**
   * Décalage fixe de chaque attribut, tiré à la découverte : sans lui, le centre d'une fourchette
   * serait la vérité et l'on pourrait la deviner. Il se résorbe à mesure que la fourchette se resserre.
   */
  decalages: Record<string, number>;
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

/** Découvre `count` nouveaux talents via une source : ils rejoignent le monde (libres) et la liste de suivi. */
export function scoutTalents(
  state: LabelState,
  rng: Rng,
  source: ScoutSource,
  tick: number,
): Artist[] {
  const profile = SOURCES[source];
  const found: Artist[] = [];
  for (let i = 0; i < profile.count; i += 1) {
    const options: { level: TalentLevel; genre?: string } = { level: pickLevel(rng, source) };
    if (profile.genres.length > 0) options.genre = rng.pick(profile.genres);
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
      observations: 0,
      essai: false,
      decalages,
    });
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
    if (state.suivis.length + profile.count > SCOUTING.maxFollowed)
      return reject('trop-de-suivis', { max: SCOUTING.maxFollowed });
    if (!canAfford(state, profile.cost))
      return reject('fonds-insuffisants', { besoin: profile.cost });
    return null;
  },
  apply(state, action, ctx) {
    spend(state, 'reperage', SOURCES[action.source].cost);
    const found = scoutTalents(state, ctx.rng('reperage'), action.source, ctx.tick);
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
