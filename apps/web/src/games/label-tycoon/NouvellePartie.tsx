import { useState } from 'react';
import {
  DIFFICULTY_BOUNDS,
  DIFFICULTY_PRESETS,
  EVENT_RATE_BOUNDS,
  ORDRE_SCENARIOS,
  SCENARIOS,
  texteCondition,
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

export interface OptionsBacASable {
  argentIllimite: boolean;
  faillite: boolean;
  frequence: number;
}

export const BAC_A_SABLE_PAR_DEFAUT: OptionsBacASable = {
  argentIllimite: true,
  faillite: true,
  frequence: 1,
};

/** Réglages envoyés au moteur pour le mode et les options choisis. */
export function configDepart(
  mode: 'carriere' | 'bac-a-sable' | 'scenario',
  difficulty: DifficultySettings,
  bac: OptionsBacASable,
  scenarioId?: string,
): GameConfig {
  if (mode === 'scenario')
    return { ...defaultConfig('normal', 'scenario'), difficulty, scenarioId: scenarioId ?? '' };
  if (mode === 'carriere') return { ...defaultConfig('normal', 'carriere'), difficulty };
  return {
    ...defaultConfig('normal', 'bac-a-sable'),
    difficulty,
    ...(bac.argentIllimite ? { sandbox: true } : {}),
    ...(bac.faillite ? { bankruptcyOff: true } : {}),
    ...(bac.frequence !== 1 ? { eventRate: bac.frequence } : {}),
  };
}

/** Écran de départ : mode, difficulté, graine (facultative), puis lancement de la partie. */
export function NouvellePartie() {
  const { nouvellePartie, etat } = useLabel();
  const [graine, setGraine] = useState('');
  const [reglages, setReglages] = useState<DifficultySettings>({
    ...DIFFICULTY_PRESETS.normal,
  });
  const [avance, setAvance] = useState(false);
  const [mode, setMode] = useState<'carriere' | 'bac-a-sable' | 'scenario'>('carriere');
  const [scenarioId, setScenarioId] = useState(ORDRE_SCENARIOS[0] ?? '');
  const [bac, setBac] = useState<OptionsBacASable>(BAC_A_SABLE_PAR_DEFAUT);
  const config = configDepart(mode, reglages, bac, scenarioId);
  const probleme = validateConfig(config);
  const preset = presetCorrespondant(reglages);

  return (
    <div className="label-start">
      <h2 className="label-start__title">Fonde ton label</h2>
      <p>Une partie, un monde généré : repère des talents, signe-les, sors des hits.</p>
      <fieldset className="label-field">
        <legend>Mode de jeu</legend>
        <label className="label-field--check">
          <input
            type="radio"
            name="mode"
            checked={mode === 'carriere'}
            onChange={() => setMode('carriere')}
          />
          <span>
            <strong>Carrière</strong> — devenir la première major du pays.
          </span>
        </label>
        <label className="label-field--check">
          <input
            type="radio"
            name="mode"
            checked={mode === 'scenario'}
            onChange={() => setMode('scenario')}
          />
          <span>
            <strong>Scénarios</strong> — un défi précis, un monde fixe, un temps limité.
          </span>
        </label>
        <label className="label-field--check">
          <input
            type="radio"
            name="mode"
            checked={mode === 'bac-a-sable'}
            onChange={() => setMode('bac-a-sable')}
          />
          <span>
            <strong>Bac à sable</strong> — argent illimité et tous les réglages en main.
          </span>
        </label>
      </fieldset>
      {mode === 'scenario' ? (
        <fieldset className="label-field">
          <legend>Scénario</legend>
          {ORDRE_SCENARIOS.map((id) => {
            const def = SCENARIOS[id];
            if (!def) return null;
            return (
              <label key={id} className="label-field--check">
                <input
                  type="radio"
                  name="scenario"
                  checked={scenarioId === id}
                  onChange={() => setScenarioId(id)}
                />
                <span>
                  <strong>{def.titre}</strong> — {def.description}
                  <small> Objectif : {def.objectifs.map(texteCondition).join(' ; ')}.</small>
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}
      {mode === 'bac-a-sable' ? (
        <fieldset className="label-field">
          <legend>Réglages du bac à sable</legend>
          <label className="label-field--check">
            <input
              type="checkbox"
              checked={bac.argentIllimite}
              onChange={(e) => setBac({ ...bac, argentIllimite: e.target.checked })}
            />
            Argent illimité
          </label>
          <label className="label-field--check">
            <input
              type="checkbox"
              checked={bac.faillite}
              onChange={(e) => setBac({ ...bac, faillite: e.target.checked })}
            />
            Faillite désactivée
          </label>
          <label className="label-field">
            Fréquence des événements <small>(1 = normal, 0 = aucun)</small>
            <input
              type="number"
              min={EVENT_RATE_BOUNDS.min}
              max={EVENT_RATE_BOUNDS.max}
              step={0.1}
              value={bac.frequence}
              onChange={(e) => setBac({ ...bac, frequence: Number(e.target.value) })}
            />
          </label>
          <p>Le temps peut aussi s’accélérer jusqu’à ×16 pendant la partie.</p>
        </fieldset>
      ) : null}
      {mode !== 'scenario' ? (
        <>
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
        </>
      ) : null}
      {probleme ? (
        <p role="alert" className="label-error">
          {probleme}
        </p>
      ) : null}
      {mode !== 'scenario' ? (
        <label className="label-start__field">
          Graine (facultatif)
          <input
            value={graine}
            onChange={(e) => setGraine(e.target.value)}
            placeholder="une même graine donne le même monde"
            maxLength={40}
          />
        </label>
      ) : null}
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
