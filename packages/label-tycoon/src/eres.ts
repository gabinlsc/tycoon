import { type Phase, Rng } from '@tycoon/core';
import { ERA_SCHEDULE, ERES, ERE_IDS, type EreId, type EreRules } from './balance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

/** Une ère du programme, qui commence à la semaine `debut`. */
export interface EreProgrammee {
  ere: EreId;
  debut: number;
}

/**
 * Les ères de la partie. Le programme est tiré une fois pour toutes à la création, à partir de la
 * graine : il ne consomme aucun tirage de la simulation, et il est le même pour tous les joueurs d'une
 * même graine (défi du jour compris).
 */
export interface ErasState {
  programme: EreProgrammee[];
  /** Ère en cours, tenue à jour chaque semaine (les règles économiques la lisent directement). */
  courante: EreId;
}

/** Programme d'ères : la première est toujours le streaming, les suivantes diffèrent de la précédente. */
export function programmeDEres(rng: Rng): EreProgrammee[] {
  const programme: EreProgrammee[] = [{ ere: 'streaming', debut: 0 }];
  let debut = 0;
  for (let i = 1; i < ERA_SCHEDULE.programmed; i += 1) {
    const precedente = programme[programme.length - 1]?.ere;
    debut += rng.int(ERA_SCHEDULE.weeks.min, ERA_SCHEDULE.weeks.max);
    const choix = ERE_IDS.filter((e) => e !== precedente);
    programme.push({ ere: rng.pick(choix), debut });
  }
  return programme;
}

export const initialEras = (seed: string | number): ErasState => ({
  programme: programmeDEres(Rng.fromSeed(`${seed}:eres`)),
  courante: 'streaming',
});

/** Ère en vigueur à la semaine `tick`. */
export function ereA(eras: ErasState, tick: number): EreId {
  let courante: EreId = eras.programme[0]?.ere ?? 'streaming';
  for (const e of eras.programme) if (e.debut <= tick) courante = e.ere;
  return courante;
}

/** Règles de l'ère en cours. */
export const ereCourante = (state: LabelState): EreRules => ERES[state.eres.courante];

export interface ProchaineEre {
  /** Semaines avant le changement. */
  dans: number;
  /** Dernier indice avant-coureur déjà paru, s'il y en a. */
  indice: string | null;
  /** Nom de l'ère à venir : révélé seulement dans les dernières semaines. */
  nom: string | null;
}

/** Ce que le joueur peut savoir de l'ère suivante à la semaine `tick`. */
export function prochaineEre(eras: ErasState, tick: number): ProchaineEre | null {
  const index = eras.programme.findIndex((e) => e.debut > tick);
  const suivante = eras.programme[index];
  if (index < 0 || !suivante) return null;
  const dans = suivante.debut - tick;
  const seuils: readonly number[] = ERA_SCHEDULE.hintsAt;
  const paliers = seuils.filter((w) => dans <= w);
  const indices = ERES[suivante.ere].indices;
  const k = paliers.length - 1;
  return {
    dans,
    indice: k >= 0 ? (indices[seuils.indexOf(paliers[k] ?? -1)] ?? null) : null,
    nom: dans <= ERA_SCHEDULE.revealAt ? ERES[suivante.ere].nom : null,
  };
}

/** Phase des ères : met à jour l'ère courante et émet les signaux avant-coureurs puis le changement. */
export const erasPhase: Phase<LabelState, LabelSignal> = {
  name: 'marche',
  run(state, ctx) {
    const eras = state.eres;
    const actuelle = ereA(eras, ctx.tick);
    const suivante = eras.programme.find((e) => e.debut > ctx.tick);
    if (suivante) {
      const dans = suivante.debut - ctx.tick;
      const rang = (ERA_SCHEDULE.hintsAt as readonly number[]).indexOf(dans);
      const texte = rang >= 0 ? ERES[suivante.ere].indices[rang] : undefined;
      if (texte !== undefined) ctx.emit({ kind: 'signal-ere', payload: { texte } });
    }
    if (actuelle !== eras.courante) {
      eras.courante = actuelle;
      ctx.emit({
        kind: 'changement-ere',
        payload: { ere: actuelle },
        interrupt: true,
      } as LabelSignal);
    }
  },
};
