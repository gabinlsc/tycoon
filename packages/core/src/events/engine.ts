import type { Phase } from '../sim';
import {
  type Consequence,
  type EventContext,
  type EventDef,
  type EventsState,
  type Vars,
} from './types';

export interface EventEngineOptions<G> {
  readonly events: readonly EventDef<G>[];
  /** Où se trouve l'état des événements dans les données du jeu. */
  readonly getState: (data: G) => EventsState;
  /** Flux aléatoire utilisé (doit être déclaré dans la simulation). */
  readonly stream?: string;
  /** Nombre maximal d'événements par semaine. */
  readonly maxPerTick?: number;
  /** Probabilité d'en tenter un chaque semaine (constante ou fonction de l'état). */
  readonly chance: number | ((data: G, tick: number) => number);
  /** Taille maximale de l'historique conservé. */
  readonly historyLimit?: number;
  /** Nom de la phase dans le pipeline. */
  readonly phaseName?: string;
}

export interface EventEngine<G> {
  /** Phase à insérer dans le pipeline de la simulation. */
  readonly phase: Phase<G>;
  /** Événements éligibles à la semaine `tick` (pour l'interface, le débogage et les tests). */
  eligible(data: G, tick: number): EventDef<G>[];
  /**
   * Déclenche un événement précis, sans tirage (scénarios, tutoriel, tests). Renvoie `null` si
   * l'événement refuse (`prepare` annule), sinon la trace de ce qui s'est passé.
   */
  fire(data: G, ctx: EventContext, eventId: string, vars?: Vars): FiredResult | null;
  readonly byId: ReadonlyMap<string, EventDef<G>>;
}

export interface FiredResult {
  instanceId: number;
  eventId: string;
  vars: Vars;
  consequences: readonly Consequence[];
}

export function createEventEngine<G>(options: EventEngineOptions<G>): EventEngine<G> {
  const { events, getState, stream = 'events', maxPerTick = 2, historyLimit = 200 } = options;

  const byId = new Map<string, EventDef<G>>();
  for (const event of events) {
    if (byId.has(event.id)) throw new RangeError(`Événement dupliqué : ${event.id}`);
    if (typeof event.weight === 'number' && !(event.weight >= 0)) {
      throw new RangeError(`Poids invalide pour ${event.id}`);
    }
    if (event.cooldown !== undefined && (!Number.isInteger(event.cooldown) || event.cooldown < 0)) {
      throw new RangeError(`Délai de recharge invalide pour ${event.id}`);
    }
    byId.set(event.id, event);
  }
  if (!Number.isInteger(maxPerTick) || maxPerTick < 1) throw new RangeError('maxPerTick invalide');

  const weightOf = (event: EventDef<G>, data: G, tick: number): number => {
    const w = typeof event.weight === 'number' ? event.weight : event.weight(data, tick);
    return w > 0 && Number.isFinite(w) ? w : 0;
  };

  function isEligible(event: EventDef<G>, data: G, tick: number): boolean {
    const state = getState(data);
    if (event.minTick !== undefined && tick < event.minTick) return false;
    if (event.once && (state.count[event.id] ?? 0) > 0) return false;
    if (tick < (state.nextAllowed[event.id] ?? 0)) return false;
    if (event.when && !event.when(data, tick)) return false;
    return weightOf(event, data, tick) > 0;
  }

  function record(data: G, ctx: EventContext, event: EventDef<G>, vars: Vars): FiredResult {
    const state = getState(data);
    const consequences = event.apply?.(data, ctx, vars) ?? [];
    const instanceId = state.nextInstanceId;
    state.nextInstanceId += 1;
    state.count[event.id] = (state.count[event.id] ?? 0) + 1;
    if (event.cooldown) state.nextAllowed[event.id] = ctx.tick + event.cooldown;
    state.history.push({ instanceId, eventId: event.id, tick: ctx.tick, vars, consequences });
    if (state.history.length > historyLimit)
      state.history.splice(0, state.history.length - historyLimit);
    ctx.emit({
      kind: 'evenement',
      payload: { instanceId, eventId: event.id, category: event.category },
    });
    return { instanceId, eventId: event.id, vars, consequences };
  }

  const phase: Phase<G> = {
    name: options.phaseName ?? 'evenements',
    run(data, ctx) {
      const rng = ctx.rng(stream);
      for (let fired = 0; fired < maxPerTick; fired += 1) {
        const chance =
          typeof options.chance === 'number' ? options.chance : options.chance(data, ctx.tick);
        if (!rng.chance(chance)) break;

        // Candidats éligibles ; si `prepare` annule, on retire l'événement et on retire au sort
        const candidates = events.filter((event) => isEligible(event, data, ctx.tick));
        let happened = false;
        while (candidates.length > 0 && !happened) {
          const picked = rng.pickWeighted(candidates, (event) => weightOf(event, data, ctx.tick));
          const vars = picked.prepare ? picked.prepare(data, ctx) : {};
          if (vars === null) {
            candidates.splice(candidates.indexOf(picked), 1);
            continue;
          }
          record(data, ctx, picked, vars);
          happened = true;
        }
        if (!happened) break;
      }
    },
  };

  return {
    phase,
    byId,
    eligible: (data, tick) => events.filter((event) => isEligible(event, data, tick)),
    fire(data, ctx, eventId, vars) {
      const event = byId.get(eventId);
      if (!event) throw new RangeError(`Événement inconnu : ${eventId}`);
      const prepared = vars ?? (event.prepare ? event.prepare(data, ctx) : {});
      if (prepared === null) return null;
      return record(data, ctx, event, prepared);
    },
  };
}
