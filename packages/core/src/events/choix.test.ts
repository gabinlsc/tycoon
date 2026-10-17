import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import { type Session, createGame, reject } from '../sim';
import {
  type EventDef,
  type EventsState,
  type ResolveEventAction,
  createEventEngine,
  emptyEventsState,
} from './index';

interface World {
  events: EventsState;
  cash: number;
  moral: number;
  journal: string[];
}
const world = (): World => ({ events: emptyEventsState(), cash: 100_000, moral: 50, journal: [] });

const demande: EventDef<World> = {
  id: 'demande-augmentation',
  category: 'artistes',
  weight: 1,
  cooldown: 6,
  deadline: 3,
  defaultChoice: 'refuser',
  prepare: () => ({ artiste: 'Mira', montant: 20_000 }),
  choices: [
    {
      id: 'accepter',
      when: (w, vars) => w.cash >= Number(vars['montant']),
      apply(w, _ctx, vars) {
        w.cash -= Number(vars['montant']);
        w.moral += 10;
        return [
          { kind: 'tresorerie', params: { delta: -Number(vars['montant']) } },
          { kind: 'moral', params: { delta: 10 } },
        ];
      },
    },
    {
      id: 'refuser',
      apply(w) {
        w.moral -= 15;
        return [{ kind: 'moral', params: { delta: -15 } }];
      },
      delayed: [{ afterWeeks: 4, effect: 'depart-menace' }],
    },
  ],
};

const engineFor = (events: EventDef<World>[], extra = {}) =>
  createEventEngine<World>({
    events,
    getState: (w) => w.events,
    chance: 1,
    maxPerTick: 1,
    delayedEffects: {
      'depart-menace': (w, _ctx, vars) => {
        w.journal.push(`${String(vars['artiste'])} menace de partir`);
        return [{ kind: 'depart-menace', params: { artiste: String(vars['artiste']) } }];
      },
    },
    ...extra,
  });

function build(events: EventDef<World>[] = [demande], extra = {}) {
  const engine = engineFor(events, extra);
  const game = createGame<World, ResolveEventAction>({
    streams: ['events'],
    phases: [engine.duePhase, engine.phase],
    actions: engine.actionHandlers,
  });
  return { engine, game };
}

const resolveAction = (instanceId: number, choiceId: string): ResolveEventAction => ({
  type: 'resoudre-evenement',
  instanceId,
  choiceId,
});

describe('décisions', () => {
  it("une décision reste en attente, avec auto-pause, sans effet tant qu'on n'a pas choisi", () => {
    const { game } = build();
    const run = game.advance(game.newSession('d', world()), 1);
    const data = run.session.engine.data;
    expect(data.events.pending).toHaveLength(1);
    expect(data.events.pending[0]).toMatchObject({
      eventId: 'demande-augmentation',
      createdTick: 0,
      deadlineTick: 3,
      instanceId: 1,
    });
    expect(data.moral).toBe(50);
    expect(run.signals.find((s) => s.kind === 'decision-requise')).toMatchObject({
      interrupt: true,
    });
    expect(data.events.history[0]?.outcome).toBeUndefined();
  });

  it('le choix du joueur applique ses effets et enregistre le résultat lisible', () => {
    const { game } = build();
    let session = game.advance(game.newSession('d', world()), 1).session;
    const result = game.dispatch(session, resolveAction(1, 'accepter'));
    if (!result.ok) throw new Error(JSON.stringify(result.rejection));
    session = result.session;
    const data = session.engine.data;
    expect(data.cash).toBe(80_000);
    expect(data.moral).toBe(60);
    expect(data.events.pending).toHaveLength(0);
    expect(data.events.history[0]?.outcome).toEqual({
      choiceId: 'accepter',
      tick: 1,
      auto: false,
      consequences: [
        { kind: 'tresorerie', params: { delta: -20_000 } },
        { kind: 'moral', params: { delta: 10 } },
      ],
    });
    expect(result.signals.map((s) => s.kind)).toEqual(['decision-tranchee']);
    expect(session.journal).toHaveLength(1);
  });

  it('refuse les décisions ou choix inconnus et les choix indisponibles, sans rien modifier', () => {
    const { game } = build();
    const session = game.advance(game.newSession('d', { ...world(), cash: 5 }), 1).session;
    const before = hashState(session.engine);
    expect(game.dispatch(session, resolveAction(99, 'accepter'))).toMatchObject({
      ok: false,
      rejection: { code: 'decision-introuvable' },
    });
    expect(game.dispatch(session, resolveAction(1, 'inventer'))).toMatchObject({
      ok: false,
      rejection: { code: 'choix-inconnu' },
    });
    expect(game.dispatch(session, resolveAction(1, 'accepter'))).toMatchObject({
      ok: false,
      rejection: { code: 'choix-indisponible' },
    });
    expect(hashState(session.engine)).toBe(before);
  });

  it('ne laisse pas répondre deux fois à la même décision', () => {
    const { game } = build();
    const first = game.dispatch(
      game.advance(game.newSession('d', world()), 1).session,
      resolveAction(1, 'refuser'),
    );
    if (!first.ok) throw new Error('attendu : succès');
    expect(game.dispatch(first.session, resolveAction(1, 'refuser'))).toMatchObject({
      ok: false,
      rejection: { code: 'decision-introuvable' },
    });
  });

  it('liste les choix disponibles', () => {
    const { game, engine } = build();
    const poor = game.advance(game.newSession('d', { ...world(), cash: 5 }), 1).session.engine;
    expect(engine.availableChoices(poor.data, poor.tick, 1)).toEqual(['refuser']);
    const rich = game.advance(game.newSession('d', world()), 1).session.engine;
    expect(engine.availableChoices(rich.data, rich.tick, 1)).toEqual(['accepter', 'refuser']);
    expect(engine.availableChoices(rich.data, rich.tick, 42)).toEqual([]);
  });
});

describe('échéance et choix par défaut', () => {
  it("applique le choix par défaut à l'échéance, en le signalant", () => {
    const { game } = build();
    let session = game.newSession('d', world());
    const run1 = game.advance(session, 1);
    session = run1.session;
    const run2 = game.advance(session, 3); // semaines 1, 2, 3 : échéance au tick 3
    const data = run2.session.engine.data;
    expect(data.events.pending.filter((p) => p.instanceId === 1)).toHaveLength(0);
    const outcome = data.events.history[0]?.outcome;
    expect(outcome).toMatchObject({ choiceId: 'refuser', auto: true, tick: 3 });
    expect(
      run2.signals.some(
        (s) => s.kind === 'decision-tranchee' && (s.payload as { auto: boolean }).auto,
      ),
    ).toBe(true);
  });

  it("une décision à temps n'est pas touchée par l'échéance", () => {
    const { game } = build();
    let session = game.advance(game.newSession('d', world()), 1).session;
    const result = game.dispatch(session, resolveAction(1, 'accepter'));
    if (!result.ok) throw new Error('attendu');
    session = game.advance(result.session, 10).session;
    expect(session.engine.data.events.history[0]?.outcome).toMatchObject({
      choiceId: 'accepter',
      auto: false,
    });
  });
});

describe('conséquences différées', () => {
  it("programme puis lance l'effet à la semaine voulue, et le garde dans l'historique", () => {
    const { game } = build();
    let session = game.advance(game.newSession('d', world()), 1).session;
    const result = game.dispatch(session, resolveAction(1, 'refuser'));
    if (!result.ok) throw new Error('attendu');
    session = result.session;
    expect(session.engine.data.events.scheduled).toEqual([
      {
        dueTick: 5,
        effect: 'depart-menace',
        vars: { artiste: 'Mira', montant: 20_000 },
        instanceId: 1,
        eventId: 'demande-augmentation',
      },
    ]);
    session = game.advance(session, 4).session; // semaines 1..4 : pas encore
    expect(session.engine.data.journal).toEqual([]);
    const later = game.advance(session, 2);
    expect(later.session.engine.data.journal).toEqual(['Mira menace de partir']);
    expect(later.session.engine.data.events.scheduled).toHaveLength(0);
    expect(later.session.engine.data.events.history[0]?.delayedResults).toEqual([
      {
        tick: 5,
        effect: 'depart-menace',
        consequences: [{ kind: 'depart-menace', params: { artiste: 'Mira' } }],
      },
    ]);
    expect(later.signals.some((s) => s.kind === 'consequence-differee')).toBe(true);
  });
});

describe('garde-fous', () => {
  it('ne cumule pas deux décisions identiques en attente', () => {
    const { game } = build([{ ...demande, cooldown: 0, deadline: 50 }]);
    const run = game.advance(game.newSession('d', world()), 10);
    expect(run.session.engine.data.events.pending).toHaveLength(1);
  });

  it('plafonne le nombre de décisions en attente', () => {
    const many: EventDef<World>[] = Array.from({ length: 6 }, (_, i) => ({
      ...demande,
      id: `d${i}`,
      cooldown: 0,
      deadline: 100,
    }));
    const { game } = build(many, { maxPending: 3 });
    const run = game.advance(game.newSession('d', world()), 30);
    expect(run.session.engine.data.events.pending).toHaveLength(3);
  });
});

describe('définition', () => {
  const build2 = (event: Partial<EventDef<World>>) => () => engineFor([{ ...demande, ...event }]);
  it('refuse les définitions de choix incohérentes', () => {
    const { defaultChoice: _omitted, ...sansDefaut } = demande;
    void _omitted;
    expect(() => engineFor([sansDefaut])).toThrow(RangeError);
    expect(build2({ defaultChoice: 'inconnu' })).toThrow(RangeError);
    expect(build2({ choices: [] })).toThrow(RangeError);
    expect(build2({ choices: [{ id: 'a' }, { id: 'a' }], defaultChoice: 'a' })).toThrow(RangeError);
    expect(build2({ deadline: 0 })).toThrow(RangeError);
    expect(
      build2({
        choices: [{ id: 'a', delayed: [{ afterWeeks: 1, effect: 'absent' }] }],
        defaultChoice: 'a',
      }),
    ).toThrow(RangeError);
    expect(
      build2({
        choices: [{ id: 'a', delayed: [{ afterWeeks: 0, effect: 'depart-menace' }] }],
        defaultChoice: 'a',
      }),
    ).toThrow(RangeError);
    expect(() => engineFor([{ id: 'x', category: 'c', weight: 1, deadline: 3 }])).toThrow(
      RangeError,
    );
  });
});

describe('rejeu avec décisions (propriété)', () => {
  it("une partie qui répond aux décisions se rejoue à l'identique", () => {
    const { game, engine } = build([
      demande,
      { ...demande, id: 'autre', category: 'production', cooldown: 3 },
    ]);
    fc.assert(
      fc.property(
        fc.string({ maxLength: 6 }),
        fc.array(fc.tuple(fc.integer({ min: 1, max: 5 }), fc.nat(1)), { maxLength: 12 }),
        (seed, plan) => {
          let session: Session<World, ResolveEventAction> = game.newSession(seed, world());
          for (const [advance, pick] of plan) {
            session = game.advance(session, advance).session;
            // répond à toutes les décisions en attente, choix tiré de la liste des choix disponibles
            for (const pending of [...session.engine.data.events.pending]) {
              const options = engine.availableChoices(
                session.engine.data,
                session.engine.tick,
                pending.instanceId,
              );
              const choice = options[pick % options.length];
              if (choice === undefined) continue;
              const result = game.dispatch(session, resolveAction(pending.instanceId, choice));
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

  it('garde un état sérialisable', () => {
    const { game } = build();
    const run = game.advance(game.newSession('s', world()), 40);
    expect(() => hashState(run.session.engine)).not.toThrow();
    expect(reject('x').code).toBe('x');
  });
});
