import type { VueSceneVille } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Niveau de chaleur en toutes lettres : l'information ne repose pas sur la couleur. */
export const libelleChaleur = (s: Pick<VueSceneVille, 'chaleur' | 'emergente'>): string =>
  s.emergente ? 'émergente' : s.chaleur >= 70 ? 'brûlante' : s.chaleur >= 45 ? 'active' : 'calme';

/** Scènes des villes : profil de genres, chaleur et repérage sur place. */
export function Scenes() {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  return (
    <section className="label-screen" aria-labelledby="scenes-titre">
      <h2 id="scenes-titre">Scènes locales</h2>
      <p>
        Chaque ville a sa scène : un genre dominant, un genre secondaire et une chaleur qui évolue.
        Repérer dans une scène émergente donne de meilleurs talents.
      </p>
      <ul className="label-list">
        {vue.scenesVilles.map((s) => (
          <li key={s.ville}>
            <strong>{s.ville}</strong> — {s.genreNom} (et {s.secondaireNom}) · scène{' '}
            {libelleChaleur(s)} ({s.chaleur} / 100)
            {s.artistes > 0 ? ` · ${s.artistes} artiste(s) du label` : ''}{' '}
            <Button
              type="button"
              disabled={vue.finances.tresorerie < s.cout}
              onClick={() =>
                void envoyer({ type: 'action', action: { type: 'reperer-scene', ville: s.ville } })
              }
            >
              Repérer à {s.ville} ({eur(s.cout)})
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
