/**
 * Fonctions mathématiques **reproductibles à l'identique** sur tous les moteurs JavaScript.
 *
 * Pourquoi : la norme n'exige pas que `Math.exp`, `Math.log`, `Math.pow`, `Math.sin`, `Math.cos`…
 * renvoient exactement le même résultat d'un moteur à l'autre (V8, SpiderMonkey, JavaScriptCore
 * peuvent différer sur le dernier bit). Une simulation rejouée par un serveur (validation du défi
 * du jour) ou sur un autre navigateur divergerait alors, rarement mais sûrement.
 *
 * Seules l'addition, la soustraction, la multiplication, la division et la racine carrée sont
 * garanties exactement arrondies (IEEE 754). Tout est donc reconstruit ici avec ces seules
 * opérations, plus des manipulations de bits à endianness explicite. Précision visée : quelques
 * unités du dernier bit, largement suffisante, puisque tout résultat financier est ensuite arrondi
 * au centime.
 *
 * Les versions natives sont interdites dans la simulation par ESLint et par le test d'architecture.
 */

export const LN2 = 0.6931471805599453;
export const LN10 = 2.302585092994046;
export const PI = 3.141592653589793;
export const SQRT2 = 1.4142135623730951;

// Découpage de ln 2 en deux morceaux (fdlibm) : `k × LN2_HI` est exact pour |k| < 2048.
const LN2_HI = 6.9314718036912381649e-1;
const LN2_LO = 1.90821492927058770002e-10;
const INV_LN2 = 1.4426950408889634;

// π/2 en deux morceaux (Cody-Waite) pour la réduction d'argument de sin et cos.
const PIO2_HI = 1.57079632673412561417;
const PIO2_LO = 6.07710050650619224932e-11;
const TWO_OVER_PI = 0.6366197723675814;

const buffer = new DataView(new ArrayBuffer(8));

/** 2^k exact pour -1022 ≤ k ≤ 1023, construit bit à bit (big-endian explicite). */
function pow2(k: number): number {
  buffer.setUint32(0, ((k + 1023) << 20) >>> 0, false);
  buffer.setUint32(4, 0, false);
  return buffer.getFloat64(0, false);
}

/** x × 2^k sans passer par `Math.pow`, même pour de grands |k|. */
function ldexp(x: number, k: number): number {
  let value = x;
  let exponent = k;
  for (let i = 0; i < 2 && exponent > 1023; i += 1) {
    value *= pow2(1023);
    exponent -= 1023;
  }
  for (let i = 0; i < 2 && exponent < -1022; i += 1) {
    value *= pow2(-1022);
    exponent += 1022;
  }
  return value * pow2(Math.max(-1022, Math.min(1023, exponent)));
}

/** e^x. Réduction : x = k·ln 2 + r avec |r| ≤ ln 2 / 2, puis série de Taylor de e^r. */
export function exp(x: number): number {
  if (Number.isNaN(x)) return Number.NaN;
  if (x > 709.782712893384) return Infinity;
  if (x < -745.1332191019411) return 0;
  const k = Math.round(x * INV_LN2);
  const r = x - k * LN2_HI - k * LN2_LO;
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 20; n += 1) {
    term = (term * r) / n;
    sum += term;
  }
  return ldexp(sum, k);
}

const TWO_POW_54 = 18014398509481984;

/** ln(x). Décomposition x = m · 2^e, puis ln(m) = 2·atanh((m−1)/(m+1)) en série. */
export function ln(x: number): number {
  if (Number.isNaN(x) || x < 0) return Number.NaN;
  if (x === 0) return -Infinity;
  if (x === Infinity) return Infinity;

  let m = x;
  let e = 0;
  if (m < 2.2250738585072014e-308) {
    m *= TWO_POW_54; // nombre dénormalisé : on le remonte avant d'extraire l'exposant
    e -= 54;
  }
  buffer.setFloat64(0, m, false);
  const high = buffer.getUint32(0, false);
  e += ((high >>> 20) & 0x7ff) - 1023;
  buffer.setUint32(0, ((high & 0x000fffff) | 0x3ff00000) >>> 0, false);
  m = buffer.getFloat64(0, false); // mantisse dans [1, 2)
  if (m > SQRT2) {
    m /= 2;
    e += 1;
  }

  const s = (m - 1) / (m + 1);
  const s2 = s * s;
  let term = s;
  let sum = 0;
  for (let j = 0; j < 14; j += 1) {
    sum += term / (2 * j + 1);
    term *= s2;
  }
  return e * LN2_HI + (2 * sum + e * LN2_LO);
}

export const log10 = (x: number): number => ln(x) / LN10;
export const log2 = (x: number): number => ln(x) / LN2;

/** x^n pour un entier n, par exponentiation rapide (uniquement des multiplications exactes). */
export function powInt(x: number, n: number): number {
  if (!Number.isInteger(n)) throw new RangeError('powInt attend un exposant entier');
  let exponent = Math.abs(n);
  let base = x;
  let result = 1;
  while (exponent > 0) {
    if (exponent % 2 === 1) result *= base;
    base *= base;
    exponent = Math.floor(exponent / 2);
  }
  return n < 0 ? 1 / result : result;
}

/** x^y. Exposant entier : multiplications exactes ; sinon e^(y·ln x), réservé à x > 0. */
export function pow(x: number, y: number): number {
  if (y === 0 || x === 1) return 1;
  if (Number.isNaN(x) || Number.isNaN(y)) return Number.NaN;
  if (x === 0) return y > 0 ? 0 : Infinity;
  if (Number.isInteger(y) && Math.abs(y) <= 4096) return powInt(x, y);
  if (x < 0) return Number.NaN;
  return exp(y * ln(x));
}

/** Réduit x à r dans [−π/4, π/4] et renvoie aussi le quadrant (0 à 3). */
function reduce(x: number): { r: number; quadrant: number } {
  if (!Number.isFinite(x) || Math.abs(x) > 1e6) {
    throw new RangeError(`Angle hors de la plage supportée : ${String(x)}`);
  }
  const n = Math.round(x * TWO_OVER_PI);
  const r = x - n * PIO2_HI - n * PIO2_LO;
  return { r, quadrant: ((n % 4) + 4) % 4 };
}

function sinSeries(r: number): number {
  const r2 = r * r;
  let term = r;
  let sum = r;
  for (let n = 1; n <= 9; n += 1) {
    term = (-term * r2) / (2 * n * (2 * n + 1));
    sum += term;
  }
  return sum;
}

function cosSeries(r: number): number {
  const r2 = r * r;
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 9; n += 1) {
    term = (-term * r2) / ((2 * n - 1) * (2 * n));
    sum += term;
  }
  return sum;
}

export function sin(x: number): number {
  const { r, quadrant } = reduce(x);
  if (quadrant === 0) return sinSeries(r);
  if (quadrant === 1) return cosSeries(r);
  if (quadrant === 2) return -sinSeries(r);
  return -cosSeries(r);
}

export function cos(x: number): number {
  const { r, quadrant } = reduce(x);
  if (quadrant === 0) return cosSeries(r);
  if (quadrant === 1) return -sinSeries(r);
  if (quadrant === 2) return -cosSeries(r);
  return sinSeries(r);
}
