import { CEREMONY } from './balance';
import type { CeremonyCategory } from './ceremonies';
import type { LabelState } from './state';

export interface VueNomme {
  ref: string;
  nom: string;
  /** Titre ou précision (« Single », « Album »…), vide pour un artiste. */
  detail: string;
  genre: string;
  joueur: boolean;
  gagnant: boolean;
}

export interface VueCategorieCeremonie {
  id: CeremonyCategory;
  nom: string;
  nommes: VueNomme[];
}

/** La cérémonie de l'année, vue par le joueur : nominations, puis résultats. */
export interface VueCeremonie {
  annee: number;
  /** « nominations » avant la remise, « resultats » une fois les prix décernés. */
  phase: 'nominations' | 'resultats';
  semaineRemise: number;
  categories: VueCategorieCeremonie[];
  labelDeLAnnee: boolean;
  /** Nombre de nominations du label du joueur. */
  nominationsDuJoueur: number;
  prixDuJoueur: number;
}

export const NOMS_CATEGORIES: Readonly<Record<CeremonyCategory, string>> = {
  single: 'Single de l’année',
  album: 'Album de l’année',
  artiste: 'Artiste de l’année',
  revelation: 'Révélation de l’année',
};

/** Titres fictifs pour les sorties des concurrents nommés. */
const TITRES = [
  'Minuit sur le toit',
  'Bitume',
  'Lumière noire',
  'Sans filet',
  'Coeur en orbite',
  'Néons',
  'Avant l’aube',
  'Marée haute',
  'Ciel de verre',
  'Rien à perdre',
  'Velours',
  'Hors-série',
];

const empreinte = (texte: string): number => {
  let h = 0x811c9dc5;
  for (const c of texte) {
    h ^= c.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
};

/**
 * Habille la cérémonie pour l'affichage. Les nommés « du marché » prennent les noms d'artistes des
 * labels rivaux (les plus connus d'abord), choisis de façon stable à partir de l'année et de la catégorie.
 */
export function ceremonieDe(state: LabelState, tick: number): VueCeremonie | null {
  const c = state.ceremonie;
  if (!c) return null;
  const annee = Math.floor(tick / 52);
  if (c.annee !== annee) return null;
  const resultats = c.categories.some((k) => k.gagnant !== null);
  const rivaux = state.artistes
    .filter((a) => a.employeur.startsWith('rival:'))
    .sort((a, b) => b.fanbase - a.fanbase || a.id - b.id)
    .slice(0, 24);
  let nominations = 0;
  let prix = 0;
  const categories = c.categories.map<VueCategorieCeremonie>((k) => ({
    id: k.categorie,
    nom: NOMS_CATEGORIES[k.categorie],
    nommes: k.candidats.map<VueNomme>((cand) => {
      const gagnant = k.gagnant === cand.ref;
      if (cand.joueur) {
        nominations += 1;
        if (gagnant) prix += 1;
      }
      const sortie = k.categorie === 'single' || k.categorie === 'album';
      if (cand.ref.startsWith('projet:')) {
        const p = state.projets.find((x) => `projet:${x.id}` === cand.ref);
        const a = p && state.artistes.find((x) => x.id === p.artisteId);
        return {
          ref: cand.ref,
          nom: a?.nomScene ?? 'Ton artiste',
          detail: k.categorie === 'single' ? 'Single' : 'Album',
          genre: a?.genre ?? '',
          joueur: true,
          gagnant,
        };
      }
      if (cand.ref.startsWith('artiste:')) {
        const a = state.artistes.find((x) => `artiste:${x.id}` === cand.ref);
        return {
          ref: cand.ref,
          nom: a?.nomScene ?? 'Ton artiste',
          detail: '',
          genre: a?.genre ?? '',
          joueur: true,
          gagnant,
        };
      }
      const h = empreinte(`${c.annee}:${k.categorie}:${cand.ref}`);
      const rival = rivaux.length > 0 ? rivaux[h % rivaux.length] : undefined;
      return {
        ref: cand.ref,
        nom: rival?.nomScene ?? `Artiste ${(h % 90) + 10}`,
        detail: sortie ? `« ${TITRES[h % TITRES.length] ?? ''} »` : '',
        genre: rival?.genre ?? '',
        joueur: false,
        gagnant,
      };
    }),
  }));
  return {
    annee: c.annee + 1,
    phase: resultats ? 'resultats' : 'nominations',
    semaineRemise: c.annee * 52 + CEREMONY.awardWeek,
    categories,
    labelDeLAnnee: c.labelDeLAnnee,
    nominationsDuJoueur: nominations,
    prixDuJoueur: prix,
  };
}
