import { useState } from 'react';
import type { VueRecord, VueSucces } from '@tycoon/label-tycoon';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

export type FiltreSucces = 'tous' | 'obtenus' | 'restants';

/** Succès retenus par le filtre, dans l'ordre de la liste (obtenus d'abord pour « tous »). */
export function filtrerSucces(liste: readonly VueSucces[], filtre: FiltreSucces): VueSucces[] {
  if (filtre === 'obtenus') return liste.filter((s) => s.obtenu);
  if (filtre === 'restants') return liste.filter((s) => !s.obtenu);
  return [...liste].sort((a, b) => Number(b.obtenu) - Number(a.obtenu));
}

/** Avancement vers un succès, entre 0 et 1 (le rang se lit à l'envers : plus petit = mieux). */
export function avancement(s: VueSucces): number {
  if (s.obtenu) return 1;
  if (s.unite === 'rang') return s.valeur <= 0 ? 0 : Math.min(1, s.seuil / s.valeur);
  return Math.max(0, Math.min(1, s.valeur / Math.max(1, s.seuil)));
}

/** Valeur courante lisible, selon l'unité de la famille. */
export function formaterValeur(s: Pick<VueSucces, 'unite' | 'valeur'>): string {
  switch (s.unite) {
    case 'argent':
      return eur(s.valeur);
    case 'rang':
      return s.valeur <= 0 ? 'aucune place' : `n° ${s.valeur}`;
    case 'semaines':
      return `${s.valeur} semaine(s)`;
    case 'palier':
      return `palier ${s.valeur + 1}`;
    default:
      return s.valeur.toLocaleString('fr-FR');
  }
}

/** Valeur d'un record : en euros pour la trésorerie, brute sinon. */
export const formaterRecord = (r: VueRecord): string =>
  r.clef === 'tresorerie-max' ? eur(r.valeur) : r.valeur.toLocaleString('fr-FR');

/** Succès et records du label. */
export function Succes() {
  const { vue } = useLabel();
  const [filtre, setFiltre] = useState<FiltreSucces>('tous');
  if (!vue) return null;
  const liste = filtrerSucces(vue.tousSucces, filtre);
  const obtenus = vue.tousSucces.filter((s) => s.obtenu).length;

  return (
    <section className="label-screen" aria-labelledby="succes-titre">
      <h2 id="succes-titre">Succès</h2>
      <p>
        <strong className="mono">
          {obtenus} / {vue.tousSucces.length}
        </strong>{' '}
        succès obtenus.
      </p>

      <h3>Records du label</h3>
      {vue.records.length === 0 ? (
        <p className="label-screen__soon">Les records s’enregistrent dès la première semaine.</p>
      ) : (
        <table className="label-table">
          <thead>
            <tr>
              <th scope="col">Record</th>
              <th scope="col">Valeur</th>
              <th scope="col">Établi</th>
            </tr>
          </thead>
          <tbody>
            {vue.records.map((r) => (
              <tr key={r.clef}>
                <th scope="row">{r.nom}</th>
                <td className="mono">{formaterRecord(r)}</td>
                <td className="mono">semaine {r.semaine}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Tous les succès</h3>
      <label className="label-field">
        Afficher
        <select value={filtre} onChange={(e) => setFiltre(e.target.value as FiltreSucces)}>
          <option value="tous">Tous</option>
          <option value="obtenus">Obtenus</option>
          <option value="restants">Restants</option>
        </select>
      </label>
      {liste.length === 0 ? (
        <p className="label-screen__soon">Aucun succès dans cette liste.</p>
      ) : (
        <ul className="label-list">
          {liste.map((s) => (
            <li key={s.id} data-obtenu={s.obtenu}>
              <strong>
                {s.obtenu ? '✔ ' : ''}
                {s.titre}
              </strong>{' '}
              — {s.description}
              {s.obtenu ? null : (
                <>
                  {' '}
                  <small>Actuellement : {formaterValeur(s)}</small>
                  <progress max={1} value={avancement(s)} aria-label={`Avancement : ${s.titre}`} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
