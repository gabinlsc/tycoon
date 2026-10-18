/** Écrans du jeu. L'ordre donne les raccourcis clavier : 1 pour le premier, 2 pour le deuxième… */
export const ECRANS = [
  { id: 'qg', titre: 'QG', description: 'Tableau de bord du label' },
  { id: 'roster', titre: 'Roster', description: 'Tes artistes' },
  { id: 'reperage', titre: 'Repérage', description: 'Trouver de nouveaux talents' },
  { id: 'studio', titre: 'Studio', description: 'Produire des sorties' },
  { id: 'fil', titre: 'Le Fil', description: 'Les actus du label' },
  { id: 'boite', titre: 'Boîte', description: 'Décisions et notifications' },
  {
    id: 'calendrier',
    titre: 'Calendrier',
    description: 'Sorties à venir, les tiennes et celles des rivaux',
  },
  { id: 'classements', titre: 'Classements', description: 'Top 50 et certifications' },
  { id: 'marche', titre: 'Marché', description: 'Genres, tendances et prévisions' },
  { id: 'concurrence', titre: 'Concurrence', description: 'Les labels rivaux' },
  { id: 'finances', titre: 'Finances', description: 'Comptes, prêts et investisseurs' },
  { id: 'personnel', titre: 'Personnel', description: 'Équipe et délégation' },
  { id: 'batiments', titre: 'Bâtiments', description: 'Studio, bureaux et salles' },
  { id: 'tournees', titre: 'Tournées', description: 'Concerts, tournées et festivals' },
  { id: 'parametres', titre: 'Paramètres', description: 'Auto-pauses et raccourcis' },
] as const;

export type EcranId = (typeof ECRANS)[number]['id'];

/** Écran correspondant à une touche ('1' à '9'), ou `null`. */
export function ecranDeTouche(touche: string): EcranId | null {
  const index = Number(touche) - 1;
  return Number.isInteger(index) && index >= 0 ? (ECRANS[index]?.id ?? null) : null;
}
