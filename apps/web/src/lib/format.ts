import { SITE } from '../config/site';

const price = new Intl.NumberFormat(SITE.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const percent = new Intl.NumberFormat(SITE.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: 'exceptZero',
});

export const formatPrice = (value: number): string => price.format(value);

/** Variation en pourcentage, signe explicite : « +1,24 % ». */
export const formatPercent = (value: number): string => `${percent.format(value)} %`;
