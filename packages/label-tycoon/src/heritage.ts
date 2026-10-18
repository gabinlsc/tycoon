import { cents, clamp } from '@tycoon/core';
import { HERITAGE, HERITAGE_BONUS_IDS, type HeritageBonusId } from './balance';
import type { HeritageDepart } from './config';
import { legendes } from './generations';
import { type LabelState } from './state';
import { tierAtLeast } from './tiers';
import { labelScore } from './valuation';

export interface ProgressionBonus {
  id: HeritageBonusId;
  atteint: boolean;
  /** Valeur actuelle et cible, dans l'unité du bonus (euros, disques, signatures…). */
  valeur: number;
  cible: number;
  /** Vrai si le bonus était déjà acquis par un règne précédent. */
  herite: boolean;
}

/** Bilan d'un règne : ce qu'il a accompli et ce qu'il transmet au suivant. */
export interface BilanRegne {
  label: string;
  semaines: number;
  palier: string;
  /** Valorisation en centimes : le score du Panthéon. */
  valorisation: number;
  reputation: number;
  disquesCertifies: number;
  legendes: number;
  generation: number;
  bonus: ProgressionBonus[];
  /** Réglages de la partie Héritage qu'on peut lancer à partir de ce règne. */
  heritage: HeritageDepart;
}

const certifies = (state: LabelState): number =>
  state.projets.filter((p) => p.certification !== null).length;

/** Valeur mesurée pour chaque bonus d'héritage. */
function mesure(state: LabelState, tick: number, id: HeritageBonusId): [number, number] {
  const b = HERITAGE.bonus;
  switch (id) {
    case 'fondation':
      return [state.institution.donne, b.fondation.don];
    case 'catalogue':
      return [certifies(state), b.catalogue.certifies];
    case 'prestige':
      return [labelScore(state, tick), b.prestige.valorisation];
    case 'reseau':
      return [state.stats['artiste-signe'] ?? 0, b.reseau.signatures];
  }
}

/** Un règne peut être clos à partir d'un palier élevé ou d'une longue carrière, en mode carrière. */
export function regneClosable(state: LabelState, tick: number): boolean {
  if (state.config.mode !== 'carriere' || state.config.sandbox) return false;
  return tierAtLeast(state, HERITAGE.minTier) || tick >= HERITAGE.minWeeks;
}

export function bilanDeRegne(state: LabelState, tick: number): BilanRegne {
  const precedent = state.config.heritage;
  const generation = precedent?.generation ?? 1;
  const acquis = new Set<HeritageBonusId>(precedent?.bonus ?? []);
  const bonus = HERITAGE_BONUS_IDS.map<ProgressionBonus>((id) => {
    const [valeur, cible] = mesure(state, tick, id);
    return {
      id,
      atteint: valeur >= cible || acquis.has(id),
      valeur,
      cible,
      herite: acquis.has(id),
    };
  });
  const reputation = Math.min(
    HERITAGE.reputationMax,
    Math.round(state.label.reputation * HERITAGE.reputationShare),
  );
  return {
    label: state.label.nom,
    semaines: tick,
    palier: state.label.tier,
    valorisation: labelScore(state, tick),
    reputation: state.label.reputation,
    disquesCertifies: certifies(state),
    legendes: legendes(state).length,
    generation,
    bonus,
    heritage: {
      generation: Math.min(HERITAGE.maxGeneration, generation + 1),
      ancetre: state.label.nom,
      reputation,
      bonus: bonus.filter((x) => x.atteint).map((x) => x.id),
    },
  };
}

/** Vérifie la forme d'un héritage reçu de l'extérieur : message d'erreur, ou `null`. */
export function validerHeritage(h: HeritageDepart): string | null {
  if (!Number.isInteger(h.generation) || h.generation < 2 || h.generation > HERITAGE.maxGeneration)
    return 'Génération d’héritage invalide.';
  if (!Number.isFinite(h.reputation) || h.reputation < 0 || h.reputation > HERITAGE.reputationMax)
    return 'Réputation héritée hors bornes.';
  if (
    h.bonus.some((b) => !HERITAGE_BONUS_IDS.includes(b)) ||
    new Set(h.bonus).size !== h.bonus.length
  )
    return 'Bonus d’héritage inconnu.';
  return null;
}

/** Applique l'héritage à l'état de départ d'une partie. */
export function appliquerHeritage(state: LabelState, h: HeritageDepart): void {
  const b = HERITAGE.bonus;
  state.label.reputation += h.reputation;
  if (h.bonus.includes('prestige'))
    state.label.reputation = clamp(state.label.reputation + b.prestige.reputation, 0, 100);
  if (h.bonus.includes('catalogue'))
    state.label.tresorerie = cents(state.label.tresorerie + b.catalogue.tresorerie);
  if (h.bonus.includes('fondation')) state.institution.influence = b.fondation.influence;
  if (h.bonus.includes('reseau'))
    for (const g of Object.keys(state.label.credibilite))
      state.label.credibilite[g] = (state.label.credibilite[g] ?? 0) + b.reseau.credibilite;
}
