/**
 * Traits narratifs des artistes. Chaque trait modifie des paramètres précis (GDD, section 5.2) :
 * - `ego`, `ethique`, `loyaute` : points ajoutés à la génération ;
 * - `fatigue`, `scandale`, `progression` : multiplicateurs utilisés par les systèmes de carrière,
 *   de fatigue et d'événements (1 = sans effet).
 * Les noms affichés vivent dans `strings/fr.ts`.
 */

export const TRAIT_IDS = [
  'perfectionniste',
  'fetard',
  'discret',
  'provocateur',
  'bosseur',
  'diva',
  'loyal',
  'opportuniste',
  'solitaire',
  'sociable',
  'paresseux',
  'visionnaire',
  'prudent',
  'impulsif',
  'humble',
  'ambitieux',
  'nostalgique',
  'militant',
  'cerebral',
  'instinctif',
] as const;

export type TraitId = (typeof TRAIT_IDS)[number];

export interface TraitDef {
  id: TraitId;
  /** Traits qui ne peuvent pas coexister avec celui-ci. */
  incompatibles: readonly TraitId[];
  ego?: number;
  ethique?: number;
  loyaute?: number;
  /** Multiplicateur de la fatigue accumulée (> 1 : se fatigue plus vite). */
  fatigue?: number;
  /** Multiplicateur de la probabilité de scandale. */
  scandale?: number;
  /** Multiplicateur de la vitesse de progression des compétences. */
  progression?: number;
}

export const TRAITS: Readonly<Record<TraitId, TraitDef>> = {
  perfectionniste: {
    id: 'perfectionniste',
    incompatibles: ['paresseux', 'impulsif'],
    ethique: 12,
    progression: 1.15,
    fatigue: 1.15,
  },
  fetard: {
    id: 'fetard',
    incompatibles: ['prudent', 'bosseur'],
    ethique: -10,
    scandale: 1.6,
    fatigue: 1.25,
  },
  discret: { id: 'discret', incompatibles: ['provocateur', 'diva'], ego: -10, scandale: 0.5 },
  provocateur: { id: 'provocateur', incompatibles: ['discret', 'humble'], ego: 8, scandale: 1.8 },
  bosseur: {
    id: 'bosseur',
    incompatibles: ['paresseux', 'fetard'],
    ethique: 14,
    progression: 1.2,
    fatigue: 1.2,
  },
  diva: { id: 'diva', incompatibles: ['discret', 'humble'], ego: 18, loyaute: -6, scandale: 1.3 },
  loyal: { id: 'loyal', incompatibles: ['opportuniste'], loyaute: 20 },
  opportuniste: { id: 'opportuniste', incompatibles: ['loyal'], loyaute: -18, ego: 5 },
  solitaire: { id: 'solitaire', incompatibles: ['sociable'], loyaute: 4, scandale: 0.8 },
  sociable: { id: 'sociable', incompatibles: ['solitaire'], loyaute: 4, scandale: 1.1 },
  paresseux: {
    id: 'paresseux',
    incompatibles: ['bosseur', 'perfectionniste', 'ambitieux'],
    ethique: -16,
    progression: 0.8,
    fatigue: 0.8,
  },
  visionnaire: { id: 'visionnaire', incompatibles: ['nostalgique'], ethique: 4, progression: 1.1 },
  prudent: { id: 'prudent', incompatibles: ['impulsif', 'fetard'], scandale: 0.6 },
  impulsif: {
    id: 'impulsif',
    incompatibles: ['prudent', 'perfectionniste', 'cerebral'],
    scandale: 1.4,
  },
  humble: { id: 'humble', incompatibles: ['diva', 'provocateur'], ego: -14, loyaute: 6 },
  ambitieux: {
    id: 'ambitieux',
    incompatibles: ['paresseux'],
    ego: 8,
    ethique: 6,
    loyaute: -6,
    progression: 1.1,
  },
  nostalgique: { id: 'nostalgique', incompatibles: ['visionnaire'], loyaute: 6, progression: 0.95 },
  militant: { id: 'militant', incompatibles: [], ethique: 6, scandale: 1.3 },
  cerebral: {
    id: 'cerebral',
    incompatibles: ['impulsif', 'instinctif'],
    ethique: 4,
    progression: 1.05,
  },
  instinctif: { id: 'instinctif', incompatibles: ['cerebral'], scandale: 1.1 },
};
