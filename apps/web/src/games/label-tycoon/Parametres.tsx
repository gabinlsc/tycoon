import { Gamepad2, Keyboard, PauseCircle, Settings2 } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { ECRANS } from './ecrans';
import { useLabel } from './LabelContext';
import { NOMS_MODES } from './partie';
import { CATEGORIES_PAUSE, LIBELLES_PAUSE } from './temps';
import { useReglagesPause } from './useReglagesPause';
import { Panneau, Tuile, Tuiles } from './Visuels';

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
        <Panneau titre="Ta partie" Icone={Gamepad2} ton="purple" id="param-partie">
          <p className="lt-puces-info">
            <span className="lt-chip lt-chip--bon">
              Mode : {NOMS_MODES[vue.partie.mode] ?? vue.partie.mode}
            </span>
            <span className="lt-chip">
              Faillite : {vue.partie.faillitePossible ? 'possible' : 'désactivée'}
            </span>
            {vue.partie.bacASable ? (
              <span className="lt-chip">argent illimité, pas de faillite</span>
            ) : null}
            <span className="lt-chip">Réglages fixés au départ</span>
          </p>
          <Tuiles label="Difficulté">
            <Tuile
              Icone={Settings2}
              valeur={`× ${vue.partie.difficulte.capitalDepart}`}
              libelle="Budget de départ"
              ton="green"
            />
            <Tuile
              Icone={Settings2}
              valeur={`× ${vue.partie.difficulte.agressiviteRivaux}`}
              libelle="Agressivité des rivaux"
              ton="red"
            />
            <Tuile
              Icone={Settings2}
              valeur={`× ${vue.partie.difficulte.volatiliteMarche}`}
              libelle="Volatilité du marché"
              ton="orange"
            />
            <Tuile
              Icone={Settings2}
              valeur={`+ ${Math.round(vue.partie.difficulte.bonusTresorerieRivaux * 100)} %`}
              libelle="Bonus de trésorerie des rivaux"
              ton="pink"
            />
            <Tuile
              Icone={Settings2}
              valeur={`× ${vue.partie.frequenceEvenements}`}
              libelle="Fréquence des événements"
              ton="teal"
            />
          </Tuiles>
        </Panneau>
      ) : null}

      <Panneau titre="Auto-pauses" Icone={PauseCircle} ton="orange" id="param-pauses">
        <p className="lt-sous-titre">
          Le temps s’arrête quand l’un de ces événements survient ({actives} sur{' '}
          {CATEGORIES_PAUSE.length} actifs).
        </p>
        <fieldset className="lt-interrupteurs">
          <legend className="visually-hidden">Mettre le jeu en pause quand…</legend>
          {CATEGORIES_PAUSE.map((c) => (
            <label key={c} className={`lt-interrupteur${reglages[c] ? ' is-actif' : ''}`}>
              <input
                type="checkbox"
                checked={reglages[c]}
                onChange={(e) => basculer(c, e.target.checked)}
              />
              <span className="lt-interrupteur__bouton" aria-hidden="true" />
              {LIBELLES_PAUSE[c]}
            </label>
          ))}
        </fieldset>
        <Button type="button" onClick={reinitialiser}>
          Rétablir les réglages par défaut
        </Button>
      </Panneau>

      <Panneau titre="Raccourcis clavier" Icone={Keyboard} ton="teal" id="param-touches">
        <ul className="lt-touches">
          {RACCOURCIS.map((r) => (
            <li key={r.touche}>
              <kbd>{r.touche}</kbd>
              <span>{r.action}</span>
            </li>
          ))}
        </ul>
      </Panneau>
    </section>
  );
}
