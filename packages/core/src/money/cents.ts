/**
 * Argent en centimes, en entiers. Jamais de flottant dans l'état.
 *
 * Politique d'arrondi, unique et centralisée : **arrondi au plus proche, les égalités vers le
 * pair** (« arrondi du banquier »). Il n'introduit aucun biais systématique : sur des milliers de
 * versements, les arrondis vers le haut et vers le bas se compensent. Toute conversion d'un
 * flottant en centimes passe par `fromFloat`, et toute division par `mulDivRound`.
 */

export type Cents = number & { readonly __brand: 'Cents' };

export const MAX_CENTS = Number.MAX_SAFE_INTEGER;

/** Valide qu'un nombre est un montant en centimes représentable exactement. */
export function cents(value: number): Cents {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Montant invalide (entier sûr attendu) : ${String(value)}`);
  }
  return (value === 0 ? 0 : value) as Cents; // normalise -0
}

export const ZERO = 0 as Cents;

/** Arrondi d'un flottant à l'entier le plus proche, égalités vers le pair. */
export function roundHalfEven(x: number): number {
  if (!Number.isFinite(x)) throw new RangeError(`Valeur non finie : ${String(x)}`);
  const floor = Math.floor(x);
  const diff = x - floor;
  let rounded: number;
  if (diff < 0.5) rounded = floor;
  else if (diff > 0.5) rounded = floor + 1;
  else rounded = floor % 2 === 0 ? floor : floor + 1;
  return rounded === 0 ? 0 : rounded;
}

/** Seule porte d'entrée d'un flottant (ex. un résultat de formule) vers les centimes. */
export function fromFloat(centsAsFloat: number): Cents {
  return cents(roundHalfEven(centsAsFloat));
}

/** Euros entiers ou décimaux vers centimes (`euros(12.34)` donne 1234). */
export function euros(amount: number): Cents {
  // 12.34 × 100 = 1233,9999999999998 en flottant : l'arrondi au centime corrige cela
  return fromFloat(amount * 100);
}

/**
 * Calcule `a × b / d` en entiers avec arrondi demi-pair. Passe en BigInt dès que le produit
 * dépasse la plage sûre, pour ne jamais perdre un centime.
 */
export function mulDivRound(a: number, b: number, d: number): number {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b) || !Number.isSafeInteger(d)) {
    throw new RangeError('mulDivRound attend des entiers sûrs');
  }
  if (d === 0) throw new RangeError('Division par zéro');
  const product = a * b;
  if (Number.isSafeInteger(product)) return divRoundInt(product, d);

  const num = BigInt(a) * BigInt(b);
  const den = BigInt(d);
  const neg = num < 0n !== den < 0n;
  const absNum = num < 0n ? -num : num;
  const absDen = den < 0n ? -den : den;
  let q = absNum / absDen;
  const r = absNum % absDen;
  const twice = r * 2n;
  if (twice > absDen || (twice === absDen && q % 2n === 1n)) q += 1n;
  const result = neg ? -q : q;
  if (result > BigInt(MAX_CENTS) || result < -BigInt(MAX_CENTS)) {
    throw new RangeError('Montant hors limites');
  }
  return Number(result);
}

/** Division entière avec arrondi demi-pair, exacte pour les entiers sûrs. */
function divRoundInt(n: number, d: number): number {
  const sign = n < 0 !== d < 0 ? -1 : 1;
  const absN = Math.abs(n);
  const absD = Math.abs(d);
  let q = Math.floor(absN / absD);
  let r = absN - q * absD;
  // La division flottante peut se tromper d'une unité sur de grands nombres : on corrige.
  while (r < 0) {
    q -= 1;
    r += absD;
  }
  while (r >= absD) {
    q += 1;
    r -= absD;
  }
  const twice = r * 2;
  if (twice > absD || (twice === absD && q % 2 === 1)) q += 1;
  const result = sign * q;
  return result === 0 ? 0 : result;
}

export const add = (a: Cents, b: Cents): Cents => cents(a + b);
export const sub = (a: Cents, b: Cents): Cents => cents(a - b);
export const neg = (a: Cents): Cents => cents(-a);
export const abs = (a: Cents): Cents => cents(Math.abs(a));
export const sum = (values: readonly Cents[]): Cents => values.reduce<Cents>(add, ZERO);
export const min = (a: Cents, b: Cents): Cents => (a <= b ? a : b);
export const max = (a: Cents, b: Cents): Cents => (a >= b ? a : b);
export const clamp = (value: Cents, low: Cents, high: Cents): Cents => max(low, min(value, high));
export const isNegative = (a: Cents): boolean => a < 0;

/** Multiplication par un entier (nombre de semaines, de places…). */
export const mulInt = (a: Cents, n: number): Cents => cents(mulDivRound(a, n, 1));

/**
 * Applique un taux exprimé en **points de base** (1 pb = 0,01 %), donc en entier :
 * 25,5 % de royalties s'écrit 2550. Évite d'additionner des erreurs de flottants.
 */
export const applyBps = (a: Cents, bps: number): Cents => cents(mulDivRound(a, bps, 10_000));

/** Applique un taux flottant (résultat de formule). Un seul arrondi, en sortie. */
export const applyRate = (a: Cents, rate: number): Cents => fromFloat(a * rate);
