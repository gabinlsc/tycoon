import type { ComponentType } from 'react';
import { Calendrier } from './Calendrier';
import type { EcranId } from './ecrans';
import { Classements } from './Classements';
import { Marche } from './Marche';

/** Écrans sans état de navigation propre : un composant par identifiant. */
export const ECRANS_SIMPLES: Partial<Record<EcranId, ComponentType>> = {
  calendrier: Calendrier,
  classements: Classements,
  marche: Marche,
};
