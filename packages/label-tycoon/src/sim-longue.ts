import { ln } from '@tycoon/core';

/** Valorisation du label (centimes) mesurée à la fin d'une année de jeu. */
export interface PointValorisation {
  annee: number;
  valeur: number;
}

export interface AnalyseDivergence {
  /** Rapport de valorisation d'un palier de cinq ans au suivant (à partir de l’année 15, quand le label est installé). */
  ratiosParQuinquennat: { annee: number; ratio: number }[];
  /** Croissance annuelle moyenne (en log) sur la première, puis la troisième décennie. */
  croissanceDecennie1: number;
  croissanceDecennie3: number;
  divergent: boolean;
  raison: string | null;
}

/** Plafond du rapport de valorisation sur cinq ans, une fois le label établi (à partir de l’année 15, quand le label est installé). */
export const RATIO_MAX_QUINQUENNAT = 6;
/** La croissance de la troisième décennie doit rester sous cette part de celle de la première. */
export const PART_MAX_DECENNIE_3 = 0.75;

const valeurA = (points: readonly PointValorisation[], annee: number): number =>
  points.find((p) => p.annee === annee)?.valeur ?? 0;

/**
 * Garde-fou contre la divergence : la valorisation d'un tycoon grandit exponentiellement, mais la
 * friction (impôts, entretien, régulation, concurrence) doit faire ralentir la croissance. On vérifie
 * que le rapport sur cinq ans reste borné et que la croissance de la troisième décennie est plus lente
 * que celle de la première.
 */
export function analyserDivergence(points: readonly PointValorisation[]): AnalyseDivergence {
  const ratios: { annee: number; ratio: number }[] = [];
  for (let a = 20; a <= 30; a += 5) {
    const avant = valeurA(points, a - 5);
    const apres = valeurA(points, a);
    if (avant > 0 && apres > 0) ratios.push({ annee: a, ratio: apres / avant });
  }
  const taux = (de: number, a: number): number => {
    const v0 = valeurA(points, de);
    const v1 = valeurA(points, a);
    return v0 > 0 && v1 > 0 ? (ln(v1) - ln(v0)) / (a - de) : 0;
  };
  const c1 = taux(5, 15);
  const c3 = taux(20, 30);
  const trop = ratios.find((r) => r.ratio > RATIO_MAX_QUINQUENNAT);
  let raison: string | null = null;
  if (trop)
    raison = `la valorisation est multipliée par ${trop.ratio.toFixed(1)} en cinq ans (année ${trop.annee})`;
  else if (c1 > 0 && c3 > c1 * PART_MAX_DECENNIE_3)
    raison = `la croissance de la troisième décennie (${c3.toFixed(2)}/an) ne ralentit pas assez face à la première (${c1.toFixed(2)}/an)`;
  return {
    ratiosParQuinquennat: ratios,
    croissanceDecennie1: c1,
    croissanceDecennie3: c3,
    divergent: raison !== null,
    raison,
  };
}
