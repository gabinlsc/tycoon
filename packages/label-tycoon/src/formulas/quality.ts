import { type Explained, type Rng, clamp, explain } from '@tycoon/core';
import type { Artist } from '../artists';
import { QUALITY } from '../balance';
import { artisticTalent } from './talent';

/** Producteur : un niveau et des genres de prédilection. */
export interface Producer {
  niveau: number;
  genre: string;
  genresSecondaires?: readonly string[];
}

export interface QualityInputs {
  artist: Artist;
  genre: string;
  producer: Producer;
  /** Niveau du studio (0-100). */
  studio: number;
  /** Qualité du mixage (0-100). */
  mixage: number;
  /** Synergie des featurings (0-100, 0 sans featuring). */
  featuring: number;
}

/** Adéquation entre le genre du producteur et celui de l'artiste (0-100). */
export function producerFit(producer: Producer, genre: string): number {
  if (producer.genre === genre) return QUALITY.fit.principal;
  if (producer.genresSecondaires?.includes(genre)) return QUALITY.fit.secondaire;
  return QUALITY.fit.etranger;
}

/** Qualité de base avant moral et bruit, avec le détail des termes. */
export function baseQuality(input: QualityInputs): Explained {
  const w = QUALITY.weights;
  return explain()
    .term('talent', artisticTalent(input.artist, input.genre).value, w.talent)
    .term('producteur', input.producer.niveau, w.producteur)
    .term('adequation', producerFit(input.producer, input.genre), w.adequation)
    .term('studio', input.studio, w.studio)
    .term('mixage', input.mixage, w.mixage)
    .term('featuring', input.featuring, w.featuring)
    .done();
}

/**
 * Qualité Q d'un titre (0-100) : base × modulation du moral + bruit gaussien. Le détail contient la
 * base, le facteur de moral et le bruit tiré.
 */
export function trackQuality(input: QualityInputs, rng: Rng): Explained {
  const base = baseQuality(input);
  const moralFactor = QUALITY.moralBase + (QUALITY.moralRange * input.artist.moral) / 100;
  return explain()
    .term('base', base.value)
    .scale('moral', moralFactor)
    .offset('bruit', rng.gaussian(0, QUALITY.noiseSd))
    .limit('bornes', 0, 100)
    .done();
}

/**
 * Fourchette de qualité affichée avant la sortie : on n'en connaît jamais la valeur, et plus
 * l'ingénieur du son et l'A&R sont bons, plus elle est étroite. Contient toujours la qualité réelle.
 */
export function estimateQuality(
  quality: number,
  engineerLevel: number,
  scoutLevel: number,
): readonly [number, number] {
  const e = QUALITY.estimate;
  const half = Math.max(
    e.min,
    e.base - e.engineerShare * engineerLevel - e.scoutShare * scoutLevel,
  );
  return [clamp(Math.floor(quality - half), 0, 100), clamp(Math.ceil(quality + half), 0, 100)];
}
