/**
 * Catégories du compte de résultat. Listes fixes : elles donnent un ordre d'affichage et
 * d'itération stable (jamais l'ordre d'insertion d'un objet).
 */
export const REVENUE_CATEGORIES = [
  'streaming',
  'physique',
  'concerts',
  'merch',
  'synchro',
  'cessions',
  'autres',
] as const;

export const EXPENSE_CATEGORIES = [
  'salaires',
  'entretien',
  'production',
  'marketing',
  'avances',
  'royalties',
  'tournees',
  'reperage',
  'interets',
  'impots',
  'autres',
] as const;

export type RevenueCategory = (typeof REVENUE_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
