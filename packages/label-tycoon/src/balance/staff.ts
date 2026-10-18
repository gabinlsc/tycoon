import { type Cents, money } from '@tycoon/core';

/** Personnel (GDD, 5.8). Valeurs de départ à recaler par simulation. */
export const STAFF_ROLES = [
  'producteur',
  'ingenieur',
  'attache',
  'community-manager',
  'tourneur',
  'juriste',
  'directeur-financier',
] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const STAFF_TRAITS = ['ambitieux', 'loyal', 'perfectionniste', 'paresseux'] as const;
export type StaffTrait = (typeof STAFF_TRAITS)[number];

export const STAFF = {
  /** Candidats disponibles en même temps, et période de renouvellement (semaines). */
  poolSize: 6,
  refreshEvery: 4,
  /** Équipe maximale. */
  maxTeam: 12,
  /** Niveau des candidats générés. */
  level: { min: 15, max: 80 },
  /** Salaire hebdomadaire = plancher + niveau × facteur. */
  salaryFloor: money.euros(150) as Cents,
  salaryPerLevel: money.euros(8) as Cents,
  /** Moral : valeur vers laquelle il dérive, et vitesse. */
  moralTarget: 60,
  moralDrift: 0.05,
  /** Expérience gagnée par semaine, seuil pour gagner un niveau, et effet des traits. */
  expPerWeek: 1,
  expPerLevel: 52,
  traitProgress: { ambitieux: 1.2, loyal: 1, perfectionniste: 1.5, paresseux: 0.5 } as Readonly<
    Record<StaffTrait, number>
  >,
  /** Un ambitieux au moral bas peut partir chez un rival (probabilité hebdomadaire). */
  ambitiousLeaveMoral: 40,
  ambitiousLeaveChance: 0.03,
} as const;
