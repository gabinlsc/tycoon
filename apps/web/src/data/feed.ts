import { GAMES } from './games';
import { PLAYERS } from './players';
import { dayKey, hashString } from '../lib/daily';
import { mulberry32 } from '../lib/prng';

/** Fil d'actualité fictif défilant sous le haut de page. À brancher sur de vrais événements plus tard. */

export interface FeedItem {
  id: string;
  text: string;
  amount: string;
}

const eurosShort = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** Dix événements stables pour la journée : tout le monde voit le même fil. */
export function dailyFeed(date: Date, count = 10): FeedItem[] {
  const rand = mulberry32(hashString(`feed-${dayKey(date)}`));
  return Array.from({ length: count }, (_, i) => {
    const player = PLAYERS[Math.floor(rand() * PLAYERS.length)] ?? 'Anonyme';
    const game = GAMES[Math.floor(rand() * GAMES.length)] ?? GAMES[0];
    const millions = Math.round((0.2 + rand() * 6) * 10) / 10;
    const kind = Math.floor(rand() * 3);
    const text =
      kind === 0
        ? `${player} vient d'encaisser sur ${game.name}`
        : kind === 1
          ? `${player} passe un cap de fortune dans ${game.name}`
          : `${player} signe le meilleur score du jour sur ${game.name}`;
    return { id: `${i}-${game.symbol}`, text, amount: `${eurosShort.format(millions)} M` };
  });
}
