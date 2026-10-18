import { ARTIST_EVENTS } from './artistes';
import { PRODUCTION_EVENTS } from './production';
import type { LabelEvent } from './helpers';

/** Tous les événements du jeu, par catégorie. */
export const LABEL_EVENTS: readonly LabelEvent[] = [...ARTIST_EVENTS, ...PRODUCTION_EVENTS];

export type { LabelEvent };
