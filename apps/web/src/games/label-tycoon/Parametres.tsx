import { Button } from '../../components/arcade/ui/Button';
import { ECRANS } from './ecrans';
import { CATEGORIES_PAUSE, LIBELLES_PAUSE } from './temps';
import { useReglagesPause } from './useReglagesPause';

/** Raccourcis clavier du jeu, des chiffres de navigation aux touches du temps. */
export const RACCOURCIS = [
  { touche: 'Espace', action: 'Mettre en pause ou relancer le temps' },
  { touche: 'N', action: 'Avancer d’une semaine' },
  ...ECRANS.slice(0, 9).map((e, i) => ({
    touche: String(i + 1),
    action: `Aller à l’écran ${e.titre}`,
  })),
] as const;

/** Paramètres : auto-pauses et rappel des raccourcis clavier. */
export function Parametres() {
  const { reglages, basculer, reinitialiser } = useReglagesPause();
  const actives = CATEGORIES_PAUSE.filter((c) => reglages[c]).length;
  return (
    <section className="label-screen" aria-labelledby="parametres-titre">
      <h2 id="parametres-titre">Paramètres</h2>

      <h3>Auto-pauses</h3>
      <p>
        Le temps s’arrête de lui-même quand l’un de ces événements survient ({actives} sur{' '}
        {CATEGORIES_PAUSE.length} actifs). Les réglages sont mémorisés dans ce navigateur.
      </p>
      <fieldset>
        <legend className="visually-hidden">Mettre le jeu en pause quand…</legend>
        {CATEGORIES_PAUSE.map((c) => (
          <label key={c} className="label-time__check">
            <input
              type="checkbox"
              checked={reglages[c]}
              onChange={(e) => basculer(c, e.target.checked)}
            />
            {LIBELLES_PAUSE[c]}
          </label>
        ))}
      </fieldset>
      <Button type="button" onClick={reinitialiser}>
        Rétablir les réglages par défaut
      </Button>

      <h3>Raccourcis clavier</h3>
      <p>Les raccourcis sont désactivés pendant la saisie dans un champ.</p>
      <table className="label-table">
        <thead>
          <tr>
            <th scope="col">Touche</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {RACCOURCIS.map((r) => (
            <tr key={r.touche}>
              <th scope="row">
                <kbd>{r.touche}</kbd>
              </th>
              <td>{r.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
