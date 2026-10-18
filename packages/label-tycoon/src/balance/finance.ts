import { type Cents, money } from '@tycoon/core';

/** Finances de base. Valeurs de départ à recaler par simulation (GDD, section 5.11). */
export const FINANCE = {
  /** Loyer et frais courants du home-studio, par semaine. D'autres coûts s'y ajoutent avec les bâtiments et le personnel. */
  weeklyBaseCost: money.euros(120) as Cents,
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
