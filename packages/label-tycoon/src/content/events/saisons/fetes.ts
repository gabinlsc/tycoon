import type { EvenementSpec } from './moteur';

/** Fêtes de fin d’année : coffrets, compilations, voeux et ventes de cadeaux. */
export const FETES: readonly EvenementSpec[] = [
  {
    id: 'fetes-coffret-collector',
    saison: 'fetes',
    titre: 'Coffret collector',
    texte: 'Un distributeur propose un coffret collector de {nom} pour Noël.',
    choix: [
      {
        id: 'sortir',
        texte: 'Sortir le coffret',
        exige: 3000,
        effets: [
          { t: 'cash', euros: 7000 },
          { t: 'fans', pct: 2 },
        ],
      },
      { id: 'refuser', texte: 'Garder le catalogue intact', effets: [{ t: 'moral', v: 2 }] },
    ],
    defaut: 'refuser',
  },
  {
    id: 'fetes-compilation-annuelle',
    saison: 'fetes',
    titre: 'Compilation de fin d’année',
    texte: 'Une radio réunit les titres de l’année : le label peut y placer {nom}.',
    effets: [
      { t: 'cash', euros: 3500 },
      { t: 'hype', v: 5 },
    ],
  },
  {
    id: 'fetes-carte-de-voeux',
    saison: 'fetes',
    titre: 'Les voeux viraux',
    texte: 'La vidéo de voeux de {nom} amuse tout le monde et cumule les partages.',
    effets: [
      { t: 'fans', pct: 3 },
      { t: 'moral', v: 4 },
    ],
  },
  {
    id: 'fetes-pub-de-noel',
    saison: 'fetes',
    titre: 'Publicité de Noël',
    texte: 'Une grande enseigne veut utiliser un titre de {nom} pour sa publicité de Noël.',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter le chèque',
        effets: [
          { t: 'cash', euros: 11000 },
          { t: 'reputation', v: -1 },
        ],
      },
      {
        id: 'refuser',
        texte: 'Refuser par principe',
        effets: [
          { t: 'affinite', v: 4 },
          { t: 'reputation', v: 1 },
        ],
      },
    ],
    defaut: 'refuser',
  },
  {
    id: 'fetes-concert-solidaire',
    saison: 'fetes',
    titre: 'Concert solidaire',
    texte: 'Une association invite {nom} à un concert de charité le soir du 24.',
    choix: [
      {
        id: 'jouer',
        texte: 'Jouer gratuitement',
        effets: [
          { t: 'reputation', v: 3 },
          { t: 'moral', v: 6 },
          { t: 'fatigue', v: 8 },
        ],
      },
      { id: 'decliner', texte: 'Décliner', effets: [{ t: 'affinite', v: -2 }] },
    ],
    defaut: 'decliner',
  },
  {
    id: 'fetes-ventes-de-cadeaux',
    saison: 'fetes',
    titre: 'Pluie de cadeaux',
    texte: 'Les ventes de cartes-cadeaux de streaming explosent : tout le catalogue en profite.',
    effets: [
      { t: 'streaming', pct: 2 },
      { t: 'cash', euros: 2500 },
    ],
  },
  {
    id: 'fetes-vinyles-en-rupture',
    saison: 'fetes',
    titre: 'Vinyles en rupture',
    texte: 'Le vinyle de {nom} est épuisé partout à une semaine de Noël.',
    effets: [
      { t: 'cash', euros: 5000 },
      { t: 'hype', v: 6 },
    ],
  },
  {
    id: 'fetes-reveillon-mouvemente',
    saison: 'fetes',
    titre: 'Réveillon mouvementé',
    texte: '{nom} fait la fête un peu trop fort : la presse people s’en empare.',
    effets: [
      { t: 'hype', v: 8 },
      { t: 'reputation', v: -2 },
      { t: 'fatigue', v: 10 },
    ],
  },
  {
    id: 'fetes-tele-du-31',
    saison: 'fetes',
    titre: 'La télé du 31',
    texte: 'La grande soirée télévisée de la Saint-Sylvestre invite {nom}.',
    choix: [
      {
        id: 'participer',
        texte: 'Participer',
        effets: [
          { t: 'fans', pct: 6 },
          { t: 'hype', v: 10 },
          { t: 'fatigue', v: 10 },
        ],
      },
      { id: 'refuser', texte: 'Refuser, trop commercial', effets: [{ t: 'moral', v: 2 }] },
    ],
    defaut: 'participer',
  },
  {
    id: 'fetes-prime-de-fin-d-annee',
    saison: 'fetes',
    titre: 'Prime de fin d’année',
    texte: 'L’équipe espère une prime de fin d’année pour les artistes du label.',
    choix: [
      {
        id: 'verser',
        texte: 'Verser une prime',
        exige: 3000,
        effets: [
          { t: 'cash', euros: -3000 },
          { t: 'tousHype', v: 4 },
          { t: 'reputation', v: 1 },
        ],
      },
      { id: 'sans', texte: 'Pas cette année', effets: [{ t: 'reputation', v: -1 }] },
    ],
    defaut: 'sans',
  },
  {
    id: 'fetes-chanson-de-noel',
    saison: 'fetes',
    titre: 'Un classique de Noël',
    texte: '{nom} sort une chanson de Noël qui revient chaque année : les écoutes grimpent.',
    effets: [
      { t: 'cash', euros: 4000 },
      { t: 'fans', pct: 2 },
    ],
  },
  {
    id: 'fetes-grippe-hivernale',
    saison: 'fetes',
    titre: 'Grippe hivernale',
    texte: '{nom} tombe malade en pleine promo de fin d’année.',
    effets: [
      { t: 'fatigue', v: 20 },
      { t: 'moral', v: -3 },
    ],
  },
  {
    id: 'fetes-retour-nostalgique',
    saison: 'fetes',
    titre: 'Le {genreNom} version nostalgie',
    texte: 'Les rediffusions de fin d’année remettent le {genreNom} au goût du jour.',
    cible: 'genre',
    effets: [{ t: 'genre', v: 4 }],
  },
  {
    id: 'fetes-bilan-de-l-annee',
    saison: 'fetes',
    titre: 'Bilan de l’année',
    texte:
      'La presse spécialisée publie son bilan : le label y est cité, pour le meilleur et pour le pire.',
    effets: [
      { t: 'reputation', v: 1 },
      { t: 'tousHype', v: 3 },
    ],
  },
];
