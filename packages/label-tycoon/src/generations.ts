import { type Rng, clamp } from '@tycoon/core';
import { type Artist, generateArtist, notoriety, takenStageNames } from './artists';
import { GENERATIONS } from './balance';
import type { LabelSignal } from './pipeline';
import { type LabelState, newId } from './state';

/** Probabilité annuelle qu'un artiste de cet âge prenne sa retraite (0 avant l'âge minimal). */
export function retraiteChance(artist: Pick<Artist, 'age' | 'phase'>): number {
  if (artist.age < GENERATIONS.retirementAge) return 0;
  const base =
    GENERATIONS.retirementBase +
    (artist.age - GENERATIONS.retirementAge) * GENERATIONS.retirementPerYear;
  const phase =
    artist.phase === 'declin'
      ? GENERATIONS.declineFactor
      : artist.phase === 'culte'
        ? GENERATIONS.cultFactor
        : 1;
  return clamp(base * phase, 0, GENERATIONS.retirementMax);
}

/** Légendes du label : artistes retraités qui étaient chez le joueur et restent célèbres. */
export const legendes = (state: LabelState): Artist[] =>
  state.artistes.filter(
    (a) =>
      a.employeur === 'retraite' &&
      a.retraite?.chezJoueur === true &&
      notoriety(a.fanbase) >= GENERATIONS.legendNotoriety,
  );

/** Nombre de légendes du label dans un genre, plafonné pour l'effet sur l'académie. */
export const legendesDuGenre = (state: LabelState, genre: string): number =>
  Math.min(GENERATIONS.academyMaxLegends, legendes(state).filter((a) => a.genre === genre).length);

/** L'artiste prend sa retraite : il quitte le marché, ses contrats restent pour le catalogue. */
export function prendreRetraite(
  state: LabelState,
  artist: Artist,
  tick: number,
  emit: (s: LabelSignal) => void,
): void {
  const chezJoueur = artist.employeur === 'joueur';
  artist.retraite = { semaine: tick, chezJoueur };
  artist.employeur = 'retraite';
  artist.fatigue = 0;
  // Un contrat en cours continue pour le catalogue, sans jamais déclencher de fin de contrat.
  const contrat = state.contrats.find((c) => c.artisteId === artist.id);
  if (contrat) contrat.echeance = Math.max(contrat.echeance, tick + 520);
  state.mentorats = state.mentorats.filter((m) => m.protegeId !== artist.id);
  if (chezJoueur) emit({ kind: 'retraite', payload: { artisteId: artist.id } });
}

/** Un enfant d'artiste célèbre arrive dans le métier : même genre, traits hérités, nom connu. */
export function naissanceEnfant(
  state: LabelState,
  parent: Artist,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): Artist {
  const enfant = generateArtist(
    rng,
    {
      id: newId(state),
      market: state.marche,
      cities: state.villes,
      takenNames: takenStageNames(state.artistes),
    },
    { level: 'espoir', genre: parent.genre, origin: parent.origine, ville: parent.ville },
  );
  const part = GENERATIONS.childSkillShare;
  for (const k of ['plume', 'flow', 'voix', 'charisme', 'scene'] as const)
    enfant[k] = Math.round(clamp(enfant[k] * (1 - part) + parent[k] * part, 0, 100));
  enfant.potentiel = Math.max(
    enfant.potentiel,
    Math.round((enfant.potentiel + parent.potentiel) / 2),
  );
  enfant.nom = parent.nom;
  enfant.age = 18 + rng.int(0, 5);
  enfant.agePic = Math.max(enfant.agePic, 28);
  enfant.phase = 'emergent';
  enfant.traits = [...new Set([...parent.traits.slice(0, 2), ...enfant.traits])].slice(0, 3);
  enfant.hype = clamp(enfant.hype + GENERATIONS.childHype, 0, 100);
  enfant.fanbase = Math.round(enfant.fanbase * 1.5);
  enfant.parentId = parent.id;
  if (parent.retraite?.chezJoueur) {
    enfant.affinite = GENERATIONS.childAffinity;
    enfant.loyaute = Math.max(enfant.loyaute, GENERATIONS.childLoyalty);
  }
  state.artistes.push(enfant);
  emit({ kind: 'enfant-d-artiste', payload: { artisteId: enfant.id, parentId: parent.id } });
  return enfant;
}

/** Fin d'année d'un artiste : retraite éventuelle, et naissance d'une relève s'il était célèbre. */
export function bilanDeGeneration(
  state: LabelState,
  artist: Artist,
  tick: number,
  rng: Rng,
  emit: (s: LabelSignal) => void,
): void {
  if (artist.employeur === 'retraite') return;
  const p = retraiteChance(artist);
  if (p <= 0 || !rng.chance(p)) return;
  const celebre = notoriety(artist.fanbase) >= GENERATIONS.childMinNotoriety;
  prendreRetraite(state, artist, tick, emit);
  if (celebre && rng.chance(GENERATIONS.childChance)) naissanceEnfant(state, artist, rng, emit);
}

/** Réputation que rapportent chaque année les légendes (jury, académie partenaire). */
export function reputationDesLegendes(state: LabelState): number {
  return legendes(state).length * GENERATIONS.reputationPerLegendYear;
}
