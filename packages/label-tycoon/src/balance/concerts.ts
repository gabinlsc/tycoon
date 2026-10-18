import { type Cents, money } from '@tycoon/core';

/** Concerts (GDD, 5.10). Valeurs de départ à recaler par simulation. */
export const VENUE_IDS = ['bar', 'club', 'salle', 'zenith', 'stade'] as const;
export type VenueId = (typeof VENUE_IDS)[number];

export interface Venue {
  capacite: number;
  /** Notoriété (0-100) à laquelle la salle se remplit. */
  notorieteRef: number;
  /** Coût fixe (salle, équipe, transport, assurance). */
  cout: Cents;
  /** Prix du billet de référence en euros. */
  prixRef: number;
}

export const VENUES: Readonly<Record<VenueId, Venue>> = {
  bar: { capacite: 150, notorieteRef: 10, cout: money.euros(300), prixRef: 10 },
  club: { capacite: 600, notorieteRef: 25, cout: money.euros(1500), prixRef: 18 },
  salle: { capacite: 2500, notorieteRef: 45, cout: money.euros(8000), prixRef: 30 },
  zenith: { capacite: 8000, notorieteRef: 65, cout: money.euros(35_000), prixRef: 45 },
  stade: { capacite: 50_000, notorieteRef: 85, cout: money.euros(400_000), prixRef: 70 },
};

export const CONCERTS = {
  /** Délai entre l'organisation et le concert (semaines). */
  leadWeeks: 2,
  /** Part de la billetterie conservée par le label (commission de producteur). */
  commissionBps: 3500,
  /** Sensibilité au prix : chaque doublement du prix réduit le remplissage de ce facteur. */
  priceElasticity: 0.6,
  /** Fatigue gagnée par concert. */
  fatigue: 8,
  /** Hype gagnée par concert réussi (remplissage > 80 %). */
  hypeBoost: 5,
  /** Fans gagnés par spectateur, avant le facteur de présence scénique (scène 50 = neutre). */
  fansPerSpectator: 0.05,
  /** Bonus de remplissage d'une salle de concert maison par niveau. */
  homeVenueFill: 0.05,
} as const;
