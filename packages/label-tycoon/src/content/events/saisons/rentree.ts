import type { EvenementSpec } from './moteur';

/** Rentrée musicale : sorties en rafale, salons professionnels, nouvelles signatures. */
export const RENTREE: readonly EvenementSpec[] = [
  {
    id: 'rentree-salon-professionnel',
    saison: 'rentree',
    titre: 'Le salon de la rentrée',
    texte:
      'Le grand salon professionnel de la rentrée ouvre ses portes. Le label peut y louer un stand.',
    choix: [
      {
        id: 'stand',
        texte: 'Louer un stand',
        exige: 3000,
        effets: [
          { t: 'cash', euros: -3000 },
          { t: 'reputation', v: 3 },
          { t: 'tousHype', v: 4 },
        ],
      },
      { id: 'visiter', texte: 'Simplement visiter', effets: [{ t: 'reputation', v: 1 }] },
    ],
    defaut: 'visiter',
  },
  {
    id: 'rentree-embouteillage-de-sorties',
    saison: 'rentree',
    titre: 'Embouteillage de sorties',
    texte: 'Tous les labels sortent leurs projets en même temps : difficile d’exister pour {nom}.',
    effets: [
      { t: 'hype', v: -6 },
      { t: 'moral', v: -3 },
    ],
  },
  {
    id: 'rentree-playlist-phare',
    saison: 'rentree',
    titre: 'Playlist de la rentrée',
    texte: 'Un titre de {nom} s’invite dans la playlist phare de la rentrée.',
    effets: [
      { t: 'fans', pct: 5 },
      { t: 'cash', euros: 2500 },
    ],
  },
  {
    id: 'rentree-nouvelle-vague',
    saison: 'rentree',
    titre: 'La nouvelle vague du {genreNom}',
    texte: 'Une génération de jeunes talents relance le {genreNom} cet automne.',
    cible: 'genre',
    effets: [{ t: 'genre', v: 5 }],
  },
  {
    id: 'rentree-contrat-concurrent',
    saison: 'rentree',
    titre: 'Un rival lorgne {nom}',
    texte: 'Un label rival fait les yeux doux à {nom} à la rentrée.',
    choix: [
      {
        id: 'retenir',
        texte: 'Faire un geste',
        exige: 4000,
        effets: [
          { t: 'cash', euros: -4000 },
          { t: 'loyaute', v: 12 },
        ],
      },
      { id: 'laisser', texte: 'Ne rien faire', effets: [{ t: 'loyaute', v: -8 }] },
    ],
    defaut: 'laisser',
  },
  {
    id: 'rentree-emission-matinale',
    saison: 'rentree',
    titre: 'Matinale radio',
    texte: 'Une matinale radio invite {nom} pour la sortie de son prochain projet.',
    effets: [
      { t: 'fans', pct: 3 },
      { t: 'hype', v: 6 },
    ],
  },
  {
    id: 'rentree-greve-des-transports',
    saison: 'rentree',
    titre: 'Grève des transports',
    texte:
      'Une grève paralyse les transports : le concert de {nom} se joue devant une salle clairsemée.',
    effets: [
      { t: 'cash', euros: -1500 },
      { t: 'moral', v: -3 },
    ],
  },
  {
    id: 'rentree-masterclass',
    saison: 'rentree',
    titre: 'Masterclass d’artiste',
    texte: 'Une école de musique invite {nom} à donner une masterclass.',
    choix: [
      {
        id: 'accepter',
        texte: 'Y aller',
        effets: [
          { t: 'moral', v: 6 },
          { t: 'reputation', v: 1 },
          { t: 'fatigue', v: 4 },
        ],
      },
      { id: 'refuser', texte: 'Décliner', effets: [] },
    ],
    defaut: 'refuser',
  },
  {
    id: 'rentree-festival-de-la-rentree',
    saison: 'rentree',
    titre: 'Petit festival de rentrée',
    texte: 'Un festival de fin de saison propose un cachet modeste à {nom}.',
    effets: [
      { t: 'cash', euros: 3000 },
      { t: 'fatigue', v: 6 },
    ],
  },
  {
    id: 'rentree-rumeur-de-rachat',
    saison: 'rentree',
    titre: 'Rumeur de rachat',
    texte: 'Une rumeur annonce le rachat du label : les artistes s’inquiètent.',
    choix: [
      {
        id: 'dementir',
        texte: 'Démentir publiquement',
        effets: [
          { t: 'reputation', v: 1 },
          { t: 'tousHype', v: -2 },
        ],
      },
      {
        id: 'laisser',
        texte: 'Laisser dire',
        effets: [
          { t: 'reputation', v: -2 },
          { t: 'tousHype', v: 3 },
        ],
      },
    ],
    defaut: 'dementir',
  },
  {
    id: 'rentree-nouveaux-talents',
    saison: 'rentree',
    titre: 'Nouveaux talents en vue',
    texte: 'Les écoles de musique déversent leurs diplômés : les maquettes affluent au label.',
    effets: [
      { t: 'reputation', v: 1 },
      { t: 'cash', euros: -800 },
    ],
  },
  {
    id: 'rentree-cure-de-silence',
    saison: 'rentree',
    titre: 'Retour de vacances',
    texte: '{nom} revient de vacances ressourcé·e et plein·e d’idées.',
    effets: [
      { t: 'moral', v: 10 },
      { t: 'fatigue', v: -15 },
    ],
  },
  {
    id: 'rentree-article-flatteur',
    saison: 'rentree',
    titre: 'Portrait flatteur',
    texte: 'Un grand magazine consacre quatre pages à {nom}.',
    effets: [
      { t: 'hype', v: 9 },
      { t: 'fans', pct: 2 },
    ],
  },
  {
    id: 'rentree-tendance-passagere',
    saison: 'rentree',
    titre: 'Le {genreNom} passe de mode',
    texte: 'Après un été triomphal, le {genreNom} marque le pas à la rentrée.',
    cible: 'genre',
    effets: [{ t: 'genre', v: -4 }],
  },
  {
    id: 'rentree-bourse-aux-talents',
    saison: 'rentree',
    titre: 'Bourse aux talents',
    texte: 'Un dispositif public finance de jeunes artistes : le label peut candidater.',
    choix: [
      {
        id: 'candidater',
        texte: 'Candidater',
        effets: [
          { t: 'cash', euros: 5000 },
          { t: 'reputation', v: 1 },
        ],
      },
      { id: 'passer', texte: 'Ne pas s’en mêler', effets: [] },
    ],
    defaut: 'candidater',
  },
];
