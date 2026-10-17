import {
  type Action,
  type ActionHandler,
  type Phase,
  type Rejection,
  type Signal,
  reject,
} from '../sim';
import {
  type ChoiceDef,
  type Consequence,
  type DelayedEffectFn,
  type EventContext,
  type EventDef,
  type EventsState,
  type FiredEvent,
  type FollowUpDef,
  type Outcome,
  type PendingEvent,
  type Vars,
  scheduleFollowUp,
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
  /** Longueur maximale d'une chaîne d'événements : au-delà, la suite est abandonnée (évite les boucles). */
  readonly maxChainDepth?: number;
  /** Nombre maximal de décisions en attente : au-delà, plus de nouvelle décision n'est tirée. */
  readonly maxPending?: number;
  /** Effets à retardement, par clé. */
  readonly delayedEffects?: Readonly<Record<string, DelayedEffectFn<G>>>;
  /** Nom des phases dans le pipeline. */
  readonly phaseNames?: { due?: string; draw?: string };
}

export interface FiredResult {
  instanceId: number;
  eventId: string;
  vars: Vars;
  consequences: readonly Consequence[];
  /** Vrai si l'événement est une décision en attente de réponse. */
  pending: boolean;
}

/** Action du joueur : trancher une décision en attente. */
export interface ResolveEventAction extends Action {
  readonly type: 'resoudre-evenement';
  readonly instanceId: number;
  readonly choiceId: string;
}

export interface EventEngine<G> {
  /** Phase de **tirage** de nouveaux événements. */
  readonly phase: Phase<G>;
  /**
   * Phase des **échéances** : lance les effets différés arrivés à terme et applique le choix par
   * défaut des décisions expirées. À placer avant le reste du pipeline (voir le GDD).
   */
  readonly duePhase: Phase<G>;
  eligible(data: G, tick: number): EventDef<G>[];
  fire(data: G, ctx: EventContext, eventId: string, vars?: Vars): FiredResult | null;
  /** Tranche une décision. Lève `RangeError` si elle ou le choix n'existent pas. */
  resolve(
    data: G,
    ctx: EventContext,
    instanceId: number,
    choiceId: string,
    auto?: boolean,
  ): Outcome;
  /** Contrôle qu'un choix est possible maintenant ; `null` si oui. N'a aucun effet. */
  check(data: G, tick: number, instanceId: number, choiceId: string): Rejection | null;
  /** Choix actuellement disponibles pour une décision en attente. */
  availableChoices(data: G, tick: number, instanceId: number): string[];
  /** Gestionnaire d'action à ajouter au registre d'actions du jeu. */
  readonly actionHandlers: { 'resoudre-evenement': ActionHandler<G, ResolveEventAction, Signal> };
  readonly byId: ReadonlyMap<string, EventDef<G>>;
}

const DEFAULT_DEADLINE = 4;

export function createEventEngine<G>(options: EventEngineOptions<G>): EventEngine<G> {
  const {
    events,
    getState,
    stream = 'events',
    maxPerTick = 2,
    historyLimit = 200,
    maxPending = 8,
    maxChainDepth = 6,
    delayedEffects = {},
  } = options;

  const byId = new Map<string, EventDef<G>>();
  for (const event of events) {
    if (byId.has(event.id)) throw new RangeError(`Événement dupliqué : ${event.id}`);
    if (typeof event.weight === 'number' && !(event.weight >= 0)) {
      throw new RangeError(`Poids invalide pour ${event.id}`);
    }
    if (event.cooldown !== undefined && (!Number.isInteger(event.cooldown) || event.cooldown < 0)) {
      throw new RangeError(`Délai de recharge invalide pour ${event.id}`);
    }
    validateChoices(event);
    byId.set(event.id, event);
  }
  for (const event of events) {
    validateFollowUps(event.id, event.followUps);
    for (const choice of event.choices ?? [])
      validateFollowUps(`${event.id}/${choice.id}`, choice.followUps);
  }
  if (!Number.isInteger(maxPerTick) || maxPerTick < 1) throw new RangeError('maxPerTick invalide');
  if (!Number.isInteger(maxChainDepth) || maxChainDepth < 1)
    throw new RangeError('maxChainDepth invalide');
  if (!Number.isInteger(maxPending) || maxPending < 1) throw new RangeError('maxPending invalide');

  function validateFollowUps(owner: string, followUps: readonly FollowUpDef[] | undefined): void {
    for (const followUp of followUps ?? []) {
      if (!byId.has(followUp.eventId))
        throw new RangeError(`${owner} : suite inconnue (${followUp.eventId})`);
      if (!Number.isInteger(followUp.afterWeeks) || followUp.afterWeeks < 1) {
        throw new RangeError(`${owner} : délai de suite invalide`);
      }
      if (followUp.chance !== undefined && !(followUp.chance >= 0 && followUp.chance <= 1)) {
        throw new RangeError(`${owner} : probabilité de suite invalide`);
      }
    }
  }

  function validateChoices(event: EventDef<G>): void {
    if (!event.choices) {
      if (event.defaultChoice !== undefined || event.deadline !== undefined) {
        throw new RangeError(`${event.id} : défaut ou échéance sans choix`);
      }
      return;
    }
    if (event.choices.length === 0) throw new RangeError(`${event.id} : liste de choix vide`);
    const ids = new Set<string>();
    for (const choice of event.choices) {
      if (ids.has(choice.id)) throw new RangeError(`${event.id} : choix dupliqué (${choice.id})`);
      ids.add(choice.id);
      for (const delayed of choice.delayed ?? []) {
        if (!Number.isInteger(delayed.afterWeeks) || delayed.afterWeeks < 1) {
          throw new RangeError(`${event.id}/${choice.id} : délai d'effet différé invalide`);
        }
        if (!(delayed.effect in delayedEffects)) {
          throw new RangeError(
            `${event.id}/${choice.id} : effet différé inconnu (${delayed.effect})`,
          );
        }
      }
    }
    if (event.defaultChoice === undefined || !ids.has(event.defaultChoice)) {
      throw new RangeError(`${event.id} : choix par défaut manquant ou inconnu`);
    }
    const deadline = event.deadline ?? DEFAULT_DEADLINE;
    if (!Number.isInteger(deadline) || deadline < 1)
      throw new RangeError(`${event.id} : échéance invalide`);
  }

  const weightOf = (event: EventDef<G>, data: G, tick: number): number => {
    const w = typeof event.weight === 'number' ? event.weight : event.weight(data, tick);
    return w > 0 && Number.isFinite(w) ? w : 0;
  };

  function isEligible(event: EventDef<G>, data: G, tick: number): boolean {
    const state = getState(data);
    if (event.minTick !== undefined && tick < event.minTick) return false;
    if (event.once && (state.count[event.id] ?? 0) > 0) return false;
    if (tick < (state.nextAllowed[event.id] ?? 0)) return false;
    if (event.choices) {
      if (state.pending.length >= maxPending) return false;
      // Pas deux décisions identiques en même temps
      if (state.pending.some((p) => p.eventId === event.id)) return false;
    }
    if (event.when && !event.when(data, tick)) return false;
    return weightOf(event, data, tick) > 0;
  }

  function trimHistory(state: EventsState): void {
    if (state.history.length > historyLimit)
      state.history.splice(0, state.history.length - historyLimit);
  }

  /** Programme les suites d'un événement. La probabilité est tirée maintenant, pas à l'échéance. */
  function scheduleFollowUps(
    state: EventsState,
    ctx: EventContext,
    defs: readonly FollowUpDef[] | undefined,
    parentInstanceId: number,
    vars: Vars,
    parentStep: number,
  ): void {
    for (const def of defs ?? []) {
      if (def.chance !== undefined && !ctx.rng(stream).chance(def.chance)) continue;
      scheduleFollowUp(state, {
        dueTick: ctx.tick + def.afterWeeks,
        eventId: def.eventId,
        vars: def.inherit === false ? {} : vars,
        parentInstanceId,
        step: parentStep + 1,
      });
    }
  }

  function record(
    data: G,
    ctx: EventContext,
    event: EventDef<G>,
    vars: Vars,
    chain?: { parentInstanceId: number; step: number },
  ): FiredResult {
    const state = getState(data);
    const consequences = event.apply?.(data, ctx, vars) ?? [];
    const instanceId = state.nextInstanceId;
    state.nextInstanceId += 1;
    state.count[event.id] = (state.count[event.id] ?? 0) + 1;
    if (event.cooldown) state.nextAllowed[event.id] = ctx.tick + event.cooldown;
    const entry: FiredEvent = { instanceId, eventId: event.id, tick: ctx.tick, vars, consequences };
    if (chain) {
      entry.parentInstanceId = chain.parentInstanceId;
      entry.chainStep = chain.step;
    }
    state.history.push(entry);
    trimHistory(state);

    const isDecision = Boolean(event.choices);
    // Un événement simple programme ses suites tout de suite ; une décision, à la résolution du choix
    if (!isDecision)
      scheduleFollowUps(state, ctx, event.followUps, instanceId, vars, chain?.step ?? 0);
    if (isDecision) {
      state.pending.push({
        instanceId,
        eventId: event.id,
        createdTick: ctx.tick,
        deadlineTick: ctx.tick + (event.deadline ?? DEFAULT_DEADLINE),
        vars,
        chainStep: chain?.step ?? 0,
      });
    }
    ctx.emit({
      kind: isDecision ? 'decision-requise' : 'evenement',
      // Une décision à prendre est exactement le cas d'une auto-pause
      ...(isDecision ? { interrupt: true } : {}),
      payload: { instanceId, eventId: event.id, category: event.category },
    });
    return { instanceId, eventId: event.id, vars, consequences, pending: isDecision };
  }

  function choiceOf(eventId: string, choiceId: string): ChoiceDef<G> {
    const choice = byId.get(eventId)?.choices?.find((c) => c.id === choiceId);
    if (!choice) throw new RangeError(`Choix inconnu : ${eventId}/${choiceId}`);
    return choice;
  }

  function historyEntry(state: EventsState, instanceId: number): FiredEvent | undefined {
    return state.history.find((entry) => entry.instanceId === instanceId);
  }

  function resolve(
    data: G,
    ctx: EventContext,
    instanceId: number,
    choiceId: string,
    auto = false,
  ): Outcome {
    const state = getState(data);
    const index = state.pending.findIndex((p) => p.instanceId === instanceId);
    const pending = state.pending[index];
    if (!pending)
      throw new RangeError(`Aucune décision en attente avec l'identifiant ${instanceId}`);
    const choice = choiceOf(pending.eventId, choiceId);

    const consequences = choice.apply?.(data, ctx, pending.vars) ?? [];
    for (const delayed of choice.delayed ?? []) {
      state.scheduled.push({
        dueTick: ctx.tick + delayed.afterWeeks,
        effect: delayed.effect,
        vars: pending.vars,
        instanceId,
        eventId: pending.eventId,
      });
    }
    // Ordre stable des échéances : par semaine, puis par ordre d'inscription
    state.scheduled.sort((a, b) => a.dueTick - b.dueTick);
    scheduleFollowUps(state, ctx, choice.followUps, instanceId, pending.vars, pending.chainStep);
    state.pending.splice(index, 1);

    const outcome: Outcome = { choiceId, tick: ctx.tick, auto, consequences };
    const entry = historyEntry(state, instanceId);
    if (entry) entry.outcome = outcome;
    ctx.emit({
      kind: 'decision-tranchee',
      payload: { instanceId, eventId: pending.eventId, choiceId, auto },
    });
    return outcome;
  }

  function check(data: G, tick: number, instanceId: number, choiceId: string): Rejection | null {
    const pending = getState(data).pending.find((p) => p.instanceId === instanceId);
    if (!pending) return reject('decision-introuvable', { instanceId });
    const choice = byId.get(pending.eventId)?.choices?.find((c) => c.id === choiceId);
    if (!choice) return reject('choix-inconnu', { choix: choiceId });
    if (choice.when && !choice.when(data, pending.vars, tick))
      return reject('choix-indisponible', { choix: choiceId });
    return null;
  }

  const duePhase: Phase<G> = {
    name: options.phaseNames?.due ?? 'evenements-echeances',
    run(data, ctx) {
      const state = getState(data);

      // 1. Effets différés arrivés à terme (déjà triés par semaine)
      while (state.scheduled.length > 0 && (state.scheduled[0]?.dueTick ?? Infinity) <= ctx.tick) {
        const due = state.scheduled.shift();
        if (!due) break;
        const effect = delayedEffects[due.effect];
        if (!effect) throw new RangeError(`Effet différé inconnu : ${due.effect}`);
        const consequences = effect(data, ctx, due.vars) ?? [];
        const entry = historyEntry(state, due.instanceId);
        if (entry)
          (entry.delayedResults ??= []).push({ tick: ctx.tick, effect: due.effect, consequences });
        ctx.emit({
          kind: 'consequence-differee',
          payload: { instanceId: due.instanceId, eventId: due.eventId, effect: due.effect },
        });
      }

      // 2. Décisions expirées : le choix par défaut s'applique (dans l'ordre de création)
      const expired = state.pending.filter((p) => p.deadlineTick <= ctx.tick);
      for (const pending of expired) {
        const fallback = byId.get(pending.eventId)?.defaultChoice;
        if (fallback !== undefined) resolve(data, ctx, pending.instanceId, fallback, true);
      }

      // 3. Suites d'événements arrivées à échéance
      const postponed: typeof state.followUps = [];
      while (state.followUps.length > 0 && (state.followUps[0]?.dueTick ?? Infinity) <= ctx.tick) {
        const followUp = state.followUps.shift();
        if (!followUp) break;
        const event = byId.get(followUp.eventId);
        if (!event || followUp.step > maxChainDepth) continue; // chaîne trop longue : abandonnée
        if (event.when && !event.when(data, ctx.tick)) continue; // la situation a changé : la suite tombe
        if (event.choices) {
          const crowded =
            state.pending.length >= maxPending || state.pending.some((p) => p.eventId === event.id);
          if (crowded) {
            postponed.push({ ...followUp, dueTick: ctx.tick + 1 });
            continue;
          }
        }
        let vars = followUp.vars;
        if (event.prepare) {
          const prepared = event.prepare(data, ctx);
          if (prepared === null) continue;
          vars = { ...followUp.vars, ...prepared };
        }
        record(data, ctx, event, vars, {
          parentInstanceId: followUp.parentInstanceId,
          step: followUp.step,
        });
      }
      for (const later of postponed) scheduleFollowUp(state, later);
    },
  };

  const phase: Phase<G> = {
    name: options.phaseNames?.draw ?? 'evenements',
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

  const actionHandlers: EventEngine<G>['actionHandlers'] = {
    'resoudre-evenement': {
      validate: (data, action, ctx) => check(data, ctx.tick, action.instanceId, action.choiceId),
      apply(data, action, ctx) {
        resolve(data, ctx, action.instanceId, action.choiceId);
      },
    },
  };

  return {
    phase,
    duePhase,
    byId,
    actionHandlers,
    eligible: (data, tick) => events.filter((event) => isEligible(event, data, tick)),
    fire(data, ctx, eventId, vars) {
      const event = byId.get(eventId);
      if (!event) throw new RangeError(`Événement inconnu : ${eventId}`);
      const prepared = vars ?? (event.prepare ? event.prepare(data, ctx) : {});
      if (prepared === null) return null;
      return record(data, ctx, event, prepared);
    },
    resolve,
    check,
    availableChoices(data, tick, instanceId) {
      const pending = getState(data).pending.find((p) => p.instanceId === instanceId);
      if (!pending) return [];
      return (byId.get(pending.eventId)?.choices ?? [])
        .filter((c) => !c.when || c.when(data, pending.vars, tick))
        .map((c) => c.id);
    },
  };
}

/** Pour typer l'enregistrement du gestionnaire dans un jeu dont les signaux sont des `Signal`. */
export type { PendingEvent };
