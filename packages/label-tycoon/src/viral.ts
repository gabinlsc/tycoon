import type { Rng } from '@tycoon/core';
import type { Artist } from './artists';
import { VIRALITY } from './balance';
import type { Projet } from './production';

/** Fans gagnés grâce aux streams de la semaine : proportionnel au charisme (50 = neutre). */
export function fansGained(streams: number, charisme: number): number {
  return Math.round((streams * VIRALITY.fanConversion * charisme) / 50);
}

/**
 * Avance l'emballement viral d'une sortie. Sans emballement en cours, tire un déclenchement avec
 * p = base × H ; sinon décompte les semaines restantes. Renvoie vrai quand un emballement démarre.
 */
export function viralStep(
  projet: Projet,
  artist: Artist,
  rng: Rng,
  /** Facteur de l'ère sur les chances d'emballement. */
  ere = 1,
): boolean {
  if (projet.viral) {
    projet.viral.semaines -= 1;
    if (projet.viral.semaines <= 0) projet.viral = null;
    return false;
  }
  if (!rng.chance(Math.min(1, VIRALITY.baseChance * projet.hit * ere))) return false;
  projet.viral = {
    semaines: rng.int(VIRALITY.weeks.min, VIRALITY.weeks.max),
    mult: rng.range(VIRALITY.multiplier.min, VIRALITY.multiplier.max),
  };
  artist.hype = Math.min(100, artist.hype + VIRALITY.hypeBoost);
  return true;
}
