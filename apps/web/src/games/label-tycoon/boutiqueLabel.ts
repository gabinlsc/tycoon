import type { CadreCarte, ThemeMonde } from '../../lib/pass';

/** Objets de la boutique de Label Tycoon (cosmétiques, achetés en pièces Tycoon fictives). */
export type ObjetBoutique =
  | {
      id: string;
      kind: 'theme';
      valeur: Exclude<ThemeMonde, 'saison'>;
      nom: string;
      accroche: string;
      prix: number;
    }
  | {
      id: string;
      kind: 'cadre';
      valeur: Exclude<CadreCarte, 'classique'>;
      nom: string;
      accroche: string;
      prix: number;
    };

export const CATALOGUE: readonly ObjetBoutique[] = [
  {
    id: 'theme:aube',
    kind: 'theme',
    valeur: 'aube',
    nom: 'Ciel Aube',
    accroche: 'Le monde se lève toujours en rose.',
    prix: 200,
  },
  {
    id: 'theme:neon',
    kind: 'theme',
    valeur: 'neon',
    nom: 'Ciel Néon',
    accroche: 'Une ville qui ne dort jamais.',
    prix: 400,
  },
  {
    id: 'cadre:chrome',
    kind: 'cadre',
    valeur: 'chrome',
    nom: 'Cadre Chrome',
    accroche: 'Des cartes qui brillent comme du métal.',
    prix: 300,
  },
  {
    id: 'cadre:diamant',
    kind: 'cadre',
    valeur: 'diamant',
    nom: 'Cadre Diamant',
    accroche: 'Le cadre des stars, serti de lumière.',
    prix: 800,
  },
];
