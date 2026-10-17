import { type Explained, explain } from '@tycoon/core';
import { GENRES, type BaseGenreId } from '../content/genres';
import type { Artist } from '../artists';

/**
 * Talent artistique d'un artiste dans un genre (0-100) : moyenne pondérée de la plume et du talent
 * vocal, selon le genre (voir GDD, 5.5). C'est le premier terme de la qualité d'un titre.
 *
 * - genre « flow » : plume et flow ;
 * - genre « voix » : plume et voix ;
 * - genre « mixte » : plume et moyenne du flow et de la voix.
 *
 * Renvoie le détail des termes (`explain`), pas seulement le nombre.
 */
export function artisticTalent(artist: Artist, genre: string): Explained {
  const def = GENRES[genre as BaseGenreId];
  // Genre inconnu (sous-genre fictif) : on retombe sur un genre mixte, à parts égales
  const wPlume = def?.poidsPlume ?? 0.35;
  const vocal = def?.vocal ?? 'mixte';
  const wVocal = 1 - wPlume;
  const e = explain().term('plume', artist.plume, wPlume);
  if (vocal === 'flow') e.term('flow', artist.flow, wVocal);
  else if (vocal === 'voix') e.term('voix', artist.voix, wVocal);
  else e.term('flow', artist.flow, wVocal / 2).term('voix', artist.voix, wVocal / 2);
  return e.limit('bornes', 0, 100).done();
}
