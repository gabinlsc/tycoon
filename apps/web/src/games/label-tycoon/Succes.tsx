import { useState } from 'react';
import type { VueRecord, VueSucces } from '@tycoon/label-tycoon';
import { Award, Crown, Lock, Trophy } from 'lucide-react';
import { useLabel } from './LabelContext';
import { Panneau, Tuile, Tuiles } from './Visuels';

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
      <Tuiles label="Progression">
        <Tuile
          Icone={Trophy}
          valeur={
            <>
              {obtenus} / {vue.tousSucces.length}
            </>
          }
          libelle="succès obtenus"
          ton="gold"
        />
        <Tuile
          Icone={Crown}
          valeur={`${Math.round((obtenus / Math.max(1, vue.tousSucces.length)) * 100)} %`}
          libelle="de complétion"
          ton="purple"
        />
      </Tuiles>

      <Panneau titre="Records du label" Icone={Crown} ton="orange" id="succes-records">
        {vue.records.length === 0 ? (
          <p className="lt-rien">Les records s’enregistrent dès la première semaine.</p>
        ) : (
          <ul className="lt-records">
            {vue.records.map((r) => (
              <li key={r.clef} className="lt-record">
                <Crown aria-hidden="true" size={20} />
                <strong className="mono">{formaterRecord(r)}</strong>
                <span>{r.nom}</span>
                <small>semaine {r.semaine}</small>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Tous les succès" Icone={Award} ton="purple" id="succes-tous">
        <div className="lt-fil__filtres" role="group" aria-label="Afficher">
          {(
            [
              ['tous', 'Tous'],
              ['obtenus', 'Obtenus'],
              ['restants', 'Restants'],
            ] as const
          ).map(([id, nom]) => (
            <button
              key={id}
              type="button"
              className={`lt-tri__puce${filtre === id ? ' is-actif' : ''}`}
              aria-pressed={filtre === id}
              onClick={() => setFiltre(id)}
            >
              {nom}
            </button>
          ))}
        </div>
        {liste.length === 0 ? (
          <p className="lt-rien">Aucun succès dans cette liste.</p>
        ) : (
          <ul className="lt-succes-grille">
            {liste.map((s) => (
              <li
                key={s.id}
                data-obtenu={s.obtenu}
                className={`lt-succes${s.obtenu ? ' is-obtenu' : ''}`}
              >
                <span className="lt-succes__badge" aria-hidden="true">
                  {s.obtenu ? <Trophy size={26} /> : <Lock size={22} />}
                </span>
                <strong>{s.titre}</strong>
                <small>{s.description}</small>
                {s.obtenu ? null : (
                  <>
                    <small className="lt-succes__actuel">Actuellement : {formaterValeur(s)}</small>
                    <progress
                      max={1}
                      value={avancement(s)}
                      aria-label={`Avancement : ${s.titre}`}
                    />
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </section>
  );
}
