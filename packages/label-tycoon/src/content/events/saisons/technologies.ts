import type { EvenementSpec } from './moteur';

/** Révolution technologique : de nouveaux outils, entièrement fictifs, bousculent la création et l'écoute. */
export const TECHNOLOGIES: readonly EvenementSpec[] = [
  {
    id: 'techno-mastering-assiste',
    saison: 'technologies',
    titre: 'Mastero, le mastering assisté',
    texte: 'Le logiciel Mastero promet un son de studio en trois clics. Le label peut s’abonner.',
    choix: [
      {
        id: 'adopter',
        texte: 'S’abonner',
        exige: 1500,
        effets: [
          { t: 'cash', euros: -1500 },
          { t: 'tousHype', v: 4 },
        ],
      },
      { id: 'refuser', texte: 'Rester fidèle aux ingénieurs', effets: [{ t: 'reputation', v: 1 }] },
    ],
    defaut: 'refuser',
  },
  {
    id: 'techno-casque-sensoriel',
    saison: 'technologies',
    titre: 'Le casque sensoriel',
    texte:
      'Un casque fait vibrer la musique dans tout le corps. {nom} est invité·e à le promouvoir.',
    choix: [
      {
        id: 'promouvoir',
        texte: 'Faire la promo',
        effets: [
          { t: 'cash', euros: 4000 },
          { t: 'fans', pct: 2 },
        ],
      },
      { id: 'refuser', texte: 'Refuser', effets: [{ t: 'moral', v: 2 }] },
    ],
    defaut: 'refuser',
  },
  {
    id: 'techno-voix-synthetique',
    saison: 'technologies',
    titre: 'Des voix de synthèse',
    texte: 'Un studio propose de cloner la voix de {nom} pour des jingles et des jeux vidéo.',
    choix: [
      {
        id: 'accepter',
        texte: 'Signer la licence',
        effets: [
          { t: 'cash', euros: 6000 },
          { t: 'affinite', v: -5 },
          { t: 'reputation', v: -1 },
        ],
      },
      {
        id: 'refuser',
        texte: 'Protéger sa voix',
        effets: [
          { t: 'affinite', v: 5 },
          { t: 'loyaute', v: 4 },
        ],
      },
    ],
    defaut: 'refuser',
  },
  {
    id: 'techno-concert-immersif',
    saison: 'technologies',
    titre: 'Concerts en réalité immersive',
    texte:
      'Une salle virtuelle diffuse les concerts à des milliers de spectateurs. {nom} s’y essaie.',
    effets: [
      { t: 'fans', pct: 4 },
      { t: 'cash', euros: 3000 },
    ],
  },
  {
    id: 'techno-recommandation-algorithmique',
    saison: 'technologies',
    titre: 'Nouvel algorithme de recommandation',
    texte:
      'Une plateforme change d’algorithme du jour au lendemain : certains catalogues s’envolent, d’autres s’effondrent.',
    effets: [
      { t: 'tousHype', v: -3 },
      { t: 'streaming', pct: 1 },
    ],
  },
  {
    id: 'techno-ia-compositrice',
    saison: 'technologies',
    titre: 'L’IA qui compose',
    texte:
      'Une IA fictive, Melodia, inonde les plateformes de morceaux génériques dans le {genreNom}.',
    cible: 'genre',
    effets: [{ t: 'genre', v: -4 }],
  },
  {
    id: 'techno-plagiat-genere',
    saison: 'technologies',
    titre: 'Plagiat généré par machine',
    texte: 'Un titre généré par ordinateur copie à s’y méprendre une chanson de {nom}.',
    choix: [
      {
        id: 'proces',
        texte: 'Attaquer en justice',
        exige: 4000,
        effets: [
          { t: 'cash', euros: -4000 },
          { t: 'reputation', v: 3 },
          { t: 'affinite', v: 5 },
        ],
      },
      { id: 'ignorer', texte: 'Ignorer', effets: [{ t: 'moral', v: -5 }] },
    ],
    defaut: 'ignorer',
  },
  {
    id: 'techno-streaming-spatial',
    saison: 'technologies',
    titre: 'Son spatial',
    texte: 'Une plateforme met en avant les titres mixés en son spatial.',
    choix: [
      {
        id: 'remixer',
        texte: 'Remixer le catalogue',
        exige: 3500,
        effets: [
          { t: 'cash', euros: -3500 },
          { t: 'streaming', pct: 2 },
        ],
      },
      { id: 'attendre', texte: 'Attendre de voir', effets: [] },
    ],
    defaut: 'attendre',
  },
  {
    id: 'techno-micropaiements',
    saison: 'technologies',
    titre: 'Pourboires numériques',
    texte: 'Les fans peuvent désormais envoyer des pourboires directs à {nom}.',
    effets: [
      { t: 'cash', euros: 2500 },
      { t: 'moral', v: 5 },
    ],
  },
  {
    id: 'techno-hologramme',
    saison: 'technologies',
    titre: 'L’hologramme d’une légende',
    texte: 'Une production veut faire remonter sur scène l’hologramme d’une légende du {genreNom}.',
    cible: 'genre',
    effets: [{ t: 'genre', v: 5 }],
  },
  {
    id: 'techno-fuite-de-donnees',
    saison: 'technologies',
    titre: 'Fuite de données',
    texte: 'Une plateforme laisse fuiter les contrats d’artistes : le label est exposé.',
    effets: [
      { t: 'reputation', v: -2 },
      { t: 'cash', euros: -2000 },
    ],
  },
  {
    id: 'techno-boucle-de-hype',
    saison: 'technologies',
    titre: 'Un défi dansé s’emballe',
    texte: 'Un défi dansé sur un titre de {nom} s’emballe sur les réseaux.',
    effets: [
      { t: 'fans', pct: 6 },
      { t: 'hype', v: 14 },
    ],
  },
  {
    id: 'techno-credits-automatiques',
    saison: 'technologies',
    titre: 'Crédits automatiques',
    texte:
      'Un registre numérique crédite automatiquement chaque contributeur : moins d’erreurs de royalties.',
    effets: [
      { t: 'cash', euros: 1800 },
      { t: 'reputation', v: 1 },
    ],
  },
  {
    id: 'techno-stems-ouverts',
    saison: 'technologies',
    titre: 'Pistes séparées pour tous',
    texte: 'Les plateformes ouvrent les pistes séparées des titres aux remixeurs amateurs.',
    choix: [
      {
        id: 'ouvrir',
        texte: 'Ouvrir ses titres aux remixeurs',
        effets: [
          { t: 'fans', pct: 3 },
          { t: 'hype', v: 6 },
        ],
      },
      { id: 'fermer', texte: 'Garder les pistes fermées', effets: [{ t: 'moral', v: 2 }] },
    ],
    defaut: 'fermer',
  },
  {
    id: 'techno-radio-personnalisee',
    saison: 'technologies',
    titre: 'Radios personnalisées',
    texte: 'Une radio sur mesure remplace la radio de papa : la découverte change de visage.',
    effets: [
      { t: 'streaming', pct: 1 },
      { t: 'tousHype', v: -2 },
    ],
  },
  {
    id: 'techno-nft-musical',
    saison: 'technologies',
    titre: 'Titres numérotés',
    texte: 'Une place de marché vend des éditions numérotées de titres. {nom} est tenté·e.',
    choix: [
      {
        id: 'vendre',
        texte: 'Vendre une édition',
        effets: [
          { t: 'cash', euros: 5000 },
          { t: 'reputation', v: -1 },
        ],
      },
      { id: 'refuser', texte: 'Passer', effets: [] },
    ],
    defaut: 'refuser',
  },
  {
    id: 'techno-traducteur-de-paroles',
    saison: 'technologies',
    titre: 'Paroles traduites en direct',
    texte: 'Un outil traduit les paroles en temps réel : {nom} touche un public étranger.',
    effets: [{ t: 'fans', pct: 4 }],
  },
  {
    id: 'techno-studio-a-distance',
    saison: 'technologies',
    titre: 'Studio à distance',
    texte: 'Les sessions d’enregistrement se font désormais à distance, en latence quasi nulle.',
    effets: [
      { t: 'cash', euros: 2000 },
      { t: 'fatigue', v: -8 },
    ],
  },
  {
    id: 'techno-panne-geante',
    saison: 'technologies',
    titre: 'Panne géante',
    texte: 'Une panne mondiale prive les plateformes de service pendant un jour entier.',
    effets: [{ t: 'cash', euros: -1800 }],
  },
  {
    id: 'techno-label-algorithmique',
    saison: 'technologies',
    titre: 'Un label géré par algorithme',
    texte: 'Un nouvel acteur signe à la chaîne des artistes choisis par algorithme.',
    effets: [
      { t: 'reputation', v: -1 },
      { t: 'tousHype', v: 2 },
    ],
  },
];
