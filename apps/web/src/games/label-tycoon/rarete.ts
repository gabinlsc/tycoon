export type Rarete = 'commun' | 'rare' | 'epique' | 'legendaire';

export const NOMS_RARETE: Readonly<Record<Rarete, string>> = {
  commun: 'Commun',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
};

/** Rareté d'une carte d'après un score de 0 à 100. */
export function rareteDe(score: number): Rarete {
  if (score >= 78) return 'legendaire';
  if (score >= 60) return 'epique';
  if (score >= 42) return 'rare';
  return 'commun';
}

/** Rang d'une rareté (0 à 3), pour trouver la meilleure carte d'un lot. */
export const rangRarete = (r: Rarete): number =>
  ['commun', 'rare', 'epique', 'legendaire'].indexOf(r);

const moyenne = (valeurs: readonly number[]): number =>
  valeurs.length === 0 ? 0 : valeurs.reduce((s, v) => s + v, 0) / valeurs.length;

/** Score d'un artiste signé : moitié notoriété, moitié compétences. */
export const scoreArtiste = (a: {
  notoriete: number;
  competences: Readonly<Record<string, number>>;
}): number => Math.round(0.5 * a.notoriete + 0.5 * moyenne(Object.values(a.competences)));

/** Score d'un talent repéré : milieu de ses fourchettes de compétences. */
export const scoreSuivi = (s: {
  fourchettes: Readonly<Record<string, readonly [number, number]>>;
}): number =>
  Math.round(moyenne(Object.values(s.fourchettes).map(([bas, haut]) => (bas + haut) / 2)));
