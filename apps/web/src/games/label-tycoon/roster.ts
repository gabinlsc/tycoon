import type { VueArtiste } from '@tycoon/label-tycoon';

export type CleTri = 'nom' | 'notoriete' | 'hype' | 'moral' | 'fatigue' | 'echeance';

export interface Filtres {
  genre: string;
  phase: string;
  /** Texte libre cherché dans le nom. */
  recherche: string;
}

export const SANS_FILTRE: Filtres = { genre: '', phase: '', recherche: '' };

const valeur = (a: VueArtiste, cle: CleTri): number | string => {
  switch (cle) {
    case 'nom':
      return a.nom.toLocaleLowerCase('fr');
    case 'echeance':
      return a.contrat?.echeance ?? Number.MAX_SAFE_INTEGER;
    default:
      return a[cle];
  }
};

/** Tri stable (ex æquo départagés par identifiant), croissant ou décroissant. */
export function trier(
  artistes: readonly VueArtiste[],
  cle: CleTri,
  decroissant: boolean,
): VueArtiste[] {
  const sens = decroissant ? -1 : 1;
  return [...artistes].sort((a, b) => {
    const x = valeur(a, cle);
    const y = valeur(b, cle);
    const cmp =
      typeof x === 'string' && typeof y === 'string'
        ? x.localeCompare(y, 'fr')
        : Number(x) - Number(y);
    return cmp !== 0 ? sens * cmp : a.id - b.id;
  });
}

export function filtrer(artistes: readonly VueArtiste[], f: Filtres): VueArtiste[] {
  const q = f.recherche.trim().toLocaleLowerCase('fr');
  return artistes.filter(
    (a) =>
      (f.genre === '' || a.genre === f.genre) &&
      (f.phase === '' || a.phase === f.phase) &&
      (q === '' || a.nom.toLocaleLowerCase('fr').includes(q)),
  );
}

/** Niveau d'alerte d'un artiste : ce qui mérite l'attention du joueur. */
export function alertesArtiste(a: VueArtiste, semaine: number): string[] {
  const out: string[] = [];
  if (a.fatigue >= 75) out.push('Épuisé·e');
  if (a.moral <= 30) out.push('Moral bas');
  if (a.contrat && a.contrat.echeance - semaine <= 8) out.push('Contrat bientôt à terme');
  return out;
}
