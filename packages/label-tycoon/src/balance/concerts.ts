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
  commissionBps: 2500,
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

/** Tournées et merch (GDD, 5.10). */
export const TOUR = {
  /** Dates par tournée. */
  dates: { min: 3, max: 20 },
  /** Fatigue à partir de laquelle l'artiste s'effondre (burnout) et annule le reste de la tournée. */
  burnoutFatigue: 90,
  /** Conséquences du burnout : moral perdu et semaines de repos forcé. */
  burnoutMoral: 30,
  restWeeks: 8,
  /** Merch : coût et prix unitaires, part des spectateurs qui achètent. */
  merchCost: money.euros(8) as Cents,
  merchPrice: money.euros(25) as Cents,
  merchRate: 0.15,
  /** Part du merch gardée par le label (plus la part 360). */
  merchLabelBps: 4000,
  /** Chaque niveau du tourneur réduit le coût des salles (part). */
  tourerDiscountPerLevel: 0.004,
} as const;

/** Festivals (GDD, 5.10) : candidatures en saison, cachets, effets de hype. */
export const FESTIVALS = {
  /** Semaine de l'année où les candidatures s'ouvrent, et fenêtre de l'été où ils se tiennent. */
  openWeek: 8,
  summer: { min: 22, max: 34 },
  /** Festivals proposés chaque année. */
  perYear: 4,
  /** Notoriété minimale (min..max tirée) et cachet de base selon le rang. */
  minNotoriety: { min: 15, max: 70 },
  baseFee: money.euros(1500) as Cents,
  feePerNotoriety: money.euros(250) as Cents,
  /** Un artiste dont la notoriété dépasse le minimum de cette marge passe en tête d'affiche. */
  headlinerMargin: 20,
  headlinerFeeFactor: 2.5,
  /** Part du cachet gardée par le label. */
  labelBps: 3500,
  hype: 12,
  headlinerHype: 25,
  headlinerCredibility: 3,
  fatigue: 6,
  names: [
    'Sunset',
    'Horizon',
    'Nova',
    'Terra',
    'Électrik',
    'Mirage',
    'Boréal',
    'Éclipse',
  ] as readonly string[],
  suffixes: ['Fest', 'Open Air', 'Live', 'Sessions'] as readonly string[],
} as const;

/** Synchronisation : offres de pub, film et jeu vidéo fictifs (GDD, 5.6). */
export const SYNC = {
  kinds: {
    pub: { cachet: money.euros(8000), hype: 4, fans: 800, moral: -5 },
    film: { cachet: money.euros(20_000), hype: 8, fans: 2500, moral: 3 },
    jeu: { cachet: money.euros(12_000), hype: 6, fans: 1800, moral: 4 },
  },
  /** Probabilité hebdomadaire par sortie, avant le facteur de qualité. */
  weeklyChance: 0.012,
  /** Qualité minimale d'une sortie pour recevoir des offres. */
  minQuality: 45,
  /** Validité d'une offre en semaines, et offres en attente maximum. */
  validWeeks: 6,
  maxPending: 5,
  /** Part du cachet gardée par le label (plus la part 360). */
  labelBps: 5000,
  /** Un artiste dont l'éthique dépasse ce seuil perd du moral avec une pub. */
  ethicsThreshold: 70,
  brands: ['Aurore', 'Vektor', 'Lumen', 'Nordic', 'Pixel Park', 'Cobalt'] as readonly string[],
} as const;
export type SyncKind = keyof typeof SYNC.kinds;
