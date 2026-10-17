import { stableStringify } from '../hash/canonical';
import type { Seed } from '../rng/seed';
import { cloneJson } from './clone';
import { openStreams } from './context';
import {
  type EngineState,
  type RunResult,
  type Simulation,
  type SimulationDefinition,
  createSimulation,
} from './simulation';
import type { Signal, TickContext } from './types';

/**
 * Actions du joueur : des **commandes typées** validées puis appliquées par des fonctions pures.
 * Chaque action acceptée est inscrite dans un **journal** `{ tick, action }`. Le journal et la
 * graine suffisent à reconstruire exactement la partie (replay).
 */

export interface Action {
  readonly type: string;
}

/**
 * Raison d'un refus. `code` est stable (testé, traduit par l'interface), `params` fournit les
 * variables du message. Aucun texte ici : les chaînes affichées vivent dans les fichiers de textes.
 */
export interface Rejection {
  code: string;
  params?: Readonly<Record<string, string | number>>;
}

export const reject = (code: string, params?: Rejection['params']): Rejection =>
  params === undefined ? { code } : { code, params };

export interface ActionHandler<G, A extends Action, S extends Signal> {
  /** Vérifie que l'action est autorisée dans l'état courant. `null` si tout est bon. Ne modifie rien. */
  validate(data: G, action: A, ctx: TickContext<S>): Rejection | null;
  /** Applique l'action en modifiant `data` (ou en renvoyant un remplaçant). Appelée après `validate`. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  apply(data: G, action: A, ctx: TickContext<S>): G | void;
}

export type ActionHandlers<G, A extends Action, S extends Signal> = {
  [K in A['type']]: ActionHandler<G, Extract<A, { type: K }>, S>;
};

export interface GameDefinition<
  G,
  A extends Action,
  S extends Signal = Signal,
> extends SimulationDefinition<G, S> {
  readonly actions: ActionHandlers<G, A, S>;
}

export interface JournalEntry<A extends Action> {
  /** Nombre de semaines déjà simulées quand l'action a été jouée (elle précède la semaine `tick`). */
  tick: number;
  action: A;
}

/** Une partie : l'état du moteur et le journal des actions acceptées. */
export interface Session<G, A extends Action> {
  engine: EngineState<G>;
  journal: JournalEntry<A>[];
}

export type DispatchResult<G, A extends Action, S extends Signal> =
  | { ok: true; session: Session<G, A>; signals: S[] }
  | { ok: false; session: Session<G, A>; rejection: Rejection };

export interface ReplayOptions<G> {
  /**
   * Appelée à chaque semaine (y compris la semaine 0), une fois les actions de cette semaine
   * appliquées. Sert aux points de contrôle. L'état est en lecture seule : ne pas le modifier.
   */
  onTick?: (engine: Readonly<EngineState<G>>) => void;
}

export class ReplayError extends Error {
  readonly index: number;
  readonly rejection: Rejection | null;
  constructor(message: string, index: number, rejection: Rejection | null = null) {
    super(message);
    this.name = 'ReplayError';
    this.index = index;
    this.rejection = rejection;
  }
}

export interface Game<G, A extends Action, S extends Signal = Signal> {
  readonly simulation: Simulation<G, S>;
  newSession(seed: Seed, data: G): Session<G, A>;
  /** Joue une action. L'état reçu n'est jamais modifié ; une action refusée n'est pas journalisée. */
  dispatch(session: Session<G, A>, action: A): DispatchResult<G, A, S>;
  /** Avance de `ticks` semaines (ou jusqu'à une interruption). */
  advance(
    session: Session<G, A>,
    ticks: number,
    options?: { stopOnInterrupt?: boolean },
  ): { session: Session<G, A> } & Pick<RunResult<G, S>, 'signals' | 'ticksRun' | 'interrupted'>;
  /**
   * Reconstruit une partie : applique les actions du journal à leur semaine et simule jusqu'à
   * `untilTick`. Le résultat est identique, au bit près, à la partie d'origine.
   * @throws ReplayError si le journal est mal ordonné ou contient une action désormais refusée.
   */
  replay(
    seed: Seed,
    initialData: G,
    journal: readonly JournalEntry<A>[],
    untilTick: number,
    options?: ReplayOptions<G>,
  ): Session<G, A>;
}

export function createGame<G, A extends Action, S extends Signal = Signal>(
  definition: GameDefinition<G, A, S>,
): Game<G, A, S> {
  const simulation = createSimulation<G, S>(definition);
  const streamNames = new Set(definition.streams);

  /** Applique une action sur `engine` (qui nous appartient). Renvoie le refus éventuel. */
  function applyInPlace(engine: EngineState<G>, action: A, signals: S[]): Rejection | null {
    const handler = (definition.actions as Record<string, ActionHandler<G, A, S> | undefined>)[
      action.type
    ];
    if (!handler) return reject('action-inconnue', { type: action.type });
    const { ctx, commit } = openStreams<S>(streamNames, engine.streams, engine.tick, signals);
    const problem = handler.validate(engine.data, action, ctx);
    if (problem) return problem;
    const replacement = handler.apply(engine.data, action, ctx);
    if (replacement !== undefined) engine.data = replacement;
    engine.streams = commit(definition.streams);
    return null;
  }

  return {
    simulation,

    newSession(seed, data) {
      return { engine: simulation.newState(seed, data), journal: [] };
    },

    dispatch(session, action) {
      // Une action doit être de la donnée JSON simple : c'est ce qui rend le journal rejouable
      stableStringify(action);
      const engine = cloneJson(session.engine);
      const signals: S[] = [];
      const rejection = applyInPlace(engine, action, signals);
      if (rejection) return { ok: false, session, rejection };
      const journal = [
        ...session.journal,
        { tick: session.engine.tick, action: cloneJson(action) },
      ];
      return { ok: true, session: { engine, journal }, signals };
    },

    advance(session, ticks, options) {
      const result = simulation.run(session.engine, ticks, options);
      return {
        session: { engine: result.state, journal: session.journal },
        signals: result.signals,
        ticksRun: result.ticksRun,
        interrupted: result.interrupted,
      };
    },

    replay(seed, initialData, journal, untilTick, options: ReplayOptions<G> = {}) {
      if (!Number.isInteger(untilTick) || untilTick < 0) {
        throw new RangeError(`Semaine cible invalide : ${String(untilTick)}`);
      }
      let previousTick = 0;
      journal.forEach((entry, index) => {
        if (entry.tick < previousTick) {
          throw new ReplayError(`Journal mal ordonné à l'entrée ${index}`, index);
        }
        if (entry.tick > untilTick) {
          throw new ReplayError(`L'entrée ${index} dépasse la semaine cible`, index);
        }
        previousTick = entry.tick;
      });

      const engine = simulation.newState(seed, initialData);
      const accepted: JournalEntry<A>[] = [];
      let next = 0;
      const drain = (): void => {
        while (next < journal.length && (journal[next] as JournalEntry<A>).tick === engine.tick) {
          const entry = journal[next] as JournalEntry<A>;
          const rejection = applyInPlace(engine, entry.action, []);
          if (rejection) {
            throw new ReplayError(
              `Action refusée au rejeu (${rejection.code}) à l'entrée ${next}`,
              next,
              rejection,
            );
          }
          accepted.push({ tick: entry.tick, action: cloneJson(entry.action) });
          next += 1;
        }
      };
      drain();
      options.onTick?.(engine);
      while (engine.tick < untilTick) {
        simulation.runOwned(engine, 1);
        drain();
        options.onTick?.(engine);
      }
      return { engine, journal: accepted };
    },
  };
}
