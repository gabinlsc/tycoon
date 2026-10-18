import type { VueSortieCalendrier } from '@tycoon/label-tycoon';
import { RIVAL_RELEASES } from '@tycoon/label-tycoon';
import { useLabel } from './LabelContext';

/** Semaines affichées à partir de la semaine courante. */
export const HORIZON = 12;

export interface Collision {
  semaine: number;
  genre: string;
  genreNom: string;
  joueur: string;
  rival: string;
}

/** Sorties du joueur qui tombent la même semaine qu'une grosse sortie rivale du même genre. */
export function collisions(sorties: readonly VueSortieCalendrier[]): Collision[] {
  const out: Collision[] = [];
  for (const j of sorties.filter((s) => s.origine === 'joueur')) {
    for (const r of sorties) {
      if (
        r.origine === 'rival' &&
        r.semaine === j.semaine &&
        r.genre === j.genre &&
        r.poids >= RIVAL_RELEASES.bigWeight
      )
        out.push({
          semaine: j.semaine,
          genre: j.genre,
          genreNom: j.genreNom,
          joueur: j.nom,
          rival: r.nom,
        });
    }
  }
  return out;
}

/** Regroupe les sorties par semaine, sur l'horizon donné. */
export function parSemaine(
  sorties: readonly VueSortieCalendrier[],
  depuis: number,
  horizon = HORIZON,
): Map<number, VueSortieCalendrier[]> {
  const map = new Map<number, VueSortieCalendrier[]>();
  for (let s = depuis; s < depuis + horizon; s += 1) map.set(s, []);
  for (const e of sorties) map.get(e.semaine)?.push(e);
  return map;
}

/** Calendrier des sorties : les tiennes, les annonces des rivaux, et les collisions à éviter. */
export function Calendrier() {
  const { vue } = useLabel();
  if (!vue) return null;
  const grille = parSemaine(vue.calendrier, vue.semaine);
  const clashs = collisions(vue.calendrier);
  const sansSortie = vue.calendrier.length === 0;

  return (
    <section className="label-screen" aria-labelledby="cal-titre">
      <h2 id="cal-titre">Calendrier des sorties</h2>
      <p>
        Une grosse sortie rivale dans le même genre la même semaine réduit l’exposition de ta sortie
        de moitié. Les rivaux n’annoncent pas toujours leurs dates.
      </p>
      {clashs.length > 0 ? (
        <ul className="label-alerts" aria-label="Collisions">
          {clashs.map((c) => (
            <li
              key={`${c.semaine}-${c.joueur}-${c.rival}`}
              className="label-alert label-alert--danger"
            >
              Semaine {c.semaine} : {c.joueur} sort en même temps que {c.rival} ({c.genreNom}).
            </li>
          ))}
        </ul>
      ) : null}
      {sansSortie ? (
        <p className="label-screen__soon">Aucune sortie prévue pour le moment.</p>
      ) : null}
      <ol className="label-calendar">
        {[...grille.entries()].map(([semaine, liste]) => (
          <li key={semaine} className="label-calendar__week">
            <span className="mono label-calendar__num">sem. {semaine}</span>
            {liste.length === 0 ? (
              <span className="label-calendar__empty">—</span>
            ) : (
              <ul>
                {liste.map((e, i) => (
                  <li
                    key={`${e.nom}-${i}`}
                    className={e.origine === 'joueur' ? 'is-mine' : 'is-rival'}
                  >
                    <strong>{e.nom}</strong> · {e.genreNom}
                    {e.origine === 'joueur' ? ' · ton label' : ' · label rival'}
                    {e.origine === 'joueur'
                      ? ` · ${e.statut === 'prete' ? 'prête' : 'en production'}`
                      : e.poids >= RIVAL_RELEASES.bigWeight
                        ? ' · grosse sortie'
                        : ''}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
