import { useState } from 'react';
import type { VueActu } from '@tycoon/label-tycoon';
import { Disc3, Newspaper, Swords, TrendingUp, Users, Star, type LucideIcon } from 'lucide-react';
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

const ICONES_CATEGORIE: Record<CategorieId, LucideIcon> = {
  tout: Newspaper,
  label: Disc3,
  artistes: Users,
  rivaux: Swords,
  marche: TrendingUp,
};

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
      <div className="lt-fil__filtres" role="group" aria-label="Catégorie">
        {CATEGORIES.map((c) => {
          const Icone = ICONES_CATEGORIE[c.id];
          return (
            <button
              key={c.id}
              type="button"
              className={`lt-tri__puce${c.id === categorie ? ' is-actif' : ''}`}
              aria-pressed={c.id === categorie}
              onClick={() => setCategorie(c.id)}
            >
              <Icone aria-hidden="true" size={16} /> {c.nom}
            </button>
          );
        })}
        <span className="lt-fil__sep" aria-hidden="true" />
        <label className="lt-fil__important">
          <input
            type="checkbox"
            checked={importance > 1}
            onChange={(e) => setImportance(e.target.checked ? 2 : 1)}
          />
          <Star aria-hidden="true" size={16} /> Actus importantes seulement
        </label>
      </div>
      {actus.length === 0 ? (
        <p className="lt-rien">
          {vue.fil.length === 0
            ? 'Le Fil se remplira au fil des semaines.'
            : 'Aucune actu ne correspond à ce filtre.'}
        </p>
      ) : (
        <ul className="lt-fil">
          {actus.map((a) => {
            const Icone = ICONES_CATEGORIE[categorieDe(a)];
            return (
              <li key={a.id} data-importance={a.importance} className="lt-actu">
                <span className="lt-actu__icone" aria-hidden="true">
                  <Icone size={22} strokeWidth={2.4} />
                </span>
                <div>
                  <strong>{a.titre}</strong>
                  <p>{a.texte}</p>
                  <small>
                    Semaine {a.semaine} · {LIBELLE_IMPORTANCE[a.importance]}
                  </small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
