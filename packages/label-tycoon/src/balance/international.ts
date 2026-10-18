import { type Cents, money } from '@tycoon/core';

export type PaysId = 'valdoria' | 'nordhelm' | 'solaria';
export const PAYS_IDS: readonly PaysId[] = ['valdoria', 'nordhelm', 'solaria'];

export interface PaysRules {
  nom: string;
  /** Taille du marché par rapport au marché d'origine (1 = aussi gros). */
  poids: number;
  /** Coût d'ouverture d'un bureau local. */
  ouverture: Cents;
  /** Frais annuels du bureau local. */
  fraisAnnuels: Cents;
  /** Goût du pays pour chaque genre (1 = comme chez soi, genres absents = 1). */
  affinites: Readonly<Record<string, number>>;
  /** Phase de la mode locale (fraction de période), pour que les pays ne varient pas ensemble. */
  phase: number;
}

/** Marchés internationaux (GDD, 14.5) : pays fictifs, goûts de genres, bureaux locaux et campagnes. */
export const PAYS: Readonly<Record<PaysId, PaysRules>> = {
  valdoria: {
    nom: 'Valdoria',
    poids: 0.3,
    ouverture: money.euros(250_000),
    fraisAnnuels: money.euros(80_000),
    affinites: { afro: 1.5, rnb: 1.3, dancehall: 1.2, rap: 0.7, drill: 0.5, variete: 0.8 },
    phase: 0,
  },
  nordhelm: {
    nom: 'Nordhelm',
    poids: 0.45,
    ouverture: money.euros(600_000),
    fraisAnnuels: money.euros(150_000),
    affinites: { 'electro-pop': 1.6, 'pop-urbaine': 1.2, variete: 1.3, afro: 0.6, dancehall: 0.6 },
    phase: 0.33,
  },
  solaria: {
    nom: 'Solaria',
    poids: 0.55,
    ouverture: money.euros(1_200_000),
    fraisAnnuels: money.euros(250_000),
    affinites: { latino: 1.8, dancehall: 1.4, trap: 1.2, variete: 0.7, rnb: 0.8 },
    phase: 0.66,
  },
};

export const INTERNATIONAL = {
  /** Budget hebdomadaire maximal de campagne par pays. */
  budgetMax: money.euros(100_000) as Cents,
  /** Gain de pénétration (points) par euro de budget, freiné en approchant de 100. */
  gainPerEuro: 0.000025,
  /** Part de la pénétration perdue chaque semaine (le public oublie vite un artiste lointain). */
  decay: 0.004,
  /** Part du revenu d'écoute local qui revient au label après distribution locale. */
  margin: 0.85,
  /** Mode locale : amplitude (± part) et période (semaines) du goût pour un genre. */
  driftAmplitude: 0.15,
  driftPeriod: 156,
  /** Présence d'un artiste sans bureau local dans les classements du pays : rivaux, puis artistes libres. */
  rivalPresence: 0.35,
  freePresence: 0.15,
  chartSize: 8,
} as const;
