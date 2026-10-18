import { type Cents, money } from '@tycoon/core';

/** Physique : vinyles et CD (GDD, 5.6 et 5.9). Valeurs de départ à recaler par simulation. */
export type PhysicalFormat = 'vinyle' | 'cd';

export const FORMATS: Readonly<
  Record<PhysicalFormat, { cout: Cents; prix: Cents; semaines: number; demande: number }>
> = {
  vinyle: { cout: money.euros(9), prix: money.euros(28), semaines: 8, demande: 1.2 },
  cd: { cout: money.euros(2), prix: money.euros(14), semaines: 4, demande: 0.8 },
};

export const PRESSING = {
  /** Commande minimale et maximale (exemplaires). */
  min: 100,
  max: 20_000,
  /** Part des « ventes équivalentes » de la semaine qui passe par le physique (× demande du format). */
  physicalShare: 0.03,
  /** Chaque niveau de bâtiment de pressage réduit le coût (part) et le délai (semaines). */
  costDiscountPerLevel: 0.1,
  weeksSavedPerLevel: 1,
  /** Après ce délai depuis l'arrivée, le stock restant est liquidé à `liquidationPrice` du prix. */
  liquidateAfter: 52,
  liquidationPrice: 0.2,
} as const;
