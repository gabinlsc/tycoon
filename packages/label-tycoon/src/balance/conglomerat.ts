import { type Cents, money } from '@tycoon/core';

/** Palier Conglomérat : plateforme maison, studios de synchro, festivals possédés (GDD, 14.1). */
export const PLATEFORME = {
  /** Coût de lancement de la plateforme. */
  creationCost: money.euros(200_000_000) as Cents,
  /** Budget hebdomadaire maximal d'acquisition et de technologie. */
  budgetMax: money.euros(10_000_000) as Cents,
  /** Abonnés gagnés par euro de budget (coût d'acquisition de 25 € par abonné). */
  subscribersPerEuro: 0.04,
  /** Marché potentiel d'abonnés, et croissance organique hebdomadaire de base (part des abonnés, freinée en s'approchant du marché). */
  market: 50_000_000,
  organicGrowth: 0.004,
  /** Gain de croissance par point d'exclusivité (1 = tout le catalogue exclusif) et désabonnements hebdomadaires. */
  exclusivityGrowth: 0.006,
  churn: 0.0015,
  /** Exclusivité complète : les désabonnements baissent de cette part. */
  exclusivityChurnRelief: 0.4,
  /** Revenu annuel par abonné et coût annuel (serveurs, licences). */
  arpuYear: money.euros(120) as Cents,
  costYear: money.euros(45) as Cents,
  /** Abonnés au-delà desquels toute l'écoute exclusive passe par la plateforme. */
  reachSubscribers: 5_000_000,
  /** Une écoute exclusive diffusée sur sa propre plateforme rapporte ce multiple d'une écoute externe. */
  exclusiveRevenueFactor: 1.4,
} as const;

export const STUDIOS_SYNCHRO = {
  cost: money.euros(80_000_000) as Cents,
  max: 3,
  /** Par niveau : probabilité d'offre multipliée, cachets multipliés, revenu passif hebdomadaire par sortie de qualité. */
  chancePerLevel: 1,
  cachetPerLevel: 0.25,
  passivePerRelease: money.euros(400) as Cents,
  minQuality: 45,
} as const;

export const FESTIVALS_MAISON = {
  cost: money.euros(120_000_000) as Cents,
  max: 3,
  /** Semaine de l'année où se tient un festival maison, et revenu de base par festival. */
  week: 28,
  baseRevenue: money.euros(30_000_000) as Cents,
  /** Revenu × (plancher + notoriété moyenne du roster / 100), et hype offerte aux artistes. */
  notorietyFloor: 0.5,
  hype: 5,
} as const;
