import { GAMES } from './games';
import { PLAYERS } from './players';
import { dayKey, hashString } from '../lib/daily';
import { mulberry32 } from '../lib/prng';

/** Classement fictif de la semaine. À brancher sur un vrai service quand il existera. */

export interface Fortune {
  rank: number;
  player: string;
  symbol: string;
  /** Fortune en euros fictifs. */
  amount: number;
  /** Variation sur la semaine, en %. */
  weekly: number;
}

const DAY_MS = 86_400_000;

/** Clé de semaine stable : le même classement toute la semaine, quel que soit le visiteur. */
export function weekKey(date: Date): string {
  const days = Math.floor(Date.parse(`${dayKey(date)}T00:00:00Z`) / DAY_MS);
  // Le 1er janvier 1970 était un jeudi : on décale de 4 jours pour que la semaine démarre un lundi.
  return `semaine-${Math.floor((days + 3) / 7)}`;
}

export function weeklyFortunes(key: string, count = 10): Fortune[] {
  const rand = mulberry32(hashString(key));
  const names = [...PLAYERS];
  let amount = 2_000_000 + Math.floor(rand() * 3_000_000);
  return Array.from({ length: count }, (_, index) => {
    const player = names.splice(Math.floor(rand() * names.length), 1)[0] ?? `Joueur ${index + 1}`;
    const game = GAMES[Math.floor(rand() * GAMES.length)] ?? GAMES[0];
    const entry: Fortune = {
      rank: index + 1,
      player,
      symbol: game.symbol,
      amount,
      weekly: Math.round((rand() * 28 - 9) * 100) / 100,
    };
    amount = Math.floor(amount * (0.72 + rand() * 0.2));
    return entry;
  });
}
