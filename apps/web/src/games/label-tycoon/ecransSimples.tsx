import type { ComponentType } from 'react';
import { Calendrier } from './Calendrier';
import type { EcranId } from './ecrans';
import { Classements } from './Classements';
import { Marche } from './Marche';
import { Concurrence } from './Concurrence';
import { Finances } from './Finances';
import { Personnel } from './Personnel';
import { Batiments } from './Batiments';
import { Tournees } from './Tournees';
import { Fil } from './Fil';
import { Parametres } from './Parametres';
import { RapportMensuel } from './RapportMensuel';

/** Écrans sans état de navigation propre : un composant par identifiant. */
export const ECRANS_SIMPLES: Partial<Record<EcranId, ComponentType>> = {
  calendrier: Calendrier,
  classements: Classements,
  marche: Marche,
  concurrence: Concurrence,
  finances: Finances,
  personnel: Personnel,
  batiments: Batiments,
  tournees: Tournees,
  fil: Fil,
  parametres: Parametres,
  rapport: RapportMensuel,
};
