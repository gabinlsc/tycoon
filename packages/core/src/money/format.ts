import type { Cents } from './cents';

const NARROW_NBSP = ' ';
const NBSP = ' ';

/**
 * Montant lisible en français : « 12 345,67 € ». Volontairement sans `Intl` : le résultat est
 * identique partout, ce qui garde les tests et les captures reproductibles.
 */
export function formatEuros(
  amount: Cents,
  options: { decimals?: boolean; signed?: boolean } = {},
): string {
  const { decimals = true, signed = false } = options;
  const negative = amount < 0;
  const absolute = Math.abs(amount);
  const wholeEuros = decimals ? Math.floor(absolute / 100) : Math.round(absolute / 100);
  const fraction = String(absolute % 100).padStart(2, '0');
  const grouped = String(wholeEuros).replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP);
  const sign = negative ? '−' : signed && absolute > 0 ? '+' : '';
  return `${sign}${grouped}${decimals ? `,${fraction}` : ''}${NBSP}€`;
}

/** Forme compacte pour les graphiques et tableaux denses : 1,2 k€, 3,4 M€. */
export function formatEurosCompact(amount: Cents): string {
  const negative = amount < 0;
  const euros = Math.abs(amount) / 100;
  const sign = negative ? '−' : '';
  const trim = (n: number): string => n.toFixed(1).replace(/\.0$/, '').replace('.', ',');
  if (euros >= 1_000_000_000) return `${sign}${trim(euros / 1_000_000_000)}${NBSP}Md€`;
  if (euros >= 1_000_000) return `${sign}${trim(euros / 1_000_000)}${NBSP}M€`;
  if (euros >= 1_000) return `${sign}${trim(euros / 1_000)}${NBSP}k€`;
  return `${sign}${Math.round(euros)}${NBSP}€`;
}
