import { type Cents, money } from '@tycoon/core';

/** Rythme et plafonds du moteur d'événements. */
export const EVENTS = {
  /** Probabilité de tenter un événement chaque semaine. */
  chancePerWeek: 0.35,
  /** Nombre maximal d'événements par semaine. */
  maxPerWeek: 2,
  /** Décisions en attente de réponse au maximum. */
  maxPending: 6,
  /** Longueur maximale d'une chaîne d'événements. */
  maxChainDepth: 6,
  /** Taille de l'historique conservé dans la sauvegarde. */
  historyLimit: 300,
  /**
   * Mésaventures financières (procès, panne, inspection…) : le coût est plafonné à cette part de la
   * trésorerie, avec un plancher. Un petit label ne coule pas sur un seul coup du sort ; un gros label
   * paie le prix plein.
   */
  misfortuneCashShare: 0.35,
  misfortuneFloor: money.euros(1000) as Cents,
} as const;
