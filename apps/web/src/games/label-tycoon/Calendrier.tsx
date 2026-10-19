import type { VueSortieCalendrier } from '@tycoon/label-tycoon';
import { RIVAL_RELEASES } from '@tycoon/label-tycoon';
import { CalendarX, Disc3, Flame, Zap } from 'lucide-react';
import { Avatar } from './avatar';
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
      <p className="lt-sous-titre">Évite de sortir en même temps qu’un gros rival du même genre.</p>
      {clashs.length > 0 ? (
        <ul className="label-alerts" aria-label="Collisions">
          {clashs.map((c) => (
            <li
              key={`${c.semaine}-${c.joueur}-${c.rival}`}
              className="label-alert label-alert--danger"
            >
              <Zap aria-hidden="true" size={16} /> Semaine {c.semaine} : {c.joueur} sort en même
              temps que {c.rival} ({c.genreNom}).
            </li>
          ))}
        </ul>
      ) : null}
      {sansSortie ? (
        <p className="lt-calendrier__vide">
          <CalendarX aria-hidden="true" size={22} /> Aucune sortie prévue pour le moment.
        </p>
      ) : null}
      <ol className="label-calendar lt-agenda">
        {[...grille.entries()].map(([semaine, liste]) => {
          const choc = clashs.some((c) => c.semaine === semaine);
          return (
            <li
              key={semaine}
              className={`label-calendar__week lt-semaine${semaine === vue.semaine ? ' is-courante' : ''}${choc ? ' is-choc' : ''}`}
            >
              <span className="lt-semaine__tete">
                <span className="lt-semaine__num mono">{semaine}</span>
                <span className="lt-semaine__lib">
                  {semaine === vue.semaine ? 'Cette semaine' : `sem. ${semaine}`}
                </span>
                {choc ? (
                  <Zap aria-label="Collision" size={18} className="lt-semaine__choc" />
                ) : null}
              </span>
              {liste.length === 0 ? (
                <span className="label-calendar__empty lt-semaine__vide">—</span>
              ) : (
                <ul className="lt-semaine__sorties">
                  {liste.map((e, i) => (
                    <li
                      key={`${e.nom}-${i}`}
                      className={`lt-sortie ${e.origine === 'joueur' ? 'is-mine' : 'is-rival'}`}
                    >
                      {e.origine === 'joueur' ? (
                        <Disc3 aria-hidden="true" size={22} />
                      ) : (
                        <Avatar nom={e.nom} genre={e.genre} />
                      )}
                      <span className="lt-sortie__texte">
                        <strong>{e.nom}</strong>
                        <small>
                          {e.genreNom}
                          {e.origine === 'joueur'
                            ? ` · ton label · ${e.statut === 'prete' ? 'prête' : 'en production'}`
                            : ' · label rival'}
                        </small>
                      </span>
                      {e.origine !== 'joueur' && e.poids >= RIVAL_RELEASES.bigWeight ? (
                        <span className="lt-sortie__gros">
                          <Flame aria-hidden="true" size={14} /> Gros
                          <span className="visually-hidden"> (grosse sortie)</span>
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
