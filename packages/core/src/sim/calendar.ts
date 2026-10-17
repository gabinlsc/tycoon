/**
 * Calendrier de jeu : 1 tick = 1 semaine, 52 semaines par an.
 *
 * Les mois suivent le calendrier « 4-4-5 » : trois mois de 4, 4 et 5 semaines par trimestre, soit
 * 12 mois par an et exactement 52 semaines. Chaque mois commence et finit sur une frontière de
 * semaine, ce qui garde les comptes mensuels simples et sans fraction de semaine.
 */

export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;
export const MONTH_LENGTHS: readonly number[] = [4, 4, 5, 4, 4, 5, 4, 4, 5, 4, 4, 5];

/** Semaine de départ (incluse) de chaque mois dans l'année, calculée une fois. */
const MONTH_STARTS: readonly number[] = MONTH_LENGTHS.reduce<number[]>(
  (starts, length, index) => [...starts, (starts[index] ?? 0) + length],
  [0],
).slice(0, MONTH_LENGTHS.length);

export interface CalendarDate {
  /** Année de jeu, à partir de 0. */
  year: number;
  /** Semaine dans l'année, de 1 à 52. */
  weekOfYear: number;
  /** Mois dans l'année, de 1 à 12. */
  month: number;
  /** Semaine dans le mois, à partir de 1. */
  weekOfMonth: number;
  isMonthStart: boolean;
  isMonthEnd: boolean;
  isYearEnd: boolean;
}

/** Date de jeu de la semaine d'indice `weekIndex` (la semaine 0 est la première de la partie). */
export function calendarOf(weekIndex: number): CalendarDate {
  if (!Number.isInteger(weekIndex) || weekIndex < 0) {
    throw new RangeError(`Indice de semaine invalide : ${String(weekIndex)}`);
  }
  const year = Math.floor(weekIndex / WEEKS_PER_YEAR);
  const inYear = weekIndex % WEEKS_PER_YEAR;
  let monthIndex = MONTH_STARTS.length - 1;
  while ((MONTH_STARTS[monthIndex] ?? 0) > inYear) monthIndex -= 1;
  const start = MONTH_STARTS[monthIndex] ?? 0;
  const length = MONTH_LENGTHS[monthIndex] ?? 4;
  const weekOfMonth = inYear - start + 1;
  return {
    year,
    weekOfYear: inYear + 1,
    month: monthIndex + 1,
    weekOfMonth,
    isMonthStart: weekOfMonth === 1,
    isMonthEnd: weekOfMonth === length,
    isYearEnd: inYear === WEEKS_PER_YEAR - 1,
  };
}

/** Indice de la première semaine de l'année `year` (à partir de 0). */
export const startOfYear = (year: number): number => year * WEEKS_PER_YEAR;
