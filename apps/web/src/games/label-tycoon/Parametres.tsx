import { Button } from '../../components/arcade/ui/Button';
import { ECRANS } from './ecrans';
import { useLabel } from './LabelContext';
import { NOMS_MODES } from './partie';
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
  const { vue } = useLabel();
  const actives = CATEGORIES_PAUSE.filter((c) => reglages[c]).length;
  return (
    <section className="label-screen" aria-labelledby="parametres-titre">
      <h2 id="parametres-titre">Paramètres</h2>

      {vue ? (
        <>
          <h3>Ta partie</h3>
          <p>
            Mode : <strong>{NOMS_MODES[vue.partie.mode] ?? vue.partie.mode}</strong>
            {vue.partie.bacASable ? ' (argent illimité, pas de faillite)' : ''}. Ces réglages sont
            fixés au départ de la partie.
          </p>
          <ul className="label-list">
            <li>
              Budget de départ : ×{' '}
              <span className="mono">{vue.partie.difficulte.capitalDepart}</span>
            </li>
            <li>
              Agressivité des rivaux : ×{' '}
              <span className="mono">{vue.partie.difficulte.agressiviteRivaux}</span>
            </li>
            <li>
              Volatilité du marché : ×{' '}
              <span className="mono">{vue.partie.difficulte.volatiliteMarche}</span>
            </li>
            <li>
              Bonus de trésorerie des rivaux : +{' '}
              <span className="mono">
                {Math.round(vue.partie.difficulte.bonusTresorerieRivaux * 100)} %
              </span>
              {vue.partie.difficulte.bonusTresorerieRivaux > 0
                ? ' (les rivaux ne jouent pas tout à fait avec les mêmes moyens que toi)'
                : ' (aucun : les rivaux jouent avec les mêmes règles que toi)'}
            </li>
            <li>Faillite : {vue.partie.faillitePossible ? 'possible' : 'désactivée'}</li>
            <li>
              Fréquence des événements : ×{' '}
              <span className="mono">{vue.partie.frequenceEvenements}</span>
            </li>
          </ul>
        </>
      ) : null}

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
