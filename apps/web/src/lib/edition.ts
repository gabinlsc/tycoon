import { SITE } from '../config/site';

const MS_PER_DAY = 86_400_000;

/** Date longue en français : « samedi 17 octobre 2026 ». */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(SITE.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Numéro d'édition fictif : un numéro par jour depuis la date de lancement.
 * On compare des dates UTC à minuit pour éviter les sauts liés à l'heure d'été.
 */
export function editionNumber(date: Date): number {
  const origin = Date.parse(`${SITE.editionOrigin}T00:00:00Z`);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(1, Math.floor((today - origin) / MS_PER_DAY) + 1);
}

export function formatEdition(n: number): string {
  return `N° ${new Intl.NumberFormat(SITE.locale).format(n)}`;
}
