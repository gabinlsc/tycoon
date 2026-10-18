import type { EvenementSpec } from './moteur';

/** Saison des festivals : scènes en plein air, cachets, foules et imprévus. */
export const FESTIVALS: readonly EvenementSpec[] = [
  {
    id: 'festival-tete-d-affiche',
    saison: 'festivals',
    titre: 'En tête d’affiche',
    texte: 'Un grand festival propose à {nom} la tête d’affiche du samedi soir.',
    choix: [
      {
        id: 'accepter',
        texte: 'Foncer',
        effets: [
          { t: 'cash', euros: 6000 },
          { t: 'hype', v: 12 },
          { t: 'fatigue', v: 15 },
        ],
      },
      { id: 'decliner', texte: 'Décliner poliment', effets: [{ t: 'moral', v: -4 }] },
    ],
    defaut: 'decliner',
  },
  {
    id: 'festival-pluie-battante',
    saison: 'festivals',
    titre: 'Le concert sous la pluie',
    texte: 'Une averse s’abat sur le festival, mais {nom} reste sur scène et le public aussi.',
    effets: [
      { t: 'fans', pct: 4 },
      { t: 'hype', v: 6 },
      { t: 'fatigue', v: 8 },
    ],
  },
  {
    id: 'festival-annulation',
    saison: 'festivals',
    titre: 'Festival annulé',
    texte:
      'Un festival où {nom} devait jouer est annulé au dernier moment : les frais sont perdus.',
    effets: [
      { t: 'cash', euros: -3000 },
      { t: 'moral', v: -5 },
    ],
  },
  {
    id: 'festival-bagarre-backstage',
    saison: 'festivals',
    titre: 'Esclandre en coulisses',
    texte: '{nom} s’accroche avec un autre artiste de l’affiche : des vidéos circulent.',
    choix: [
      {
        id: 'excuses',
        texte: 'Présenter des excuses publiques',
        effets: [
          { t: 'reputation', v: -1 },
          { t: 'affinite', v: 4 },
        ],
      },
      {
        id: 'assumer',
        texte: 'Assumer et laisser faire le buzz',
        effets: [
          { t: 'hype', v: 10 },
          { t: 'reputation', v: -3 },
        ],
      },
    ],
    defaut: 'excuses',
  },
  {
    id: 'festival-decouverte',
    saison: 'festivals',
    titre: 'La scène découverte',
    texte: 'Sur la petite scène d’un festival, {nom} enchaîne un set remarqué par toute la presse.',
    effets: [
      { t: 'fans', pct: 6 },
      { t: 'hype', v: 10 },
    ],
  },
  {
    id: 'festival-coup-de-chaleur',
    saison: 'festivals',
    titre: 'Coup de chaleur',
    texte: '{nom} s’effondre en coulisses sous la canicule : il faudra du repos.',
    effets: [
      { t: 'fatigue', v: 25 },
      { t: 'moral', v: -4 },
    ],
  },
  {
    id: 'festival-sponsor',
    saison: 'festivals',
    titre: 'Un sponsor s’invite',
    texte: 'Une marque de boissons propose de financer la tournée d’été du label.',
    choix: [
      {
        id: 'signer',
        texte: 'Signer le partenariat',
        effets: [
          { t: 'cash', euros: 9000 },
          { t: 'reputation', v: -1 },
        ],
      },
      { id: 'refuser', texte: 'Garder son indépendance', effets: [{ t: 'reputation', v: 2 }] },
    ],
    defaut: 'refuser',
  },
  {
    id: 'festival-fan-zone',
    saison: 'festivals',
    titre: 'Les fans campent',
    texte: 'Des centaines de fans de {nom} campent devant le festival pour un autographe.',
    effets: [
      { t: 'fans', pct: 3 },
      { t: 'moral', v: 6 },
    ],
  },
  {
    id: 'festival-merch-record',
    saison: 'festivals',
    titre: 'Le stand ne désemplit pas',
    texte: 'Le stand de merchandising de {nom} bat tous les records du week-end.',
    effets: [
      { t: 'cash', euros: 4500 },
      { t: 'moral', v: 3 },
    ],
  },
  {
    id: 'festival-pannes-son',
    saison: 'festivals',
    titre: 'Sonorisation défaillante',
    texte: 'La sono lâche en plein concert de {nom}. Le public n’a presque rien entendu.',
    choix: [
      {
        id: 'reclamer',
        texte: 'Réclamer un dédommagement',
        effets: [
          { t: 'cash', euros: 2000 },
          { t: 'affinite', v: -2 },
        ],
      },
      { id: 'laisser', texte: 'Passer à autre chose', effets: [{ t: 'moral', v: -3 }] },
    ],
    defaut: 'laisser',
  },
  {
    id: 'festival-featuring-impromptu',
    saison: 'festivals',
    titre: 'Duo improvisé',
    texte: '{nom} monte sur scène avec une légende de passage : la vidéo est partout.',
    effets: [
      { t: 'fans', pct: 5 },
      { t: 'hype', v: 12 },
    ],
  },
  {
    id: 'festival-tournee-d-ete',
    saison: 'festivals',
    titre: 'Tournée d’été',
    texte: 'Un tourneur propose à {nom} douze dates en trois semaines.',
    choix: [
      {
        id: 'partir',
        texte: 'Partir sur la route',
        effets: [
          { t: 'cash', euros: 8000 },
          { t: 'fans', pct: 4 },
          { t: 'fatigue', v: 30 },
        ],
      },
      { id: 'rester', texte: 'Rester au studio', effets: [{ t: 'moral', v: 2 }] },
    ],
    defaut: 'rester',
  },
  {
    id: 'festival-genre-a-l-honneur',
    saison: 'festivals',
    titre: 'Le {genreNom} à l’honneur',
    texte: 'Les programmateurs de l’été misent tout sur le {genreNom} : le genre s’envole.',
    cible: 'genre',
    effets: [{ t: 'genre', v: 5 }],
  },
  {
    id: 'festival-genre-boude',
    saison: 'festivals',
    titre: 'Le {genreNom} boudé',
    texte: 'Les têtes d’affiche de l’été délaissent le {genreNom} : le public suit.',
    cible: 'genre',
    effets: [{ t: 'genre', v: -4 }],
  },
  {
    id: 'festival-label-invite',
    saison: 'festivals',
    titre: 'Soirée du label',
    texte: 'Le label peut organiser sa propre soirée en marge d’un grand festival.',
    choix: [
      {
        id: 'organiser',
        texte: 'Organiser la soirée',
        exige: 4000,
        effets: [
          { t: 'cash', euros: -4000 },
          { t: 'reputation', v: 3 },
          { t: 'tousHype', v: 5 },
        ],
      },
      { id: 'passer', texte: 'Passer son tour', effets: [] },
    ],
    defaut: 'passer',
  },
  {
    id: 'festival-micro-coupe',
    saison: 'festivals',
    titre: 'Micro coupé',
    texte:
      'Les organisateurs coupent le micro de {nom} qui dépassait son créneau. Le public proteste.',
    effets: [
      { t: 'hype', v: 8 },
      { t: 'affinite', v: -3 },
    ],
  },
  {
    id: 'festival-foule-record',
    saison: 'festivals',
    titre: 'Une foule record',
    texte:
      'Jamais autant de monde devant la scène de {nom} : un souvenir pour toute la profession.',
    effets: [
      { t: 'fans', pct: 7 },
      { t: 'moral', v: 8 },
      { t: 'hype', v: 10 },
    ],
  },
];
