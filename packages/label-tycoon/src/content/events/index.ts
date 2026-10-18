import { ARTIST_EVENTS } from './artistes';
import { CEREMONY_EVENTS } from './ceremonies';
import { BUSINESS_EVENTS } from './business';
import { MEDIA_EVENTS } from './medias';
import { MARKET_EVENTS } from './marche';
import { PRODUCTION_EVENTS } from './production';
import type { LabelEvent } from './helpers';

/** Tous les événements du jeu, par catégorie. */
export const LABEL_EVENTS: readonly LabelEvent[] = [
  ...ARTIST_EVENTS,
  ...PRODUCTION_EVENTS,
  ...MARKET_EVENTS,
  ...MEDIA_EVENTS,
  ...BUSINESS_EVENTS,
  ...CEREMONY_EVENTS,
];

export type { LabelEvent };
