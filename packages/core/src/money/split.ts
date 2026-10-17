import { type Cents, cents } from './cents';

/**
 * Répartit `total` selon des poids entiers sans perdre ni créer un centime : la somme des parts
 * vaut exactement `total` (méthode du plus fort reste). À égalité de reste, la part d'indice le
 * plus bas passe avant : le résultat est donc totalement déterministe.
 *
 * Fonctionne aussi pour un total négatif (une dette se répartit comme une créance). Le calcul
 * est fait en BigInt : aucun produit ne peut déborder, quelle que soit la taille des montants.
 */
export function split(total: Cents, weights: readonly number[]): Cents[] {
  if (weights.length === 0) throw new RangeError('Aucune part à répartir');
  let weightSum = 0n;
  for (const w of weights) {
    if (!Number.isSafeInteger(w) || w < 0) throw new RangeError(`Poids invalide : ${String(w)}`);
    weightSum += BigInt(w);
  }
  if (weightSum <= 0n) throw new RangeError('La somme des poids doit être positive');

  const negative = total < 0;
  const absTotal = BigInt(Math.abs(total));

  const parts = weights.map((w, index) => {
    const numerator = absTotal * BigInt(w);
    return { index, share: numerator / weightSum, remainder: numerator % weightSum };
  });

  let leftover = absTotal - parts.reduce((acc, p) => acc + p.share, 0n);
  const byRemainder = [...parts].sort((a, b) => {
    if (a.remainder === b.remainder) return a.index - b.index;
    return a.remainder > b.remainder ? -1 : 1;
  });
  // Le reste à distribuer est strictement inférieur au nombre de parts : on en donne 1 centime
  // aux parts qui ont le plus gros reste.
  for (const part of byRemainder) {
    if (leftover <= 0n) break;
    part.share += 1n;
    leftover -= 1n;
  }

  return parts.map((p) => cents(negative ? -Number(p.share) : Number(p.share)));
}

/** Part égale entre `n` bénéficiaires, le reste allant aux premiers. */
export function splitEvenly(total: Cents, n: number): Cents[] {
  if (!Number.isInteger(n) || n <= 0) throw new RangeError('Nombre de parts invalide');
  return split(total, new Array<number>(n).fill(1));
}
