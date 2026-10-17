import { type Phase, clamp } from '@tycoon/core';
import type { Artist } from './artists';
import { DYNAMICS } from './balance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

/** Arrondi à deux décimales : les attributs dynamiques évoluent par petites fractions, sans bruit de flottant. */
const hundredths = (x: number): number => Math.round(x * 100) / 100;

/** Variations appliquées par un système (sortie, tournée, événement…). Tout est facultatif. */
export interface ArtistDelta {
  hype?: number;
  moral?: number;
  fatigue?: number;
  /** Fans gagnés (ou perdus si négatif). */
  fans?: number;
  rue?: number;
  affinite?: number;
}

/**
 * Applique des variations en gardant chaque attribut dans ses bornes : 0-100, la fanbase au moins
 * à 0 et entière, l'affinité de -100 à 100. C'est la seule façon de modifier ces attributs hors
 * de leur dérive hebdomadaire.
 */
export function adjustArtist(artist: Artist, delta: ArtistDelta): void {
  if (delta.hype !== undefined) artist.hype = hundredths(clamp(artist.hype + delta.hype, 0, 100));
  if (delta.moral !== undefined)
    artist.moral = hundredths(clamp(artist.moral + delta.moral, 0, 100));
  if (delta.fatigue !== undefined)
    artist.fatigue = hundredths(clamp(artist.fatigue + delta.fatigue, 0, DYNAMICS.fatigueMax));
  if (delta.fans !== undefined)
    artist.fanbase = Math.max(0, Math.round(artist.fanbase + delta.fans));
  if (delta.rue !== undefined) artist.rue = hundredths(clamp(artist.rue + delta.rue, 0, 100));
  if (delta.affinite !== undefined)
    artist.affinite = hundredths(clamp(artist.affinite + delta.affinite, -100, 100));
}

/**
 * Un pas de la dérive naturelle d'un artiste, sans aucune action extérieure :
 * - la hype retombe de 5 % ;
 * - le moral revient doucement vers 60, et baisse si l'artiste est épuisé ;
 * - la fatigue se résorbe un peu.
 */
export function driftArtist(artist: Artist): void {
  const hypeLoss = -artist.hype * DYNAMICS.hypeDecay;
  const moralPull = (DYNAMICS.moralTarget - artist.moral) * DYNAMICS.moralDrift;
  const exhaustion =
    artist.fatigue > DYNAMICS.fatigueMoralThreshold ? -DYNAMICS.fatigueMoralPenalty : 0;
  adjustArtist(artist, {
    hype: hypeLoss,
    moral: moralPull + exhaustion,
    fatigue: -DYNAMICS.fatigueRecovery,
  });
  // Un buzz presque éteint s'éteint pour de bon (évite une traîne infinie due à l'arrondi)
  if (artist.hype < 0.5) artist.hype = 0;
}

/** Phase « artistes » : dérive hebdomadaire de tous les artistes du monde, dans l'ordre des identifiants. */
export const artistsPhase: Phase<LabelState, LabelSignal> = {
  name: 'artistes',
  run(state) {
    for (const artist of state.artistes) driftArtist(artist);
  },
};
