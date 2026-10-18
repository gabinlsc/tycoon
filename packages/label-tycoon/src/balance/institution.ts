import { type Cents, money } from '@tycoon/core';

/** Palier Institution : fondation, académie d'artistes, musée du label, influence (GDD, 14.1). */
export const FONDATION = {
  /** Don hebdomadaire maximal. */
  donMax: money.euros(5_000_000) as Cents,
  /** Influence gagnée par million d'euros donné (don hebdomadaire). */
  influencePerMillion: 0.4,
} as const;

export const ACADEMIE = {
  /** Coût par niveau, jusqu'à 3. */
  cost: [
    money.euros(150_000_000),
    money.euros(300_000_000),
    money.euros(600_000_000),
  ] as readonly Cents[],
  max: 3,
  /** Budget hebdomadaire maximal. */
  budgetMax: money.euros(4_000_000) as Cents,
  /** Une promotion sort tous les `cycle` semaines si le budget couvre au moins ce plancher. */
  cycle: 26,
  budgetFloor: money.euros(500_000) as Cents,
  /** Part de diplômés de niveau « confirmé » par niveau d'académie (le reste : espoirs). */
  confirmedPerLevel: 0.2,
  /** Loyauté minimale des diplômés (ils sont formés par la maison) et durée de leur premier contrat. */
  minLoyalty: 75,
  contractYears: 3,
} as const;

export const MUSEE = {
  cost: [
    money.euros(80_000_000),
    money.euros(200_000_000),
    money.euros(400_000_000),
  ] as readonly Cents[],
  max: 3,
  /** Revenu annuel par niveau (visites, boutique), plus un supplément par certification. */
  revenueYear: money.euros(6_000_000) as Cents,
  perCertification: money.euros(250_000) as Cents,
  /** Semaine de l'année où le revenu tombe. */
  week: 40,
  /** Influence gagnée par semaine et par niveau. */
  influencePerLevel: 0.05,
} as const;

export const INFLUENCE = {
  max: 100,
  /** Influence gagnée chaque semaine par un label au palier Institution. */
  weekly: 0.1,
  rules: {
    /** Fait pression pour de meilleurs tarifs de streaming. */
    remuneration: { cost: 40, weeks: 52, bonus: 0.08 },
    /** Soutien à la scène : de nouveaux talents arrivent sur le marché. */
    vivier: { cost: 25, talents: 6 },
  },
} as const;
