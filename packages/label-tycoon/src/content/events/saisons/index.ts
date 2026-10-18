import type { LabelEvent } from '../helpers';
import { EVENEMENTS_SAISONNIERS_SPECS } from './specs';
import { evenement } from './moteur';

/** Événements des saisons de contenu : festivals, rentrée, fêtes, turbulences et technologies. */
export const SEASON_EVENTS: readonly LabelEvent[] = EVENEMENTS_SAISONNIERS_SPECS.map(evenement);
