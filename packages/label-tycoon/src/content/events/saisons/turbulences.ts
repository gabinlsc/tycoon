import type { EvenementSpec } from './moteur';

/** Turbulences économiques : l'année qui suit un changement d'ère, budgets serrés, rachats et faillites. */
export const TURBULENCES: readonly EvenementSpec[] = [
  {
    id: 'turbulences-gel-des-budgets',
    saison: 'turbulences',
    titre: 'Gel des budgets marketing',
    texte:
      'Les annonceurs gèlent leurs budgets : les revenus publicitaires des plateformes reculent.',
    effets: [{ t: 'streaming', pct: -3 }],
  },
  {
    id: 'turbulences-banque-frileuse',
    saison: 'turbulences',
    titre: 'Banque frileuse',
    texte: 'Votre banque durcit ses conditions de crédit et réclame des garanties supplémentaires.',
    choix: [
      {
        id: 'garanties',
        texte: 'Fournir des garanties',
        effets: [
          { t: 'cash', euros: -2500 },
          { t: 'reputation', v: 1 },
        ],
      },
      { id: 'discuter', texte: 'Négocier durement', effets: [{ t: 'reputation', v: -1 }] },
    ],
    defaut: 'garanties',
  },
  {
    id: 'turbulences-faillite-d-un-distributeur',
    saison: 'turbulences',
    titre: 'Un distributeur dépose le bilan',
    texte: 'Un distributeur historique fait faillite et emporte des factures impayées du label.',
    effets: [
      { t: 'cash', euros: -5000 },
      { t: 'reputation', v: -1 },
    ],
  },
  {
    id: 'turbulences-rachat-opportuniste',
    saison: 'turbulences',
    titre: 'Rachat à prix cassé',
    texte: 'Un petit catalogue en difficulté est cédé à prix cassé.',
    choix: [
      {
        id: 'racheter',
        texte: 'Racheter le catalogue',
        exige: 6000,
        effets: [
          { t: 'cash', euros: -6000 },
          { t: 'reputation', v: 2 },
          { t: 'streaming', pct: 1 },
        ],
      },
      { id: 'passer', texte: 'Ne pas bouger', effets: [] },
    ],
    defaut: 'passer',
  },
  {
    id: 'turbulences-salle-fermee',
    saison: 'turbulences',
    titre: 'Une salle ferme ses portes',
    texte: 'La salle où {nom} avait ses habitudes ferme faute de public.',
    effets: [
      { t: 'moral', v: -5 },
      { t: 'fans', pct: -1 },
    ],
  },
  {
    id: 'turbulences-prix-du-vinyle',
    saison: 'turbulences',
    titre: 'Le plastique flambe',
    texte: 'Le prix des matières premières fait flamber la fabrication des disques.',
    effets: [{ t: 'cash', euros: -2500 }],
  },
  {
    id: 'turbulences-baisse-des-cachets',
    saison: 'turbulences',
    titre: 'Cachets en berne',
    texte: 'Les organisateurs rognent les cachets : {nom} devra se contenter de moins.',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter la baisse',
        effets: [
          { t: 'cash', euros: 1500 },
          { t: 'moral', v: -4 },
        ],
      },
      { id: 'refuser', texte: 'Refuser de jouer', effets: [{ t: 'hype', v: -4 }] },
    ],
    defaut: 'accepter',
  },
  {
    id: 'turbulences-licenciements-au-rival',
    saison: 'turbulences',
    titre: 'Licenciements chez un rival',
    texte:
      'Un label concurrent licencie en masse : ses meilleurs éléments cherchent un point de chute.',
    effets: [
      { t: 'reputation', v: 1 },
      { t: 'cash', euros: -600 },
    ],
  },
  {
    id: 'turbulences-fonds-d-urgence',
    saison: 'turbulences',
    titre: 'Fonds d’urgence pour la culture',
    texte: 'Un fonds d’urgence public soutient les labels indépendants.',
    choix: [
      { id: 'demander', texte: 'Déposer un dossier', effets: [{ t: 'cash', euros: 6000 }] },
      { id: 'laisser', texte: 'Laisser aux plus fragiles', effets: [{ t: 'reputation', v: 2 }] },
    ],
    defaut: 'demander',
  },
  {
    id: 'turbulences-fuite-de-capitaux',
    saison: 'turbulences',
    titre: 'Un investisseur se retire',
    texte: 'Un investisseur de la place se retire du secteur musical et vend ses participations.',
    effets: [
      { t: 'cash', euros: -3000 },
      { t: 'reputation', v: -1 },
    ],
  },
  {
    id: 'turbulences-public-prudent',
    saison: 'turbulences',
    titre: 'Un public qui compte ses sous',
    texte:
      'Les billets de concert se vendent moins vite : le public arbitre entre sorties et courses.',
    effets: [
      { t: 'cash', euros: -1500 },
      { t: 'streaming', pct: -1 },
    ],
  },
  {
    id: 'turbulences-valeur-refuge',
    saison: 'turbulences',
    titre: 'Valeur refuge',
    texte: 'En temps de crise, le public se réfugie dans les valeurs sûres du {genreNom}.',
    cible: 'genre',
    effets: [{ t: 'genre', v: 4 }],
  },
  {
    id: 'turbulences-fin-d-un-mode',
    saison: 'turbulences',
    titre: 'La fin d’une mode',
    texte: 'Le {genreNom} faisait vivre toute une industrie : il s’essouffle au pire moment.',
    cible: 'genre',
    effets: [{ t: 'genre', v: -5 }],
  },
  {
    id: 'turbulences-plan-social',
    saison: 'turbulences',
    titre: 'Plan d’économies',
    texte:
      'Le conseil réclame un plan d’économies : couper dans le marketing ou geler les salaires.',
    choix: [
      {
        id: 'marketing',
        texte: 'Couper le marketing',
        effets: [
          { t: 'cash', euros: 3000 },
          { t: 'tousHype', v: -4 },
        ],
      },
      {
        id: 'salaires',
        texte: 'Geler les salaires',
        effets: [
          { t: 'cash', euros: 3000 },
          { t: 'reputation', v: -2 },
        ],
      },
    ],
    defaut: 'marketing',
  },
  {
    id: 'turbulences-streams-gratuits',
    saison: 'turbulences',
    titre: 'Offres gratuites partout',
    texte: 'Les plateformes multiplient les offres gratuites pour retenir leurs abonnés.',
    effets: [{ t: 'streaming', pct: -2 }],
  },
  {
    id: 'turbulences-artiste-sollicite',
    saison: 'turbulences',
    titre: 'Une avance en urgence',
    texte: '{nom} demande une avance exceptionnelle pour faire face à une période difficile.',
    choix: [
      {
        id: 'avancer',
        texte: 'Avancer l’argent',
        exige: 2500,
        effets: [
          { t: 'cash', euros: -2500 },
          { t: 'loyaute', v: 15 },
          { t: 'affinite', v: 6 },
        ],
      },
      {
        id: 'refuser',
        texte: 'Refuser',
        effets: [
          { t: 'loyaute', v: -6 },
          { t: 'moral', v: -4 },
        ],
      },
    ],
    defaut: 'refuser',
  },
  {
    id: 'turbulences-loyer-en-hausse',
    saison: 'turbulences',
    titre: 'Loyers en hausse',
    texte: 'L’inflation fait grimper les loyers des studios et des bureaux.',
    effets: [{ t: 'cash', euros: -2000 }],
  },
  {
    id: 'turbulences-solidarite',
    saison: 'turbulences',
    titre: 'Élan de solidarité',
    texte: 'Les artistes organisent un concert de soutien aux professionnels en difficulté.',
    effets: [
      { t: 'reputation', v: 2 },
      { t: 'tousHype', v: 3 },
    ],
  },
  {
    id: 'turbulences-redressement',
    saison: 'turbulences',
    titre: 'Signes de reprise',
    texte: 'Les premiers chiffres du trimestre rassurent : le marché reprend des couleurs.',
    effets: [
      { t: 'streaming', pct: 2 },
      { t: 'cash', euros: 1500 },
    ],
  },
  {
    id: 'turbulences-tournee-annulee',
    saison: 'turbulences',
    titre: 'Tournée repoussée',
    texte: 'Faute de réservations, la tournée de {nom} est repoussée à des jours meilleurs.',
    effets: [
      { t: 'cash', euros: -2000 },
      { t: 'fatigue', v: -10 },
      { t: 'moral', v: -3 },
    ],
  },
];
