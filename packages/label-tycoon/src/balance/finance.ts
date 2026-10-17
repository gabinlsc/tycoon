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
