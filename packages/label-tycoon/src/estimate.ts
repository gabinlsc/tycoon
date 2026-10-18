import type { Artist } from './artists';
import {
  type ClipSize,
  CLIPS,
  PRODUCTION,
  QUALITY,
  RELEASE_TYPES,
  type ReleaseType,
} from './balance';
import { productionCapacity, studioCap } from './buildings';
import { baseQuality, estimateQuality } from './formulas/quality';
import { analystLevel } from './forecast';
import { mixingQuality, projectCost } from './production';
import { roleLevel } from './staff';
import type { LabelState } from './state';

export interface EstimateInput {
  sortie: ReleaseType;
  clip: ClipSize;
  studio: number;
  producteur: number;
  mixage: number;
}

export interface Estimate {
  /** Fourchette de qualité attendue : jamais la valeur finale, qui dépend encore d'un tirage. */
  qualite: readonly [number, number];
  cout: number;
  /** Durée prévue en semaines (hors retard éventuel). */
  semaines: number;
  studioMax: number;
  capacite: number;
  enCours: number;
}

/**
 * Estimation avant lancement : qualité attendue (sans le bruit) étalée par l'ingénieur du son et
 * l'A&R, plus la marge du hasard ; coût, durée et capacité du studio.
 */
export function estimateRelease(state: LabelState, artist: Artist, input: EstimateInput): Estimate {
  const base = baseQuality({
    artist,
    genre: artist.genre,
    producer: { niveau: input.producteur, genre: artist.genre },
    studio: Math.min(input.studio, studioCap(state)),
    mixage: mixingQuality(input.mixage),
    featuring: 0,
  }).value;
  const attendue = base * (QUALITY.moralBase + (QUALITY.moralRange * artist.moral) / 100);
  const [bas, haut] = estimateQuality(attendue, roleLevel(state, 'ingenieur'), analystLevel(state));
  const marge = Math.round(QUALITY.noiseSd);
  const profile = RELEASE_TYPES[input.sortie];
  const facteur = PRODUCTION.durationBase - (PRODUCTION.durationEthicsSlope * artist.ethique) / 100;
  return {
    qualite: [Math.max(0, bas - marge), Math.min(100, haut + marge)],
    cout: projectCost(input.sortie, input.clip, input.studio, input.mixage),
    semaines: Math.max(1, Math.round(profile.semaines * facteur)) + CLIPS[input.clip].semaines,
    studioMax: studioCap(state),
    capacite: productionCapacity(state),
    enCours: state.projets.filter((p) => p.statut === 'production').length,
  };
}
