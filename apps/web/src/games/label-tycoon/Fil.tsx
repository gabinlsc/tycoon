import { useState } from 'react';
import type { VueActu } from '@tycoon/label-tycoon';
import { useLabel } from './LabelContext';

export const CATEGORIES = [
  { id: 'tout', nom: 'Tout' },
  { id: 'label', nom: 'Mon label' },
  { id: 'artistes', nom: 'Artistes' },
  { id: 'rivaux', nom: 'Rivaux' },
  { id: 'marche', nom: 'Marché' },
] as const;

export type CategorieId = (typeof CATEGORIES)[number]['id'];

const PAR_TYPE: Record<string, Exclude<CategorieId, 'tout'>> = {
  sortie: 'label',
  'entree-classement': 'label',
  certification: 'label',
  'prix-remporte': 'label',
  nomination: 'label',
  viral: 'label',
  concert: 'label',
  festival: 'label',
  palier: 'label',
  'alerte-faillite': 'label',
  'label-de-l-annee': 'label',
  'artiste-signe': 'artistes',
  burnout: 'artistes',
  proces: 'artistes',
  'retour-en-grace': 'artistes',
  'statut-culte': 'artistes',
  'signature-rivale': 'rivaux',
  'sortie-rivale': 'rivaux',
  debauchage: 'rivaux',
  clash: 'rivaux',
  'rival-disparu': 'rivaux',
  'rival-nouveau': 'rivaux',
  'rival-evolue': 'rivaux',
  'contrat-vendu': 'rivaux',
  'offre-rachat': 'rivaux',
  'sous-genre-ne': 'marche',
  'sous-genre-disparu': 'marche',
};

/** Catégorie d'une actu d'après son type (« Mon label » par défaut). */
export const categorieDe = (actu: Pick<VueActu, 'kind'>): Exclude<CategorieId, 'tout'> =>
  PAR_TYPE[actu.kind] ?? 'label';

/** Actus d'une catégorie, filtrées par importance minimale. */
export function filtrer(
  actus: readonly VueActu[],
  categorie: CategorieId,
  importanceMin: 1 | 2 | 3,
): VueActu[] {
  return actus.filter(
    (a) => a.importance >= importanceMin && (categorie === 'tout' || categorieDe(a) === categorie),
  );
}

const LIBELLE_IMPORTANCE = { 1: 'Anecdote', 2: 'Actu', 3: 'À la une' } as const;

/** Le Fil du label : actus filtrables par catégorie et par importance. */
export function Fil() {
  const { vue } = useLabel();
  const [categorie, setCategorie] = useState<CategorieId>('tout');
  const [importance, setImportance] = useState<1 | 2 | 3>(1);
  if (!vue) return null;
  const actus = filtrer(vue.fil, categorie, importance);

  return (
    <section className="label-screen" aria-labelledby="fil-titre">
      <h2 id="fil-titre">Le Fil</h2>
      <div className="label-nego__form">
        <label className="label-field">
          Catégorie
          <select value={categorie} onChange={(e) => setCategorie(e.target.value as CategorieId)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="label-field">
          Importance minimale
          <select
            value={importance}
            onChange={(e) => setImportance(Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value={1}>Tout, anecdotes comprises</option>
            <option value={2}>Actus et à la une</option>
            <option value={3}>À la une seulement</option>
          </select>
        </label>
      </div>
      {actus.length === 0 ? (
        <p className="label-screen__soon">
          {vue.fil.length === 0
            ? 'Le Fil se remplira au fil des semaines.'
            : 'Aucune actu ne correspond à ce filtre.'}
        </p>
      ) : (
        <ul className="label-list">
          {actus.map((a) => (
            <li key={a.id} data-importance={a.importance}>
              <small>
                Semaine {a.semaine} · {LIBELLE_IMPORTANCE[a.importance]}
              </small>
              <strong> {a.titre}</strong>
              <p>{a.texte}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
