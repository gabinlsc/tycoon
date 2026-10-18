import type { GameMode } from '../config';
import type { TierId } from '../balance/tiers';
import type { StaffRole, StaffTrait } from '../balance/staff';
import type { BaseGenreId, GenreFamily } from '../content/genres';
import type { TraitId } from '../content/traits';
import type { CareerPhase } from '../artists';
import type { TalentLevel } from '../balance/artists';
import type { Origin } from '../naming';
import type { ExpenseCategory, RevenueCategory } from '../content/finance';

/**
 * Toutes les chaînes affichées du jeu, en français. Aucune chaîne n'est écrite en dur dans les
 * composants ni dans les règles : à terme, une autre langue se branche en fournissant un autre
 * objet du même type (`Strings`). Les chaînes à variables sont des fonctions typées.
 */
export const fr = {
  tiers: {
    'home-studio': 'Home-studio',
    independant: 'Label indépendant',
    etabli: 'Label établi',
    major: 'Major',
  } satisfies Record<TierId, string>,

  genres: {
    rap: 'Rap',
    drill: 'Drill',
    trap: 'Trap',
    afro: 'Afro',
    rnb: 'R&B',
    'pop-urbaine': 'Pop urbaine',
    'electro-pop': 'Électro-pop',
    latino: 'Trap latin',
    variete: 'Variété contemporaine',
    dancehall: 'Dancehall',
  } satisfies Record<BaseGenreId, string>,

  famillesDeGenre: {
    urbain: 'Musiques urbaines',
    pop: 'Pop',
    afro: 'Afro et caribéen',
    latino: 'Latino',
    electro: 'Électro',
  } satisfies Record<GenreFamily, string>,

  traits: {
    perfectionniste: 'Perfectionniste',
    fetard: 'Fêtard',
    discret: 'Discret',
    provocateur: 'Provocateur',
    bosseur: 'Bosseur',
    diva: 'Diva',
    loyal: 'Loyal',
    opportuniste: 'Opportuniste',
    solitaire: 'Solitaire',
    sociable: 'Sociable',
    paresseux: 'Paresseux',
    visionnaire: 'Visionnaire',
    prudent: 'Prudent',
    impulsif: 'Impulsif',
    humble: 'Humble',
    ambitieux: 'Ambitieux',
    nostalgique: 'Nostalgique',
    militant: 'Militant',
    cerebral: 'Cérébral',
    instinctif: 'Instinctif',
  } satisfies Record<TraitId, string>,

  typesDeSortie: {
    single: 'Single',
    ep: 'EP',
    album: 'Album',
    mixtape: 'Mixtape',
  },

  phasesDeCarriere: {
    emergent: 'Émergent',
    montee: 'En montée',
    pic: 'Au sommet',
    plateau: 'Plateau',
    declin: 'En déclin',
    culte: 'Statut culte',
  } satisfies Record<CareerPhase, string>,

  niveaux: {
    amateur: 'Amateur',
    espoir: 'Espoir',
    confirme: 'Confirmé',
    star: 'Star',
  } satisfies Record<TalentLevel, string>,

  origines: {
    france: 'France',
    maghreb: 'Maghreb',
    afrique: 'Afrique',
    antilles: 'Antilles',
    'europe-sud': 'Europe du Sud',
    latine: 'Amérique latine',
  } satisfies Record<Origin, string>,

  rolesPersonnel: {
    producteur: 'Producteur',
    ingenieur: 'Ingénieur du son',
    attache: 'Attaché de presse',
    'community-manager': 'Community manager',
    tourneur: 'Tourneur',
    juriste: 'Juriste',
    'directeur-financier': 'Directeur financier',
  } satisfies Record<StaffRole, string>,

  traitsPersonnel: {
    ambitieux: 'Ambitieux',
    loyal: 'Loyal',
    perfectionniste: 'Perfectionniste',
    paresseux: 'Paresseux',
  } satisfies Record<StaffTrait, string>,

  categoriesRevenus: {
    streaming: 'Streaming',
    physique: 'Ventes physiques',
    concerts: 'Concerts',
    merch: 'Merchandising',
    synchro: 'Synchronisation',
    cessions: 'Cessions de contrats',
    autres: 'Autres revenus',
  } satisfies Record<RevenueCategory, string>,

  categoriesDepenses: {
    salaires: 'Salaires',
    entretien: 'Loyers et entretien',
    production: 'Production',
    marketing: 'Marketing',
    avances: 'Avances aux artistes',
    royalties: 'Royalties versées',
    tournees: 'Tournées',
    reperage: 'Repérage',
    interets: 'Intérêts et remboursements',
    impots: 'Impôts',
    autres: 'Autres dépenses',
  } satisfies Record<ExpenseCategory, string>,

  /** Libellés des termes d'explication (infobulles « d'où vient ce chiffre »). */
  explications: {
    plume: 'Plume',
    flow: 'Flow',
    voix: 'Voix',
    bornes: 'Limites de 0 à 100',
    tresorerie: 'Trésorerie',
    catalogue: 'Valeur du catalogue',
    contrats: 'Valeur des contrats',
    dettes: 'Dettes',
    talent: 'Talent artistique',
    producteur: 'Producteur',
    adequation: 'Adéquation de genre',
    studio: 'Studio',
    mixage: 'Mixage',
    featuring: 'Featuring',
    base: 'Base',
    moral: 'Moral de l’artiste',
    bruit: 'Part de hasard',
    qualite: 'Qualité',
    tendance: 'Tendance du genre',
    hype: 'Hype',
    marketing: 'Marketing',
  },

  sourcesDeReperage: {
    'open-mic': 'Scènes ouvertes',
    plateforme: 'Plateforme de streaming amateur',
    battle: 'Battles',
    candidature: 'Candidatures spontanées',
  } satisfies Record<'open-mic' | 'plateforme' | 'battle' | 'candidature', string>,

  modes: {
    carriere: 'Carrière',
    scenario: 'Scénario',
    'bac-a-sable': 'Bac à sable',
    defi: 'Défi du jour',
    tutoriel: 'Tutoriel',
  } satisfies Record<GameMode, string>,

  difficulte: {
    facile: 'Facile',
    normal: 'Normal',
    difficile: 'Difficile',
  },

  /** Refus d'actions, par code (voir `Rejection.code` du moteur). */
  refus: {
    'action-inconnue': (p: { type: string }) => `Action inconnue : ${p.type}.`,
    'nom-vide': () => 'Donne un nom à ton label.',
    'nom-trop-long': (p: { max: number }) =>
      `Le nom du label ne peut pas dépasser ${p.max} caractères.`,
    'decision-introuvable': () => "Cette décision n'existe plus.",
    'choix-inconnu': () => "Ce choix n'existe pas.",
    'choix-indisponible': () => "Ce choix n'est pas disponible pour le moment.",
    'source-inconnue': () => "Cette source de repérage n'existe pas.",
    'fonds-insuffisants': (p: { besoin: number }) =>
      `Fonds insuffisants : il faut ${p.besoin} centimes.`,
    'trop-de-suivis': (p: { max: number }) =>
      `Tu suis déjà ${p.max} talents : abandonne-en un d'abord.`,
    'denicheur-introuvable': () => "Ce dénicheur n'est pas dans ton équipe.",
    'trop-de-denicheurs': (p: { max: number }) =>
      `Ton équipe compte déjà ${p.max} dénicheurs : renvoie-en un d'abord.`,
    'genre-inconnu': () => "Ce genre n'existe pas.",
    'artiste-introuvable': () => "Cet artiste n'existe pas.",
    'artiste-indisponible': () => 'Cet artiste est déjà sous contrat ailleurs.',
    'clauses-invalides': () => 'Ces clauses sortent des limites autorisées.',
    'offre-refusee': () => "L'artiste refuse cette offre : revois les clauses.",
    'negociation-rompue': () => "L'artiste ne veut plus négocier avec toi.",
    'contre-propositions-epuisees': () => 'Plus de contre-proposition possible : signe ou renonce.',
    'contrat-introuvable': () => "Cet artiste n'a pas de contrat avec ton label.",
    'artiste-non-signe': () => "Cet artiste n'est pas signé chez toi.",
    'projet-invalide': () => 'Les réglages de ce projet sont invalides.',
    'studio-sature': (p: { max: number }) =>
      `Le studio est saturé : ${p.max} projets en cours au maximum.`,
    'projet-introuvable': () => "Ce projet n'existe pas.",
    'projet-pas-pret': () => "Ce projet n'est pas encore terminé.",
    'horizon-invalide': () => "Cet horizon de prévision n'existe pas.",
    'candidat-introuvable': () => "Ce candidat n'est plus disponible.",
    'equipe-pleine': (p: { max: number }) => `Ton équipe compte déjà ${p.max} membres.`,
    'membre-introuvable': () => "Ce membre n'est pas dans ton équipe.",
    'domaine-inconnu': () => 'Ce domaine ne peut pas être délégué.',
    'cadre-invalide': () => 'Le cadre de délégation est invalide.',
    'batiment-inconnu': () => "Ce bâtiment n'existe pas.",
    'travaux-en-cours': () => 'Des travaux sont déjà en cours sur ce bâtiment.',
    'niveau-maximal': () => 'Ce bâtiment est déjà au niveau maximal.',
    'palier-insuffisant': () => "Ton label n'a pas encore atteint le palier requis.",
    'studio-trop-modeste': (p: { max: number }) =>
      `Ton studio ne permet pas plus de ${p.max} de niveau.`,
    'pas-de-pressage': () => 'Il te faut un bâtiment de pressage pour commander du physique.',
    'format-inconnu': () => "Ce format physique n'existe pas.",
    'quantite-invalide': (p: { min: number; max: number }) =>
      `La quantité doit être comprise entre ${p.min} et ${p.max} exemplaires.`,
    'salle-inconnue': () => "Cette salle n'existe pas.",
    'prix-invalide': () => "Le prix du billet doit être un nombre entier d'euros, au moins 1.",
    'dates-invalides': (p: { min: number; max: number }) =>
      `Une tournée compte entre ${p.min} et ${p.max} dates.`,
    'merch-invalide': () => 'La quantité de merch doit être un nombre entier positif.',
    'tournee-en-cours': () => 'Cet artiste est déjà en tournée.',
    'artiste-au-repos': (p: { semaines: number }) =>
      `Cet artiste est au repos encore ${p.semaines} semaines.`,
    'festival-introuvable': () => "Ce festival n'est plus ouvert aux candidatures.",
    'festival-complet': () => 'Ce festival a déjà retenu un artiste de ton label.',
    'festival-conflit': () => 'Cet artiste est déjà pris cette semaine-là.',
    'candidature-refusee': () => "L'artiste n'est pas assez connu pour ce festival.",
    'offre-introuvable': () => "Cette offre n'est plus valable.",
    'montant-invalide': () => 'Le montant demandé est trop faible ou invalide.',
    'duree-invalide': (p: { min: number; max: number }) =>
      `La durée doit être comprise entre ${p.min} et ${p.max} semaines.`,
    'trop-de-prets': (p: { max: number }) => `Tu as déjà ${p.max} prêts en cours.`,
    'plafond-depasse': (p: { max: number }) =>
      `Ta banque n'ira pas au-delà de ${p.max} centimes d'encours.`,
    'pret-introuvable': () => "Ce prêt n'existe pas.",
    'trop-d-investisseurs': (p: { max: number }) => `Tu as déjà ${p.max} investisseurs actifs.`,
    'rival-introuvable': () => "Ce label rival n'existe pas.",
    'strategie-inconnue': () => "Cette stratégie fiscale n'existe pas.",
    'mentorat-invalide': () => 'Un mentor au pic ou en plateau parraine un émergent du même genre.',
    'deja-parraine': () => 'Cet artiste a déjà un mentor.',
    'trop-de-mentorats': (p: { max: number }) =>
      `Tu ne peux pas suivre plus de ${p.max} mentorats.`,
    'pas-un-artiste-rival': () => "Cet artiste n'est pas sous contrat chez un rival.",
    'rachat-refuse': () => 'Ce rival refuse de te vendre son artiste.',
    'suivi-introuvable': () => "Ce talent n'est pas dans ta liste de suivi.",
    'essai-deja-fait': () => 'Tu as déjà fait passer un essai à ce talent.',
  },
} as const;

export type Strings = typeof fr;
