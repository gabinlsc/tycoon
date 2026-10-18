import { type Cents, money } from '@tycoon/core';

/** Palier Groupe : sous-labels dirigés par des cadres (GDD, 14.1). Valeurs de départ à recaler par simulation. */
export const CADRE_STYLES = ['prudent', 'ambitieux', 'flambeur'] as const;
export type CadreStyle = (typeof CADRE_STYLES)[number];

export const GROUPE = {
  /** Coût de création d'un sous-label. */
  creationCost: money.euros(5_000_000) as Cents,
  /** Sous-labels simultanés au maximum, selon le palier du groupe. */
  maxSubLabels: { groupe: 3, conglomerat: 6, institution: 10 } as Readonly<Record<string, number>>,
  /** Enveloppe hebdomadaire maximale d'un sous-label. */
  envelopeMax: money.euros(3_000_000) as Cents,
  /** Rendement d'un euro d'enveloppe : base + niveau du cadre × facteur + (popularité du genre − 50) × facteur. */
  returnBase: 0.7,
  returnPerLevel: 0.5,
  returnPerPopularity: 0.4,
  /** Sans cadre, le sous-label tourne au ralenti. */
  noExecutiveFactor: 0.6,
  /** Capacité d'absorption : au-delà, chaque euro de plus rapporte moins (racine du rapport). */
  capacityBase: money.euros(400_000) as Cents,
  capacityPerLevel: 1 / 50,
  /** Écart-type du hasard hebdomadaire, par style de cadre. */
  noiseSd: { prudent: 0.05, ambitieux: 0.12, flambeur: 0.25 } as Readonly<
    Record<CadreStyle, number>
  >,
  /** Biais de rendement par style : le flambeur vise haut, le prudent un peu moins. */
  styleBias: { prudent: -0.02, ambitieux: 0, flambeur: 0.04 } as Readonly<
    Record<CadreStyle, number>
  >,
  /** Cadres proposés en même temps, et niveaux possibles. */
  poolSize: 4,
  refreshEvery: 8,
  level: { min: 25, max: 90 },
  integrity: { min: 15, max: 95 },
  /** Salaire hebdomadaire d'un cadre : plancher + niveau × facteur. */
  salaryFloor: money.euros(4000) as Cents,
  salaryPerLevel: money.euros(150) as Cents,
  /** Un cadre peu intègre peut détourner : seuil, probabilité hebdomadaire, multiple de l'enveloppe emporté. */
  embezzleBelow: 40,
  embezzleChance: 0.01,
  embezzleMultiple: 4,
  /** Imprécision sur le niveau d'un cadre : demi-largeur initiale (points) et réduction par semaine de service. */
  fogWidth: 20,
  fogPerWeek: 0.25,
  /** Semaines de service après lesquelles la fiabilité d'un cadre est lisible. */
  integrityKnownAfter: 104,
  /** Rachat d'un rival : multiple de sa valorisation. */
  buyoutMultiple: 1.25,
} as const;
