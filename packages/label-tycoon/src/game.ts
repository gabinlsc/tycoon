import {
  type Seed,
  type Session,
  createEventEngine,
  createGame,
  emptyEventsState,
  money,
} from '@tycoon/core';
import { type LabelAction, renameLabel } from './actions';
import { DIFFICULTY_BOUNDS, DIFFICULTY_PRESETS, EVENTS, SANDBOX_CASH, START } from './balance';
import type { DifficultyPreset, DifficultySettings, GameConfig, GameMode } from './config';
import { type LabelSignal, buildPipeline } from './pipeline';
import type { LabelState } from './state';

/** Un flux aléatoire par système : ajouter un tirage dans l'un ne décale pas les autres. */
export const LABEL_STREAMS = [
  'marche',
  'reperage',
  'contrats',
  'production',
  'sorties',
  'evenements',
  'rivaux',
  'noms',
  'finances',
  'personnel',
  'tournees',
] as const;

export type LabelSession = Session<LabelState, LabelAction>;

/** Moteur d'événements du jeu. Le contenu (les événements eux-mêmes) s'ajoute dans `content/`. */
export const eventEngine = createEventEngine<LabelState>({
  events: [],
  getState: (state) => state.events,
  stream: 'evenements',
  chance: EVENTS.chancePerWeek,
  maxPerTick: EVENTS.maxPerWeek,
  maxPending: EVENTS.maxPending,
  maxChainDepth: EVENTS.maxChainDepth,
  historyLimit: EVENTS.historyLimit,
  phaseNames: { due: 'echeances-evenements', draw: 'tirage-evenements' },
});

export const labelGame = createGame<LabelState, LabelAction, LabelSignal>({
  streams: LABEL_STREAMS,
  phases: buildPipeline({
    'echeances-evenements': eventEngine.duePhase,
    'tirage-evenements': eventEngine.phase,
  }),
  actions: {
    ...eventEngine.actionHandlers,
    'renommer-label': renameLabel,
  },
});

export function defaultConfig(
  preset: DifficultyPreset = 'normal',
  mode: GameMode = 'carriere',
): GameConfig {
  return { mode, difficulty: { ...DIFFICULTY_PRESETS[preset] } };
}

/** Message d'erreur si des réglages sortent des bornes, sinon `null`. */
export function validateConfig(config: GameConfig): string | null {
  for (const key of Object.keys(DIFFICULTY_BOUNDS) as Array<keyof DifficultySettings>) {
    const value = config.difficulty[key];
    const { min, max } = DIFFICULTY_BOUNDS[key];
    if (!Number.isFinite(value) || value < min || value > max) {
      return `Réglage « ${key} » hors bornes (${min} à ${max}) : ${String(value)}`;
    }
  }
  return null;
}

/** État initial d'une partie pour des réglages donnés (sans aucun tirage au sort). */
export function initialState(config: GameConfig): LabelState {
  const problem = validateConfig(config);
  if (problem) throw new RangeError(problem);
  const cash = config.sandbox
    ? SANDBOX_CASH
    : money.applyRate(START.cash, config.difficulty.startingCash);
  return {
    config: structuredConfig(config),
    label: {
      nom: START.defaultLabelName,
      tier: 'home-studio',
      tresorerie: cash,
      reputation: START.reputation,
    },
    events: emptyEventsState(),
    nextId: 1,
  };
}

/** Copie des réglages sans référence partagée avec l'appelant. */
function structuredConfig(config: GameConfig): GameConfig {
  const copy: GameConfig = { mode: config.mode, difficulty: { ...config.difficulty } };
  if (config.scenarioId !== undefined) copy.scenarioId = config.scenarioId;
  if (config.sandbox !== undefined) copy.sandbox = config.sandbox;
  return copy;
}

/** Nouvelle partie. Même graine et mêmes réglages : même partie, au bit près. */
export function newGame(seed: Seed, config: GameConfig = defaultConfig()): LabelSession {
  return labelGame.newSession(seed, initialState(config));
}
