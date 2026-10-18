import { useState } from 'react';
import {
  DIFFICULTY_BOUNDS,
  DIFFICULTY_PRESETS,
  defaultConfig,
  validateConfig,
} from '@tycoon/label-tycoon';
import type { DifficultyPreset, DifficultySettings, GameConfig } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

export const PRESETS: readonly { id: DifficultyPreset; nom: string; description: string }[] = [
  {
    id: 'facile',
    nom: 'Facile',
    description: 'Plus de budget, des rivaux et un marché plus calmes.',
  },
  { id: 'normal', nom: 'Normal', description: 'L’équilibre prévu par le jeu.' },
  {
    id: 'difficile',
    nom: 'Difficile',
    description: 'Moitié moins de budget, rivaux agressifs, marché agité et rivaux mieux dotés.',
  },
];

/** Curseurs de difficulté, avec leur explication : le joueur sait toujours ce qu'il règle. */
export const CURSEURS: readonly {
  cle: keyof DifficultySettings;
  nom: string;
  aide: string;
  pas: number;
}[] = [
  { cle: 'startingCash', nom: 'Budget de départ', aide: '× le budget normal', pas: 0.1 },
  {
    cle: 'rivalAggression',
    nom: 'Agressivité des rivaux',
    aide: '× la vitesse de repérage et de signature',
    pas: 0.05,
  },
  {
    cle: 'marketVolatility',
    nom: 'Volatilité du marché',
    aide: '× l’amplitude des variations',
    pas: 0.05,
  },
  {
    cle: 'rivalCashBonus',
    nom: 'Bonus de trésorerie des rivaux',
    aide: 'la seule entorse à « les rivaux jouent avec les mêmes règles que toi »',
    pas: 0.05,
  },
];

/** Préréglage qui correspond exactement aux réglages, ou `null` s'ils sont personnalisés. */
export function presetCorrespondant(d: DifficultySettings): DifficultyPreset | null {
  const trouve = (Object.keys(DIFFICULTY_PRESETS) as DifficultyPreset[]).find((id) =>
    (Object.keys(d) as (keyof DifficultySettings)[]).every(
      (k) => DIFFICULTY_PRESETS[id][k] === d[k],
    ),
  );
  return trouve ?? null;
}

/** Écran de départ : choisir une graine (facultatif), la difficulté, et lancer une carrière. */
export function NouvellePartie() {
  const { nouvellePartie, etat } = useLabel();
  const [graine, setGraine] = useState('');
  const [reglages, setReglages] = useState<DifficultySettings>({
    ...DIFFICULTY_PRESETS.normal,
  });
  const [avance, setAvance] = useState(false);
  const config: GameConfig = { ...defaultConfig('normal'), difficulty: reglages };
  const probleme = validateConfig(config);
  const preset = presetCorrespondant(reglages);

  return (
    <div className="label-start">
      <h2 className="label-start__title">Fonde ton label</h2>
      <p>Une partie, un monde généré : repère des talents, signe-les, sors des hits.</p>
      <fieldset className="label-field">
        <legend>Difficulté</legend>
        {PRESETS.map((p) => (
          <label key={p.id} className="label-field--check">
            <input
              type="radio"
              name="difficulte"
              checked={preset === p.id}
              onChange={() => setReglages({ ...DIFFICULTY_PRESETS[p.id] })}
            />
            <span>
              <strong>{p.nom}</strong> — {p.description}
            </span>
          </label>
        ))}
        {preset === null ? <p>Réglages personnalisés.</p> : null}
      </fieldset>
      <details open={avance} onToggle={(e) => setAvance(e.currentTarget.open)}>
        <summary>Réglages avancés</summary>
        {CURSEURS.map((c) => (
          <label key={c.cle} className="label-field">
            {c.nom} <small>({c.aide})</small>
            <input
              type="number"
              min={DIFFICULTY_BOUNDS[c.cle].min}
              max={DIFFICULTY_BOUNDS[c.cle].max}
              step={c.pas}
              value={reglages[c.cle]}
              onChange={(e) => setReglages({ ...reglages, [c.cle]: Number(e.target.value) })}
            />
          </label>
        ))}
      </details>
      {probleme ? (
        <p role="alert" className="label-error">
          {probleme}
        </p>
      ) : null}
      <label className="label-start__field">
        Graine (facultatif)
        <input
          value={graine}
          onChange={(e) => setGraine(e.target.value)}
          placeholder="une même graine donne le même monde"
          maxLength={40}
        />
      </label>
      <Button
        type="button"
        tone="green"
        size="lg"
        disabled={etat !== 'pret' || probleme !== null}
        onClick={() => void nouvellePartie(graine.trim() || Date.now().toString(36), config)}
      >
        Nouvelle partie
      </Button>
    </div>
  );
}
