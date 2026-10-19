/** Familles d'écrans, dans l'ordre de la navigation. */
export const GROUPES = [
  { id: 'label', titre: 'Mon label' },
  { id: 'monde', titre: 'Le marché' },
  { id: 'gestion', titre: 'Gestion' },
  { id: 'empire', titre: 'Empire' },
  { id: 'suivi', titre: 'Suivi' },
] as const;
export type GroupeId = (typeof GROUPES)[number]['id'];

/** Écrans du jeu. L'ordre donne les raccourcis clavier : 1 pour le premier, 2 pour le deuxième… */
export const ECRANS = [
  { id: 'qg', titre: 'QG', description: 'Tableau de bord du label', groupe: 'label' as const },
  { id: 'roster', titre: 'Roster', description: 'Tes artistes', groupe: 'label' as const },
  {
    id: 'reperage',
    titre: 'Repérage',
    description: 'Trouver de nouveaux talents',
    groupe: 'label' as const,
  },
  { id: 'studio', titre: 'Studio', description: 'Produire des sorties', groupe: 'label' as const },
  { id: 'fil', titre: 'Le Fil', description: 'Les actus du label', groupe: 'monde' as const },
  {
    id: 'boite',
    titre: 'Boîte',
    description: 'Décisions et notifications',
    groupe: 'label' as const,
  },
  {
    id: 'calendrier',
    titre: 'Calendrier',
    description: 'Sorties à venir, les tiennes et celles des rivaux',
    groupe: 'monde' as const,
  },
  {
    id: 'classements',
    titre: 'Classements',
    description: 'Top 50 et certifications',
    groupe: 'monde' as const,
  },
  {
    id: 'marche',
    titre: 'Marché',
    description: 'Genres, tendances et prévisions',
    groupe: 'monde' as const,
  },
  {
    id: 'concurrence',
    titre: 'Concurrence',
    description: 'Les labels rivaux',
    groupe: 'monde' as const,
  },
  {
    id: 'finances',
    titre: 'Finances',
    description: 'Comptes, prêts et investisseurs',
    groupe: 'gestion' as const,
  },
  {
    id: 'personnel',
    titre: 'Personnel',
    description: 'Équipe et délégation',
    groupe: 'gestion' as const,
  },
  {
    id: 'batiments',
    titre: 'Bâtiments',
    description: 'Studio, bureaux et salles',
    groupe: 'gestion' as const,
  },
  {
    id: 'tournees',
    titre: 'Tournées',
    description: 'Concerts, tournées et festivals',
    groupe: 'gestion' as const,
  },
  {
    id: 'parametres',
    titre: 'Paramètres',
    description: 'Auto-pauses et raccourcis',
    groupe: 'suivi' as const,
  },
  {
    id: 'rapport',
    titre: 'Rapport mensuel',
    description: 'Bilan, réussites et échecs du mois',
    groupe: 'suivi' as const,
  },
  {
    id: 'succes',
    titre: 'Succès',
    description: 'Succès, objectifs et records',
    groupe: 'suivi' as const,
  },
  {
    id: 'groupe',
    titre: 'Groupe',
    description: 'Sous-labels, cadres et rachats',
    groupe: 'empire' as const,
    palier: 'groupe' as const,
  },
  {
    id: 'conglomerat',
    titre: 'Conglomérat',
    description: 'Plateforme, synchro et festivals',
    groupe: 'empire' as const,
    palier: 'conglomerat' as const,
  },
  {
    id: 'institution',
    titre: 'Institution',
    description: 'Fondation, académie et musée',
    groupe: 'empire' as const,
    palier: 'institution' as const,
  },
  {
    id: 'regulation',
    titre: 'Régulation',
    description: 'Concentration, piratage et plateformes',
    groupe: 'empire' as const,
    palier: 'groupe' as const,
  },
  {
    id: 'scenes',
    titre: 'Scènes',
    description: 'Scènes locales et repérage par ville',
    groupe: 'monde' as const,
  },
  {
    id: 'international',
    titre: 'International',
    description: 'Pays, bureaux et classements locaux',
    groupe: 'empire' as const,
    palier: 'major' as const,
  },
  {
    id: 'heritage',
    titre: 'Héritage',
    description: 'Clore le règne et Panthéon',
    groupe: 'suivi' as const,
  },
  {
    id: 'campagne',
    titre: 'Campagne',
    description: 'Les chapitres du garage à l’institution',
    groupe: 'suivi' as const,
  },
  {
    id: 'abonnement',
    titre: 'Abonnement',
    description: 'Offres, thèmes et cadres de cartes (démonstration)',
    groupe: 'suivi' as const,
  },
  {
    id: 'generations',
    titre: 'Générations',
    description: 'Légendes, mentors et relève',
    groupe: 'suivi' as const,
  },
] as const;

export type EcranId = (typeof ECRANS)[number]['id'];

/** Écran correspondant à une touche ('1' à '9'), ou `null`. */
export function ecranDeTouche(touche: string): EcranId | null {
  const index = Number(touche) - 1;
  return Number.isInteger(index) && index >= 0 ? (ECRANS[index]?.id ?? null) : null;
}

/**
 * Pôles de navigation : la barre latérale n'en montre que huit ; chacun ouvre ses écrans en onglets.
 * Les raccourcis clavier (1 à 9) continuent de désigner les écrans, quel que soit leur pôle.
 */
export const POLES = [
  { id: 'qg', titre: 'QG', ecrans: ['qg'] },
  { id: 'artistes', titre: 'Artistes', ecrans: ['roster', 'reperage', 'scenes'] },
  { id: 'production', titre: 'Production', ecrans: ['studio', 'tournees', 'calendrier'] },
  { id: 'boite', titre: 'Boîte', ecrans: ['boite'] },
  { id: 'marche', titre: 'Marché', ecrans: ['fil', 'classements', 'marche', 'concurrence'] },
  { id: 'gestion', titre: 'Gestion', ecrans: ['finances', 'personnel', 'batiments', 'rapport'] },
  {
    id: 'empire',
    titre: 'Empire',
    ecrans: ['groupe', 'conglomerat', 'institution', 'regulation', 'international'],
  },
  {
    id: 'suivi',
    titre: 'Suivi',
    ecrans: ['campagne', 'succes', 'generations', 'heritage', 'abonnement', 'parametres'],
  },
] as const satisfies readonly { id: string; titre: string; ecrans: readonly EcranId[] }[];

export type PoleId = (typeof POLES)[number]['id'];

/** Pôle qui contient un écran. */
export const poleDe = (ecran: EcranId): (typeof POLES)[number] =>
  POLES.find((p) => (p.ecrans as readonly EcranId[]).includes(ecran)) ?? POLES[0];
