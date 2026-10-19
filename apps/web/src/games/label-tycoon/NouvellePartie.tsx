import { useState } from 'react';
import {
  DIFFICULTY_BOUNDS,
  DIFFICULTY_PRESETS,
  EVENT_RATE_BOUNDS,
  GRAINE_TUTORIEL,
  configTutoriel,
  DEFI_SEMAINES,
  configDefi,
  dateDuDefi,
  semaineDuDefi,
  contrainteDeLaSemaine,
  CONTRAINTES,
  graineDuDefi,
  ORDRE_SCENARIOS,
  SCENARIOS,
  texteCondition,
  defaultConfig,
  validateConfig,
} from '@tycoon/label-tycoon';
import type { DifficultyPreset, DifficultySettings, GameConfig } from '@tycoon/label-tycoon';
import {
  CheckCircle2,
  Dices,
  Disc3,
  Feather,
  Flame,
  Gamepad2,
  Gauge,
  GraduationCap,
  type LucideIcon,
  Mic2,
  Play,
  SlidersHorizontal,
  Sun,
  Swords,
  Target,
} from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { lireMeilleurScore } from './defi';
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

export type ModeDepart =
  'carriere' | 'bac-a-sable' | 'scenario' | 'defi' | 'defi-hebdo' | 'tutoriel';

/** Réglages envoyés au moteur pour le mode et les options choisis. */
export function configDepart(
  mode: ModeDepart,
  difficulty: DifficultySettings,
  bac: OptionsBacASable,
  scenarioId?: string,
): GameConfig {
  if (mode === 'tutoriel') return configTutoriel();
  if (mode === 'defi') return configDefi(dateDuDefi(new Date()));
  if (mode === 'defi-hebdo') return configDefi(semaineDuDefi(new Date()));
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

/** Noms de label fictifs proposés par le dé. */
export const NOMS_DE_LABEL = [
  'Néon Dust',
  'Velours Records',
  'Minuit Pile',
  'Onde Courte',
  'Bitume Doré',
  'Sirène Club',
  'Écho Nord',
  'Lune Rouge',
  'Polaroïd Musique',
  'Nuit Blanche',
  'Basse Fréquence',
  'Cœur de Pirate Sound',
] as const;

interface CarteMode {
  id: ModeDepart;
  titre: string;
  accroche: string;
  Icone: LucideIcon;
  couleur: 'green' | 'purple' | 'orange' | 'blue' | 'pink' | 'teal';
  ruban?: string;
}

const MODES: readonly CarteMode[] = [
  {
    id: 'tutoriel',
    titre: 'Tutoriel',
    accroche: '« Ton premier signataire » : guidé pas à pas, 15 à 20 minutes.',
    Icone: GraduationCap,
    couleur: 'green',
    ruban: 'Nouveau ? Commence ici',
  },
  {
    id: 'carriere',
    titre: 'Carrière',
    accroche: 'Du home-studio à la première major du pays, puis bien au-delà.',
    Icone: Mic2,
    couleur: 'purple',
    ruban: 'Le jeu complet',
  },
  {
    id: 'scenario',
    titre: 'Scénarios',
    accroche: 'Un objectif précis, un monde fixe, un temps limité.',
    Icone: Target,
    couleur: 'orange',
  },
  {
    id: 'defi',
    titre: 'Défi du jour',
    accroche: `Le même monde pour tous, ${DEFI_SEMAINES} semaines, un score.`,
    Icone: Sun,
    couleur: 'blue',
  },
  {
    id: 'defi-hebdo',
    titre: 'Défi de la semaine',
    accroche: 'Un monde pour sept jours, avec une contrainte spéciale.',
    Icone: Swords,
    couleur: 'pink',
  },
  {
    id: 'bac-a-sable',
    titre: 'Bac à sable',
    accroche: 'Argent illimité, tous les réglages en main.',
    Icone: Gamepad2,
    couleur: 'teal',
  },
];

const ICONES_DIFFICULTE: Readonly<Record<DifficultyPreset, LucideIcon>> = {
  facile: Feather,
  normal: Gauge,
  difficile: Flame,
};

const euros = (n: number): string => `${n.toLocaleString('fr-FR')} €`;

/** Écran de départ : choix du mode en grandes cartes, puis réglages de la partie et lancement. */
export function NouvellePartie() {
  const { nouvellePartie, envoyer, etat } = useLabel();
  const [graine, setGraine] = useState('');
  const [nom, setNom] = useState('');
  const [reglages, setReglages] = useState<DifficultySettings>({
    ...DIFFICULTY_PRESETS.normal,
  });
  const [avance, setAvance] = useState(false);
  const [mode, setMode] = useState<ModeDepart>('carriere');
  const [scenarioId, setScenarioId] = useState(ORDRE_SCENARIOS[0] ?? '');
  const [bac, setBac] = useState<OptionsBacASable>(BAC_A_SABLE_PAR_DEFAUT);
  const config = configDepart(mode, reglages, bac, scenarioId);
  const probleme = validateConfig(config);
  const preset = presetCorrespondant(reglages);
  const carte = MODES.find((m) => m.id === mode) ?? MODES[1];
  const libre = mode === 'carriere' || mode === 'bac-a-sable';
  const aujourdhui = dateDuDefi(new Date());
  const semaine = semaineDuDefi(new Date());
  const contrainte = CONTRAINTES[contrainteDeLaSemaine(semaine).id];

  const lancer = async () => {
    const r = await nouvellePartie(
      mode === 'defi' || mode === 'defi-hebdo'
        ? graineDuDefi(config.defiDate ?? '')
        : mode === 'tutoriel'
          ? GRAINE_TUTORIEL
          : graine.trim() || Date.now().toString(36),
      config,
    );
    const nomChoisi = nom.trim();
    if (r.type === 'vue' && nomChoisi && mode !== 'tutoriel')
      await envoyer({ type: 'action', action: { type: 'renommer-label', nom: nomChoisi } });
  };

  return (
    <div className="label-start lt-depart">
      <header className="lt-depart__entete">
        <span className="lt-depart__vinyle" aria-hidden="true">
          <Disc3 size={56} strokeWidth={2} />
        </span>
        <div>
          <h2 className="label-start__title">Fonde ton label</h2>
          <p>Repère des talents, signe-les, sors des hits… et bâtis un empire.</p>
        </div>
      </header>

      <div className="lt-depart__corps">
        <div>
          <h3 className="lt-depart__etape" id="lt-modes-titre">
            <span aria-hidden="true">1</span> Choisis ton mode
          </h3>
          <fieldset className="lt-modes" aria-labelledby="lt-modes-titre">
            {MODES.map((m) => (
              <label
                key={m.id}
                className={`lt-mode lt-mode--${m.couleur}${mode === m.id ? ' is-choisi' : ''}`}
              >
                <input
                  type="radio"
                  name="mode"
                  className="lt-radio"
                  checked={mode === m.id}
                  onChange={() => setMode(m.id)}
                />
                {m.ruban ? <span className="lt-mode__ruban">{m.ruban}</span> : null}
                <span className="lt-mode__icone" aria-hidden="true">
                  <m.Icone size={30} strokeWidth={2.4} />
                </span>
                <strong className="lt-mode__titre">{m.titre}</strong>
                <span className="lt-mode__accroche">{m.accroche}</span>
                {mode === m.id ? (
                  <CheckCircle2 className="lt-mode__coche" aria-hidden="true" size={26} />
                ) : null}
              </label>
            ))}
          </fieldset>
        </div>

        <section className="lt-reglages" aria-labelledby="lt-reglages-titre">
          <h3 id="lt-reglages-titre" className="lt-depart__etape">
            <span aria-hidden="true">2</span> {carte?.titre}
          </h3>

          {mode === 'tutoriel' ? (
            <p className="lt-reglages__texte">
              Un monde préparé pour apprendre : repérer, négocier, produire, sortir un titre. Les
              rivaux te laissent souffler les premières semaines, et tu peux quitter le tutoriel à
              tout moment.
            </p>
          ) : null}

          {mode !== 'tutoriel' ? (
            <label className="lt-champ">
              <span>Nom de ton label</span>
              <span className="lt-champ__ligne">
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Mon label"
                  maxLength={32}
                />
                <button
                  type="button"
                  className="lt-de"
                  title="Proposer un nom au hasard"
                  aria-label="Proposer un nom au hasard"
                  onClick={() =>
                    setNom(NOMS_DE_LABEL[Math.floor(Math.random() * NOMS_DE_LABEL.length)] ?? '')
                  }
                >
                  <Dices aria-hidden="true" size={22} />
                </button>
              </span>
            </label>
          ) : null}

          {mode === 'defi' ? (
            <p className="lt-reglages__texte">
              Défi du {aujourdhui}. Un seul monde par jour : rejoue autant que tu veux, seul ton
              meilleur score compte.
              {lireMeilleurScore(aujourdhui) !== null
                ? ` Ton meilleur score du jour : ${euros(lireMeilleurScore(aujourdhui) ?? 0)}.`
                : ''}
            </p>
          ) : null}
          {mode === 'defi-hebdo' ? (
            <p className="lt-reglages__texte">
              Défi de la semaine {semaine} : <strong>{contrainte.nom}</strong> —{' '}
              {contrainte.description}
              {lireMeilleurScore(semaine) !== null
                ? ` Ton meilleur score de la semaine : ${euros(lireMeilleurScore(semaine) ?? 0)}.`
                : ''}
            </p>
          ) : null}

          {mode === 'scenario' ? (
            <fieldset className="lt-choix-liste">
              <legend>Scénario</legend>
              {ORDRE_SCENARIOS.map((id) => {
                const def = SCENARIOS[id];
                if (!def) return null;
                return (
                  <label key={id} className={`lt-choix${scenarioId === id ? ' is-choisi' : ''}`}>
                    <input
                      type="radio"
                      name="scenario"
                      className="lt-radio"
                      checked={scenarioId === id}
                      onChange={() => setScenarioId(id)}
                    />
                    <strong>{def.titre}</strong>
                    <span>{def.description}</span>
                    <small>Objectif : {def.objectifs.map(texteCondition).join(' ; ')}.</small>
                  </label>
                );
              })}
            </fieldset>
          ) : null}

          {libre ? (
            <fieldset className="lt-difficultes">
              <legend>Difficulté</legend>
              {PRESETS.map((p) => {
                const Icone = ICONES_DIFFICULTE[p.id];
                return (
                  <label
                    key={p.id}
                    className={`lt-difficulte${preset === p.id ? ' is-choisi' : ''}`}
                    title={p.description}
                  >
                    <input
                      type="radio"
                      name="difficulte"
                      className="lt-radio"
                      checked={preset === p.id}
                      onChange={() => setReglages({ ...DIFFICULTY_PRESETS[p.id] })}
                    />
                    <Icone aria-hidden="true" size={22} />
                    <strong>{p.nom}</strong>
                    <span className="lt-difficulte__aide">{p.description}</span>
                  </label>
                );
              })}
              {preset === null ? (
                <p className="lt-reglages__texte">Réglages personnalisés.</p>
              ) : null}
            </fieldset>
          ) : null}

          {mode === 'bac-a-sable' ? (
            <fieldset className="lt-choix-liste">
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
              <p className="lt-reglages__texte">Le temps peut s’accélérer jusqu’à ×16.</p>
            </fieldset>
          ) : null}

          {libre ? (
            <details
              className="lt-avance"
              open={avance}
              onToggle={(e) => setAvance(e.currentTarget.open)}
            >
              <summary>
                <SlidersHorizontal aria-hidden="true" size={18} /> Réglages avancés
              </summary>
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
              <label className="label-start__field label-field">
                Graine (facultatif)
                <input
                  value={graine}
                  onChange={(e) => setGraine(e.target.value)}
                  placeholder="une même graine donne le même monde"
                  maxLength={40}
                />
              </label>
            </details>
          ) : null}

          {probleme ? (
            <p role="alert" className="label-error">
              {probleme}
            </p>
          ) : null}

          <Button
            type="button"
            tone="green"
            size="lg"
            className="lt-depart__go"
            disabled={etat !== 'pret' || probleme !== null}
            onClick={() => void lancer()}
          >
            <Play aria-hidden="true" size={22} strokeWidth={3} /> Nouvelle partie
          </Button>
        </section>
      </div>
    </div>
  );
}
