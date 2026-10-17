import { pow, powInt } from './dmath';

/** Facteur d'actualisation (1 + taux)^(−périodes) : valeur aujourd'hui d'un euro reçu plus tard. */
export const discountFactor = (ratePerPeriod: number, periods: number): number =>
  1 / pow(1 + ratePerPeriod, periods);

/** Valeur actuelle d'un flux unique. */
export const presentValue = (cashflow: number, ratePerPeriod: number, periods: number): number =>
  cashflow * discountFactor(ratePerPeriod, periods);

/**
 * Somme d'une suite géométrique : first + first·q + … + first·q^(n−1).
 * Sert à estimer les revenus futurs d'une traîne qui décroît à rythme constant.
 */
export function geometricSum(first: number, ratio: number, terms: number): number {
  if (!Number.isInteger(terms) || terms < 0) throw new RangeError('Nombre de termes invalide');
  if (terms === 0) return 0;
  if (ratio === 1) return first * terms;
  return (first * (1 - powInt(ratio, terms))) / (1 - ratio);
}

/** Valeur actuelle d'une traîne décroissante : revenu hebdomadaire `first`, qui perd une fraction à chaque période. */
export function decayingStreamValue(
  first: number,
  decayPerPeriod: number,
  discountPerPeriod: number,
  periods: number,
): number {
  const ratio = (1 - decayPerPeriod) / (1 + discountPerPeriod);
  return geometricSum(first, ratio, periods);
}

/** Mensualité constante d'un prêt amorti (taux par période, nombre de périodes). */
export function annuityPayment(principal: number, ratePerPeriod: number, periods: number): number {
  if (periods <= 0) throw new RangeError('Durée invalide');
  if (ratePerPeriod === 0) return principal / periods;
  const factor = powInt(1 + ratePerPeriod, periods);
  return (principal * ratePerPeriod * factor) / (factor - 1);
}
