import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import { type Session, createGame } from '../sim';
import {
  type EventDef,
  type EventsState,
  type ResolveEventAction,
  addToFlag,
  createEventEngine,
  emptyEventsState,
  getFlag,
  hasFlag,
  scheduleFollowUp,
  setFlag,
} from './index';

interface World {
  events: EventsState;
  trace: string[];
}
const world = (): World => ({ events: emptyEventsState(), trace: [] });

/** Événement qui ne se tire jamais seul (poids 0) : il n'existe que comme suite. */
const suite = (id: string, over: Partial<EventDef<World>> = {}): EventDef<World> => ({
  id,
  category: 'chaine',
  weight: 0,
  apply(w, ctx, vars) {
    w.trace.push(`${id}@${ctx.tick}${vars['artiste'] ? `:${String(vars['artiste'])}` : ''}`);
    return undefined;
  },
  ...over,
});

const origin = (over: Partial<EventDef<World>> = {}): EventDef<World> =>
  suite('origine', { weight: 1, once: true, prepare: () => ({ artiste: 'Mira' }), ...over });

function build(events: EventDef<World>[], extra = {}) {
  const engine = createEventEngine<World>({
    events,
    getState: (w) => w.events,
    chance: 1,
    maxPerTick: 1,
    ...extra,
  });
  const game = createGame<World, ResolveEventAction>({
    streams: ['events'],
    phases: [engine.duePhase, engine.phase],
    actions: engine.actionHandlers,
  });
  return { engine, game };
}

describe('chaînes déclaratives', () => {
  it('enchaîne A, puis B, puis C aux semaines prévues, avec les variables héritées', () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'b', afterWeeks: 2 }] }),
      suite('b', { followUps: [{ eventId: 'c', afterWeeks: 3 }] }),
      suite('c'),
    ]);
    const run = game.advance(game.newSession('c', world()), 12);
    expect(run.session.engine.data.trace).toEqual(['origine@0:Mira', 'b@2:Mira', 'c@5:Mira']);
  });

  it("relie les entrées d'historique : parent et rang dans la chaîne", () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'b', afterWeeks: 1 }] }),
      suite('b', { followUps: [{ eventId: 'c', afterWeeks: 1 }] }),
      suite('c'),
    ]);
    const history = game.advance(game.newSession('c', world()), 6).session.engine.data.events
      .history;
    expect(history.map((h) => [h.eventId, h.parentInstanceId, h.chainStep])).toEqual([
      ['origine', undefined, undefined],
      ['b', 1, 1],
      ['c', 2, 2],
    ]);
  });

  it('une suite ignore le poids, le délai de recharge et « once » (elle est voulue)', () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'b', afterWeeks: 1 }] }),
      suite('b', { weight: 0, once: true, cooldown: 100 }),
    ]);
    const run = game.advance(game.newSession('c', world()), 4);
    expect(run.session.engine.data.events.count['b']).toBe(1);
  });

  it("peut ne pas reprendre les variables de l'origine", () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'b', afterWeeks: 1, inherit: false }] }),
      suite('b'),
    ]);
    expect(game.advance(game.newSession('c', world()), 4).session.engine.data.trace).toEqual([
      'origine@0:Mira',
      'b@1',
    ]);
  });

  it('les variables préparées par la suite complètent ou remplacent celles héritées', () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'b', afterWeeks: 1 }] }),
      suite('b', { prepare: () => ({ artiste: 'Zed' }) }),
    ]);
    expect(game.advance(game.newSession('c', world()), 4).session.engine.data.trace).toEqual([
      'origine@0:Mira',
      'b@1:Zed',
    ]);
  });

  it('respecte la probabilité de la suite (statistique, tirée à la programmation)', () => {
    const { game } = build(
      [
        suite('src', {
          weight: 1,
          cooldown: 2,
          followUps: [{ eventId: 'b', afterWeeks: 1, chance: 0.3 }],
        }),
        suite('b'),
      ],
      { maxPerTick: 1 },
    );
    const state = game.advance(game.newSession('proba', world()), 4000).session.engine.data.events
      .count;
    const rate = (state['b'] ?? 0) / (state['src'] ?? 1);
    expect(rate).toBeGreaterThan(0.26);
    expect(rate).toBeLessThan(0.34);
  });

  it("abandonne la suite si sa condition n'est plus vraie à l'échéance", () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'b', afterWeeks: 2 }] }),
      suite('b', { when: (w) => w.trace.length === 0 }),
    ]);
    expect(game.advance(game.newSession('c', world()), 6).session.engine.data.trace).toEqual([
      'origine@0:Mira',
    ]);
  });

  it('abandonne la suite si sa préparation annule', () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'b', afterWeeks: 1 }] }),
      suite('b', { prepare: () => null }),
    ]);
    expect(game.advance(game.newSession('c', world()), 4).session.engine.data.trace).toEqual([
      'origine@0:Mira',
    ]);
  });

  it("borne la longueur des chaînes (une boucle A → A s'arrête)", () => {
    const { game } = build(
      [
        origin({ followUps: [{ eventId: 'boucle', afterWeeks: 1 }] }),
        suite('boucle', { followUps: [{ eventId: 'boucle', afterWeeks: 1 }] }),
      ],
      {
        maxChainDepth: 5,
      },
    );
    const run = game.advance(game.newSession('c', world()), 50);
    expect(run.session.engine.data.events.count['boucle']).toBe(5);
    expect(run.session.engine.data.events.followUps).toEqual([]);
  });

  it("plusieurs suites d'un même événement sont toutes programmées, dans l'ordre des échéances", () => {
    const { game } = build([
      origin({
        followUps: [
          { eventId: 'tard', afterWeeks: 3 },
          { eventId: 'tot', afterWeeks: 1 },
        ],
      }),
      suite('tard'),
      suite('tot'),
    ]);
    expect(game.advance(game.newSession('c', world()), 6).session.engine.data.trace).toEqual([
      'origine@0:Mira',
      'tot@1:Mira',
      'tard@3:Mira',
    ]);
  });
});

describe('chaînes et décisions', () => {
  const decision: EventDef<World> = {
    id: 'insulte',
    category: 'medias',
    weight: 1,
    once: true,
    deadline: 2,
    defaultChoice: 'ignorer',
    prepare: () => ({ artiste: 'Mira' }),
    choices: [
      { id: 'excuses', followUps: [{ eventId: 'apaisement', afterWeeks: 1 }] },
      { id: 'ignorer', followUps: [{ eventId: 'polemique', afterWeeks: 2 }] },
    ],
  };

  it('seules les suites du choix retenu sont programmées', () => {
    const { game } = build([decision, suite('apaisement'), suite('polemique')]);
    let session = game.advance(game.newSession('d', world()), 1).session;
    const result = game.dispatch(session, {
      type: 'resoudre-evenement',
      instanceId: 1,
      choiceId: 'excuses',
    });
    if (!result.ok) throw new Error('attendu');
    session = game.advance(result.session, 6).session;
    expect(session.engine.data.trace).toEqual(['apaisement@2:Mira']);
  });

  it("le choix par défaut à l'échéance programme ses propres suites", () => {
    const { game } = build([decision, suite('apaisement'), suite('polemique')]);
    const session = game.advance(game.newSession('d', world()), 10).session;
    expect(session.engine.data.trace).toEqual(['polemique@4:Mira']);
  });

  it('une suite qui est elle-même une décision attend la réponse du joueur', () => {
    const { game } = build([
      origin({ followUps: [{ eventId: 'proces', afterWeeks: 1 }] }),
      {
        id: 'proces',
        category: 'business',
        weight: 0,
        defaultChoice: 'regler',
        deadline: 50,
        choices: [{ id: 'regler' }, { id: 'plaider' }],
      },
    ]);
    const run = game.advance(game.newSession('d', world()), 4);
    expect(run.session.engine.data.events.pending.map((p) => p.eventId)).toEqual(['proces']);
    expect(run.session.engine.data.events.pending[0]?.chainStep).toBe(1);
    expect(run.signals.some((s) => s.kind === 'decision-requise' && s.interrupt === true)).toBe(
      true,
    );
  });

  it('reporte une suite-décision tant que trop de décisions sont en attente', () => {
    const open = (id: string): EventDef<World> => ({
      id,
      category: 'c',
      weight: 0,
      deadline: 100,
      defaultChoice: 'a',
      choices: [{ id: 'a' }],
    });
    const { game } = build(
      [origin({ followUps: [{ eventId: 'x', afterWeeks: 1 }] }), open('x'), open('y')],
      { maxPending: 1 },
    );
    const base = game.newSession('d', world());
    // on occupe l'unique place avec une décision déclenchée à la main (via suite programmée sur y)
    base.engine.data.events.followUps.push({
      dueTick: 0,
      eventId: 'y',
      vars: {},
      parentInstanceId: 0,
      step: 1,
    });
    const run = game.advance(base, 8);
    // y a pris la place ; x est reporté semaine après semaine, donc jamais en attente ni perdu
    expect(run.session.engine.data.events.pending.map((p) => p.eventId)).toEqual(['y']);
    expect(run.session.engine.data.events.followUps.map((f) => f.eventId)).toEqual(['x']);
  });
});

describe("drapeaux d'histoire", () => {
  it('pose, lit et incrémente des drapeaux, sérialisables', () => {
    const state = emptyEventsState();
    expect(hasFlag(state, 'scandale')).toBe(false);
    setFlag(state, 'scandale', true);
    setFlag(state, 'ville', 'Port-Lune');
    expect(getFlag(state, 'scandale')).toBe(true);
    expect(addToFlag(state, 'tournees', 1)).toBe(1);
    expect(addToFlag(state, 'tournees', 2)).toBe(3);
    expect(() => hashState(state)).not.toThrow();
  });

  it('un drapeau peut conditionner une suite ou un événement tirable', () => {
    const { game } = build([
      origin({
        apply(w, ctx) {
          w.trace.push(`origine@${ctx.tick}:Mira`);
          setFlag(w.events, 'scandale', true);
          return undefined;
        },
        followUps: [{ eventId: 'enquete', afterWeeks: 1 }],
      }),
      suite('enquete', { when: (w) => getFlag(w.events, 'scandale') === true }),
      suite('retour-en-grace', {
        weight: 5,
        when: (w) => getFlag(w.events, 'scandale') === true && w.trace.length >= 2,
      }),
    ]);
    const trace = game.advance(game.newSession('f', world()), 3).session.engine.data.trace;
    expect(trace[0]).toBe('origine@0:Mira');
    expect(trace).toContain('enquete@1:Mira');
    expect(trace.some((t) => t.startsWith('retour-en-grace'))).toBe(true);
  });

  it('scheduleFollowUp garde la liste triée par échéance', () => {
    const state = emptyEventsState();
    scheduleFollowUp(state, { dueTick: 9, eventId: 'a', vars: {}, parentInstanceId: 1, step: 1 });
    scheduleFollowUp(state, { dueTick: 2, eventId: 'b', vars: {}, parentInstanceId: 1, step: 1 });
    expect(state.followUps.map((f) => f.eventId)).toEqual(['b', 'a']);
  });
});

describe('définition', () => {
  it('refuse les suites vers un événement inconnu, un délai ou une probabilité invalides', () => {
    expect(() => build([origin({ followUps: [{ eventId: 'absent', afterWeeks: 1 }] })])).toThrow(
      RangeError,
    );
    expect(() => build([origin({ followUps: [{ eventId: 'origine', afterWeeks: 0 }] })])).toThrow(
      RangeError,
    );
    expect(() =>
      build([origin({ followUps: [{ eventId: 'origine', afterWeeks: 1, chance: 1.5 }] })]),
    ).toThrow(RangeError);
    expect(() => build([origin()], { maxChainDepth: 0 })).toThrow(RangeError);
  });
});

describe('rejeu avec chaînes (propriété)', () => {
  it('une partie à chaînes, décisions et probabilités se rejoue au même hash', () => {
    const events: EventDef<World>[] = [
      suite('a', {
        weight: 2,
        cooldown: 4,
        followUps: [
          { eventId: 'b', afterWeeks: 2, chance: 0.5 },
          { eventId: 'd', afterWeeks: 3 },
        ],
      }),
      suite('b', { followUps: [{ eventId: 'a2', afterWeeks: 1, chance: 0.4 }] }),
      suite('a2', { followUps: [{ eventId: 'b', afterWeeks: 2, chance: 0.3 }] }),
      {
        id: 'd',
        category: 'x',
        weight: 0,
        deadline: 3,
        defaultChoice: 'oui',
        choices: [
          { id: 'oui', followUps: [{ eventId: 'b', afterWeeks: 1, chance: 0.5 }] },
          { id: 'non' },
        ],
      },
    ];
    const { game } = build(events);
    fc.assert(
      fc.property(
        fc.string({ maxLength: 6 }),
        fc.array(fc.tuple(fc.integer({ min: 1, max: 6 }), fc.boolean()), { maxLength: 10 }),
        (seed, plan) => {
          let session: Session<World, ResolveEventAction> = game.newSession(seed, world());
          for (const [advance, accept] of plan) {
            session = game.advance(session, advance).session;
            for (const pending of [...session.engine.data.events.pending]) {
              const result = game.dispatch(session, {
                type: 'resoudre-evenement',
                instanceId: pending.instanceId,
                choiceId: accept ? 'oui' : 'non',
              });
              if (result.ok) session = result.session;
            }
          }
          const replayed = game.replay(seed, world(), session.journal, session.engine.tick);
          return hashState(replayed.engine) === hashState(session.engine);
        },
      ),
      { numRuns: 80 },
    );
  });
});
