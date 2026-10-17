/** Catalogue des jeux. Ajouter un jeu = ajouter une entrée dans GAMES, rien d'autre. */

export type GameStatus = 'Disponible' | 'En développement' | 'Bientôt';

export interface Crossover {
  /** Symbole boursier du jeu relié. */
  with: string;
  /** Ce que le lien change concrètement pour le joueur. */
  label: string;
}

export interface Game {
  name: string;
  /** Symbole boursier fictif (3 à 5 lettres). */
  symbol: string;
  tagline: string;
  genre: string;
  status: GameStatus;
  /** Mécanique principale, affichée au survol. */
  mechanic: string;
  /** Durée d'une partie, affichée au survol. */
  playtime: string;
  /** Cours de départ fictif, en euros. */
  price: number;
  /** Volatilité de la marche aléatoire (écart-type relatif par tick). */
  volatility: number;
  /** Graine : même courbe pour tout le monde, à chaque visite. */
  seed: number;
  /** Lien externe vers le jeu quand il existe. */
  href?: string;
  crossovers: Crossover[];
}

export const GAMES = [
  {
    name: 'Label Tycoon',
    symbol: 'LBL',
    tagline: 'Signez les voix de demain avant que le concurrent ne les entende.',
    genre: 'Industrie musicale',
    status: 'En développement',
    mechanic: 'Signer des artistes, financer leurs albums, piloter leurs carrières sur dix ans.',
    playtime: '25 à 40 min',
    price: 142.35,
    volatility: 0.012,
    seed: 1101,
    crossovers: [
      { with: 'CLUB', label: 'Le label place son DJ en résidence dans la boîte de nuit.' },
      { with: 'SNKR', label: 'Un artiste du label prête sa voix à une collection de baskets.' },
    ],
  },
  {
    name: 'Street Food Empire',
    symbol: 'FOOD',
    tagline: 'Un camion, une plaque, un quartier. Puis cent enseignes.',
    genre: 'Restauration',
    status: 'Bientôt',
    mechanic: 'Optimiser un menu, des stocks et des emplacements, puis franchiser.',
    playtime: '15 à 30 min',
    price: 38.9,
    volatility: 0.016,
    seed: 2202,
    crossovers: [{ with: 'CLUB', label: "Le food truck s'installe à la sortie du festival." }],
  },
  {
    name: 'Sneaker Brand',
    symbol: 'SNKR',
    tagline: 'Revendez des paires rares, puis lancez la vôtre.',
    genre: 'Mode et revente',
    status: 'Bientôt',
    mechanic: 'Spéculer sur la revente, puis dessiner des drops et gérer le niveau de hype.',
    playtime: '20 à 35 min',
    price: 87.2,
    volatility: 0.022,
    seed: 3303,
    crossovers: [
      { with: 'FCO', label: 'Le club de football signe la dotation maillot et crampons.' },
    ],
  },
  {
    name: 'Club Owner',
    symbol: 'CLUB',
    tagline: 'Une cave, un vigile, une file d’attente. Visez le festival.',
    genre: 'Vie nocturne',
    status: 'Bientôt',
    mechanic: 'Programmer des soirées, gérer le bar et la sécurité, puis monter un festival.',
    playtime: '20 à 30 min',
    price: 54.6,
    volatility: 0.019,
    seed: 4404,
    crossovers: [{ with: 'SYND', label: "La façade du club blanchit l'argent du syndicat." }],
  },
  {
    name: 'Football Club Owner',
    symbol: 'FCO',
    tagline: 'Le club sans le ballon : billetterie, transferts, droits télé.',
    genre: 'Sport business',
    status: 'En développement',
    mechanic:
      'Gérer la masse salariale, le stade et les transferts. Les matchs se jouent sans vous.',
    playtime: '30 à 50 min',
    price: 211.05,
    volatility: 0.01,
    seed: 5505,
    crossovers: [{ with: 'LBL', label: "L'hymne du club sort sur le label maison." }],
  },
  {
    name: 'Syndicate',
    symbol: 'SYND',
    tagline: 'Un empire qui ne figure sur aucun registre.',
    genre: 'Empire clandestin',
    status: 'Bientôt',
    mechanic: "Bâtir des façades légales, acheter la loyauté de vos hommes, éviter l'enquête.",
    playtime: '25 à 45 min',
    price: 19.75,
    volatility: 0.03,
    seed: 6606,
    crossovers: [],
  },
] as const satisfies readonly Game[];

export type GameSymbol = (typeof GAMES)[number]['symbol'];

/** Jeu mis en avant dans le gros titre : le premier de la liste par défaut. */
export const FEATURED_SYMBOL: GameSymbol = 'LBL';
