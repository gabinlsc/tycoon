import { Rng } from '../rng/rng';
import type { RngState } from '../rng/xoshiro';
import type { Seed } from '../rng/seed';
import { type RngStreams, createStreams } from '../rng/streams';
import { cloneJson } from './clone';

/**
 * Boucle de simulation en ticks (1 tick = 1 semaine).
 *
 * Un tick est un **pipeline de phases** nommées, exécutées dans un ordre fixe. Chaque phase lit
 * et modifie les données du jeu et peut tirer au hasard dans un flux nommé. À la fin du tick, les
 * flux utilisés sont réécrits dans l'état. Aucune horloge, aucun hasard global : la même entrée
 * donne toujours le même résultat.
 */

/** Information remontée par la simulation à l'interface (notification, demande de pause…). */
export interface Signal {
  kind: string;
  /** Si vrai, la boucle rapide s'arrête à la fin du tick (auto-pause). */
  interrupt?: boolean;
  payload?: Readonly<Record<string, unknown>>;
}

export interface TickContext<S extends Signal = Signal> {
  /** Indice de la semaine simulée (0 pour la première semaine de la partie). */
  readonly tick: number;
  /** Générateur du flux nommé. Il avance, et son état est réécrit dans l'état de jeu en fin de tick. */
  rng(stream: string): Rng;
  /** Émet un signal pour l'interface. */
  emit(signal: S): void;
}

export interface Phase<G, S extends Signal = Signal> {
  readonly name: string;
  /**
   * Exécuter la phase seulement toutes les `every` semaines (par exemple 4 pour une phase
   * mensuelle), à la fin de la semaine dont le numéro (à partir de 1) est un multiple.
   */
  readonly every?: number;
  /** Décalage de la périodicité (0 par défaut). */
  readonly offset?: number;
  /**
   * Modifie `data` en place, ou renvoie un remplaçant. `void` est voulu : une phase qui mute
   * simplement les données n'a pas à écrire `return undefined`.
   */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  run(data: G, ctx: TickContext<S>): G | void;
}

export interface EngineState<G> {
  /** Nombre de semaines déjà simulées. */
  tick: number;
  seed: Seed;
  streams: RngStreams;
  data: G;
}

export interface SimulationDefinition<G, S extends Signal = Signal> {
  /** Noms des flux aléatoires, un par système. */
  readonly streams: readonly string[];
  readonly phases: readonly Phase<G, S>[];
}

export interface StepResult<G, S extends Signal = Signal> {
  state: EngineState<G>;
  signals: S[];
}

export interface RunResult<G, S extends Signal = Signal> extends StepResult<G, S> {
  ticksRun: number;
  /** Vrai si un signal d'interruption (auto-pause) a arrêté la boucle à la fin du dernier tick joué. */
  interrupted: boolean;
}

export interface Simulation<G, S extends Signal = Signal> {
  readonly definition: SimulationDefinition<G, S>;
  /** État initial pour une graine et des données de départ. */
  newState(seed: Seed, data: G): EngineState<G>;
  /** Avance d'une semaine sans modifier l'état reçu. */
  step(state: EngineState<G>): StepResult<G, S>;
  /** Avance de `ticks` semaines (ou jusqu'à un signal d'interruption). L'état reçu n'est pas modifié. */
  run(
    state: EngineState<G>,
    ticks: number,
    options?: { stopOnInterrupt?: boolean },
  ): RunResult<G, S>;
}

function isDue(phase: Phase<unknown>, weekNumber: number): boolean {
  const every = phase.every ?? 1;
  return weekNumber % every === (phase.offset ?? 0) % every;
}

export function createSimulation<G, S extends Signal = Signal>(
  definition: SimulationDefinition<G, S>,
): Simulation<G, S> {
  const streamNames = new Set(definition.streams);
  if (streamNames.size !== definition.streams.length)
    throw new RangeError('Noms de flux dupliqués');
  const phaseNames = new Set<string>();
  for (const phase of definition.phases) {
    if (phaseNames.has(phase.name)) throw new RangeError(`Phase dupliquée : ${phase.name}`);
    phaseNames.add(phase.name);
    if (phase.every !== undefined && (!Number.isInteger(phase.every) || phase.every < 1)) {
      throw new RangeError(`Périodicité invalide pour la phase ${phase.name}`);
    }
  }

  /** Avance d'un tick en modifiant `state` (qui nous appartient). */
  function advance(state: EngineState<G>, signals: S[]): void {
    const rngs = new Map<string, Rng>();
    const ctx: TickContext<S> = {
      tick: state.tick,
      rng(stream) {
        if (!streamNames.has(stream)) throw new RangeError(`Flux aléatoire inconnu : ${stream}`);
        let rng = rngs.get(stream);
        if (!rng) {
          rng = new Rng(state.streams[stream] as RngState);
          rngs.set(stream, rng);
        }
        return rng;
      },
      emit(signal) {
        signals.push(signal);
      },
    };

    const weekNumber = state.tick + 1;
    for (const phase of definition.phases) {
      if (!isDue(phase as Phase<unknown>, weekNumber)) continue;
      const replacement = phase.run(state.data, ctx);
      if (replacement !== undefined) state.data = replacement;
    }

    // Réécriture des seuls flux utilisés, dans l'ordre fixe de la définition (pas celui des appels)
    const nextStreams: Record<string, RngState> = { ...state.streams };
    for (const name of definition.streams) {
      const rng = rngs.get(name);
      if (rng) nextStreams[name] = rng.snapshot();
    }
    state.streams = nextStreams as RngStreams;
    state.tick += 1;
  }

  return {
    definition,

    newState(seed, data) {
      return {
        tick: 0,
        seed,
        streams: createStreams(seed, definition.streams),
        data: cloneJson(data),
      };
    },

    step(state) {
      const next = cloneJson(state);
      const signals: S[] = [];
      advance(next, signals);
      return { state: next, signals };
    },

    run(state, ticks, options = {}) {
      if (!Number.isInteger(ticks) || ticks < 0)
        throw new RangeError(`Nombre de ticks invalide : ${String(ticks)}`);
      // Une seule copie pour tout le lot : les ticks suivants travaillent sur cette copie privée
      const next = cloneJson(state);
      const signals: S[] = [];
      let ticksRun = 0;
      let interrupted = false;
      while (ticksRun < ticks) {
        const before = signals.length;
        advance(next, signals);
        ticksRun += 1;
        if (options.stopOnInterrupt && signals.slice(before).some((s) => s.interrupt)) {
          interrupted = true;
          break;
        }
      }
      return { state: next, signals, ticksRun, interrupted };
    },
  };
}
