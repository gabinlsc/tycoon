import { type Explained, type Rng, clamp, explain, piecewiseLinear } from '@tycoon/core';
import type { Artist, CareerPhase } from './artists';
import { careerPhaseFor } from './artists';
import { COMEBACK, CULT, DECLINE, PROGRESSION } from './balance';
import { TRAITS } from './content/traits';
import { adjustArtist } from './dynamics';

const hundredths = (x: number): number => Math.round(x * 100) / 100;
const workloadEfficiency = piecewiseLinear(PROGRESSION.workloadCurve);

const SKILLS = ['plume', 'flow', 'voix', 'charisme', 'scene'] as const;

/** Contexte de progression fourni par les autres systèmes. Neutre par défaut. */
export interface ProgressionContext {
  /** Niveau moyen des producteurs avec qui l'artiste travaille (0-100). */
  producerLevel?: number;
  /** Volume de travail : 1 = optimal, moins = désœuvré, plus = surmené. */
  workload?: number;
}

/**
 * Multiplicateur de progression d'un artiste cette semaine, avec le détail des facteurs
 * (éthique, producteurs, moral, charge de travail, traits, phase de carrière).
 */
export function progressionMultiplier(artist: Artist, context: ProgressionContext = {}): Explained {
  const producer = context.producerLevel ?? PROGRESSION.neutralProducer;
  const workload = context.workload ?? 1;
  const traits = artist.traits.reduce((product, t) => product * (TRAITS[t].progression ?? 1), 1);
  return explain()
    .term('base', 1)
    .scale('ethique', 0.5 + artist.ethique / 100)
    .scale('producteurs', 0.7 + (0.6 * producer) / 100)
    .scale('moral', 0.6 + (0.8 * artist.moral) / 100)
    .scale('charge', workloadEfficiency(workload))
    .scale('traits', traits)
    .scale('phase', PROGRESSION.phaseMultiplier[artist.phase])
    .done();
}

/** Années écoulées depuis le pic, au moins 0. */
const yearsPastPeak = (artist: Artist): number => Math.max(0, artist.age - artist.agePic);

/** Perte de points par semaine d'un artiste en déclin, croissante avec l'ancienneté du déclin. */
export function weeklyDecline(artist: Artist): number {
  if (artist.phase !== 'declin' && artist.phase !== 'culte') return 0;
  const seniority = Math.min(
    DECLINE.maxSeniorityFactor,
    1 + (yearsPastPeak(artist) / DECLINE.yearsToMax) * (DECLINE.maxSeniorityFactor - 1),
  );
  const base = (DECLINE.pointsPerYear * seniority) / 52;
  return artist.phase === 'culte' ? base * DECLINE.cultMultiplier : base;
}

/** Fait évoluer les compétences d'une semaine : progression vers le potentiel, ou déclin. */
export function stepSkills(artist: Artist, context: ProgressionContext = {}): void {
  const decline = weeklyDecline(artist);
  const rate = PROGRESSION.baseRate * progressionMultiplier(artist, context).value;
  for (const skill of SKILLS) {
    const gap = artist.potentiel - artist[skill];
    let next = artist[skill];
    if (decline > 0) next -= decline;
    else if (gap > 0 && rate > 0) next += gap * rate;
    artist[skill] = hundredths(clamp(next, 0, 100));
  }
}

const RANK: Readonly<Record<CareerPhase, number>> = {
  emergent: 0,
  montee: 1,
  pic: 2,
  plateau: 3,
  declin: 4,
  culte: 5,
};

/** Met la phase à jour selon l'âge. La carrière ne recule jamais, sauf par un retour en grâce. */
export function updatePhase(artist: Artist): void {
  if (artist.phase === 'culte') return;
  const computed = careerPhaseFor(artist.age, artist.agePic, 'confirme');
  if (RANK[computed] > RANK[artist.phase]) artist.phase = computed;
}

/**
 * Tirage de fin d'année pour un artiste en déclin : retour en grâce, statut culte, ou rien.
 * Consomme toujours le même nombre de tirages (deux), pour garder le flux stable.
 */
export function yearlyDeclineRoll(artist: Artist, rng: Rng): 'retour' | 'culte' | null {
  const comeback = rng.float();
  const cult = rng.float();
  if (artist.phase !== 'declin') return null;
  const pComeback = COMEBACK.yearlyChance * (0.5 + artist.ethique / 100);
  if (artist.retours < COMEBACK.maxPerCareer && comeback < pComeback) {
    artist.retours += 1;
    artist.phase = 'montee';
    artist.agePic = artist.age + COMEBACK.newPeakShift;
    adjustArtist(artist, { hype: COMEBACK.hypeBoost, moral: COMEBACK.moralBoost });
    return 'retour';
  }
  const pCult = CULT.yearlyChance * (0.5 + artist.rue / 100);
  if (artist.fanbase >= CULT.minFanbase && cult < pCult) {
    artist.phase = 'culte';
    return 'culte';
  }
  return null;
}
