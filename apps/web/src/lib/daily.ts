import { GAMES, type Game } from '../data/games';
import { mulberry32 } from './prng';

/**
 * Le défi change à minuit, heure de Paris, pour tout le monde en même temps.
 * Tout (jeu, capital, contrainte, podium de la veille) est dérivé de la date : aucun serveur requis.
 */
const TIME_ZONE = 'Europe/Paris';

interface ParisClock {
  year: string;
  month: string;
  day: string;
  seconds: number;
}

function parisClock(date: Date): ParisClock {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '0';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    seconds: Number(get('hour')) * 3600 + Number(get('minute')) * 60 + Number(get('second')),
  };
}

/** Clé de jour « 2026-10-17 » à Paris. */
export function dayKey(date: Date): string {
  const { year, month, day } = parisClock(date);
  return `${year}-${month}-${day}`;
}

export function previousDayKey(date: Date): string {
  return dayKey(new Date(date.getTime() - 24 * 3600 * 1000));
}

/** Secondes avant le prochain défi. Les 2 jours de changement d'heure de l'année sont approximés. */
export function secondsUntilNextChallenge(date: Date): number {
  return 86_400 - parisClock(date).seconds;
}

/** Hachage FNV-1a 32 bits : transforme une clé de jour en graine. */
export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

const CONSTRAINTS = [
  'Aucun emprunt autorisé',
  'Une seule embauche par semaine de jeu',
  'Pas de publicité',
  'Dépenses plafonnées à 60 % du capital',
  'Zéro stock invendu en fin de partie',
  'Un seul fournisseur toute la partie',
] as const;

export interface DailyChallenge {
  key: string;
  /** Numéro de grille affiché, en hexadécimal court. */
  grid: string;
  game: Game;
  capital: number;
  target: number;
  minutes: number;
  constraint: string;
}

export function dailyChallenge(key: string): DailyChallenge {
  const seed = hashString(key);
  const rand = mulberry32(seed);
  const game = GAMES[Math.floor(rand() * GAMES.length)] ?? GAMES[0];
  const capital = (5 + Math.floor(rand() * 20)) * 1000;
  const target = capital * (3 + Math.floor(rand() * 6));
  return {
    key,
    grid: seed.toString(16).toUpperCase().padStart(8, '0').slice(0, 6),
    game,
    capital,
    target,
    minutes: [10, 15, 20][Math.floor(rand() * 3)] ?? 15,
    constraint: CONSTRAINTS[Math.floor(rand() * CONSTRAINTS.length)] ?? CONSTRAINTS[0],
  };
}

const PLAYERS = [
  'Marguerite V.',
  'Baron Noir',
  'Léon des Halles',
  'Tonton Bilan',
  'Mlle Caisse',
  'Jules & Fils',
  'Rita la Rouge',
  'Opaline',
  'Le Comptable',
  'Capitaine Marge',
] as const;

export interface PodiumEntry {
  rank: 1 | 2 | 3;
  name: string;
  score: number;
}

/** Podium fictif d'une journée : reproductible, et décroissant. */
export function dailyPodium(key: string): PodiumEntry[] {
  const rand = mulberry32(hashString(`podium-${key}`));
  const names = [...PLAYERS];
  const pick = (): string => names.splice(Math.floor(rand() * names.length), 1)[0] ?? 'Anonyme';
  const first = 400_000 + Math.floor(rand() * 600_000);
  const second = Math.floor(first * (0.88 + rand() * 0.08));
  const third = Math.floor(second * (0.88 + rand() * 0.08));
  return [
    { rank: 1, name: pick(), score: first },
    { rank: 2, name: pick(), score: second },
    { rank: 3, name: pick(), score: third },
  ];
}
