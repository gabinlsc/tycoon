/** Catalogue des jeux. Ajouter un jeu = ajouter une entrée dans GAMES. Chaque jeu est indépendant. */

export type GameStatus = 'Disponible' | 'En développement' | 'Bientôt';
export type GameColor = 'purple' | 'orange' | 'blue' | 'pink' | 'green' | 'red';
export type GameIcon = 'vinyl' | 'truck' | 'sneaker' | 'disco' | 'ball' | 'case';

/** Note de 1 à 5 affichée en barre de stat, façon fiche de personnage. */
export interface GameStats {
  profit: number;
  difficulty: number;
  depth: number;
}

export interface Game {
  /** Identifiant d'URL : /jeux/<slug>. Unique et stable, il sert aussi de clé de sauvegarde. */
  slug: string;
  name: string;
  /** Sigle court affiché sur les cartes (3 à 5 lettres). */
  symbol: string;
  tagline: string;
  /** Pitch de la page du jeu, quelques phrases. */
  pitch: string;
  genre: string;
  status: GameStatus;
  /** Mécanique principale. */
  mechanic: string;
  /** Durée d'une partie. */
  playtime: string;
  /** Couleur de la carte, du médaillon et de l'introduction. */
  color: GameColor;
  icon: GameIcon;
  stats: GameStats;
}

export const GAMES = [
  {
    slug: 'label-tycoon',
    name: 'Label Tycoon',
    symbol: 'LBL',
    color: 'purple',
    icon: 'vinyl',
    stats: { profit: 4, difficulty: 3, depth: 5 },
    tagline: 'Signez les voix de demain avant que le concurrent ne les entende.',
    pitch:
      "Tu pars d'un petit studio et d'un carnet d'adresses vide. Repère les talents, signe-les au bon moment, finance leurs albums et pilote leurs carrières sur dix ans. Un tube peut tout changer, un flop aussi.",
    genre: 'Industrie musicale',
    status: 'En développement',
    mechanic: 'Signer des artistes, financer leurs albums, piloter leurs carrières sur dix ans.',
    playtime: '25 à 40 min',
  },
  {
    slug: 'street-food-empire',
    name: 'Street Food Empire',
    symbol: 'FOOD',
    color: 'orange',
    icon: 'truck',
    stats: { profit: 3, difficulty: 2, depth: 3 },
    tagline: 'Un camion, une plaque, un quartier. Puis cent enseignes.',
    pitch:
      "Un camion d'occasion, une plaque de cuisson et un emplacement à gagner. Compose ton menu, gère tes stocks, choisis tes quartiers, puis transforme ton succès en franchise.",
    genre: 'Restauration',
    status: 'Bientôt',
    mechanic: 'Optimiser un menu, des stocks et des emplacements, puis franchiser.',
    playtime: '15 à 30 min',
  },
  {
    slug: 'sneaker-brand',
    name: 'Sneaker Brand',
    symbol: 'SNKR',
    color: 'blue',
    icon: 'sneaker',
    stats: { profit: 5, difficulty: 3, depth: 4 },
    tagline: 'Revendez des paires rares, puis lancez la vôtre.',
    pitch:
      'Tout commence par la revente : repère les paires rares, achète avant la hype, revends au bon moment. Quand la trésorerie suit, dessine ta propre marque et enchaîne les drops.',
    genre: 'Mode et revente',
    status: 'Bientôt',
    mechanic: 'Spéculer sur la revente, puis dessiner des drops et gérer le niveau de hype.',
    playtime: '20 à 35 min',
  },
  {
    slug: 'club-owner',
    name: 'Club Owner',
    symbol: 'CLUB',
    color: 'pink',
    icon: 'disco',
    stats: { profit: 4, difficulty: 2, depth: 4 },
    tagline: "Une cave, un vigile, une file d'attente. Visez le festival.",
    pitch:
      'Une cave humide, un vigile et une platine. Programme tes soirées, gère le bar et la sécurité, fais monter la réputation du lieu, puis vise grand : ton propre festival.',
    genre: 'Vie nocturne',
    status: 'Bientôt',
    mechanic: 'Programmer des soirées, gérer le bar et la sécurité, puis monter un festival.',
    playtime: '20 à 30 min',
  },
  {
    slug: 'football-club-owner',
    name: 'Football Club Owner',
    symbol: 'FCO',
    color: 'green',
    icon: 'ball',
    stats: { profit: 4, difficulty: 4, depth: 5 },
    tagline: 'Le club sans le ballon : billetterie, transferts, droits télé.',
    pitch:
      "Tu diriges le club, pas l'équipe. Masse salariale, stade, billetterie, transferts, sponsors et droits télé : les matchs se jouent sans toi, mais tes décisions les gagnent ou les perdent.",
    genre: 'Sport business',
    status: 'En développement',
    mechanic:
      'Gérer la masse salariale, le stade et les transferts. Les matchs se jouent sans vous.',
    playtime: '30 à 50 min',
  },
  {
    slug: 'syndicate',
    name: 'Syndicate',
    symbol: 'SYND',
    color: 'red',
    icon: 'case',
    stats: { profit: 5, difficulty: 5, depth: 4 },
    tagline: 'Un empire qui ne figure sur aucun registre.',
    pitch:
      "Bâtis des façades légales, achète la loyauté de tes hommes et garde une longueur d'avance sur l'enquête. Chaque affaire rapporte gros, chaque erreur coûte plus cher encore.",
    genre: 'Empire clandestin',
    status: 'Bientôt',
    mechanic: "Bâtir des façades légales, acheter la loyauté de vos hommes, éviter l'enquête.",
    playtime: '25 à 45 min',
  },
] as const satisfies readonly Game[];

export type GameSlug = (typeof GAMES)[number]['slug'];

/** Jeu mis en avant sur la page d'accueil. */
export const FEATURED_SLUG: GameSlug = 'label-tycoon';

export function findGame(slug: string | undefined): Game | undefined {
  return GAMES.find((g) => g.slug === slug);
}
