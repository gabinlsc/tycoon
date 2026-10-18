import { type Cents, money } from '@tycoon/core';

/** Finances de base. Valeurs de départ à recaler par simulation (GDD, section 5.11). */
export const FINANCE = {
  /** Loyer et frais courants du home-studio, par semaine. D'autres coûts s'y ajoutent avec les bâtiments et le personnel. */
  weeklyBaseCost: money.euros(40) as Cents,
  /** Semaines de comptes conservées en détail (3 ans). Au-delà, il reste les mois puis les années. */
  weekHistory: 156,
  /** Mois de comptes conservés (5 ans). Les années sont conservées sans limite (une ligne par an). */
  monthHistory: 60,
} as const;

/** Prêts bancaires (GDD, 5.11). */
export const LOANS = {
  /** Taux annuel de base (points de base), réduit selon la réputation et majoré par les impayés. */
  baseRateBps: 1400,
  rateDiscountPerReputationBps: 8,
  defaultPenaltyBps: 250,
  minRateBps: 400,
  /** Plafond d'encours : plancher + part du chiffre d'affaires annuel, majoré par la réputation. */
  capFloor: money.euros(20_000) as Cents,
  capRevenueShare: 0.5,
  capReputationBonus: 0.01,
  /** Durée en semaines (bornes) et montant minimal. */
  weeks: { min: 13, max: 260 },
  minAmount: money.euros(1000) as Cents,
  /** Nombre maximal de prêts en cours. */
  maxActive: 3,
} as const;

/** Investisseurs (GDD, 5.11) : apport de cash contre une part de la valorisation et des objectifs. */
export const INVESTORS = {
  /** Réputation minimale pour attirer des offres, et probabilité hebdomadaire d'en recevoir une. */
  minReputation: 15,
  weeklyChance: 0.01,
  /** Offres en attente et investisseurs actifs maximum. */
  maxPending: 2,
  maxActive: 2,
  /** Validité d'une offre (semaines). */
  validWeeks: 8,
  /** Apport : multiple du chiffre d'affaires annuel, avec plancher. */
  advanceFloor: money.euros(50_000) as Cents,
  advanceRevenueMultiple: 0.8,
  /** Part de la valorisation finale cédée (points de base), tirée dans cette plage. */
  shareBps: { min: 500, max: 2000 },
  /** Objectif de chiffre d'affaires annuel : multiple du CA actuel, avec plancher, à tenir sous `deadlineWeeks`. */
  goalMultiple: 1.5,
  goalFloor: money.euros(100_000) as Cents,
  deadlineWeeks: 104,
  /** Objectif manqué : pénalité (part de l'apport) et part supplémentaire cédée. */
  penaltyShare: 0.2,
  extraShareBps: 1000,
  /** Objectif tenu : réputation gagnée. */
  reputationGain: 3,
  names: [
    'Capital Horizon',
    'Fonds Atlas',
    'Nova Ventures',
    'Maison Delcourt',
    'Groupe Verdier',
  ] as readonly string[],
} as const;

/** Faillite (GDD, 5.11). */
export const BANKRUPTCY = {
  /** Semaines consécutives de trésorerie négative qui terminent la partie. */
  weeks: 8,
  /** Prix de vente d'un contrat à un rival : valeur de l'avance juste × années restantes × ce facteur. */
  contractSaleFactor: 1.5,
} as const;

/** Fiscalité (GDD, 5.11) : impôt annuel sur les bénéfices, optimisation et contrôle. */
export type TaxStrategy = 'prudente' | 'optimisee' | 'agressive';

export const TAX = {
  /** Taux légal sur le bénéfice (points de base). */
  legalRateBps: 2500,
  strategies: {
    prudente: { rateBps: 2500, auditChance: 0 },
    optimisee: { rateBps: 1800, auditChance: 0.08 },
    agressive: { rateBps: 1000, auditChance: 0.25 },
  } as Readonly<Record<TaxStrategy, { rateBps: number; auditChance: number }>>,
  /** Redressement : impôt éludé × ce facteur (pénalités comprises). */
  auditPenaltyFactor: 1.5,
  /** Réputation perdue après un contrôle sanctionné. */
  auditReputationLoss: 4,
} as const;

/** Valorisation du label (score principal, GDD 5.1). */
export const VALUATION = {
  /** Horizon d'extrapolation de la traîne d'une sortie (semaines). */
  catalogHorizon: 156,
  /** Taux d'actualisation annuel (points de base). */
  discountRateBps: 1000,
  /** Valeur d'un contrat : avance juste × années restantes × ce facteur. */
  contractFactor: 0.5,
} as const;
