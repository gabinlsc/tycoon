import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import { createSimulation } from '../sim';
import { type EventDef, type EventsState, createEventEngine, emptyEventsState } from './index';

interface World {
  events: EventsState;
  cash: number;
  artistes: string[];
  fanaux: string[];
}

const world = (): World => ({
  events: emptyEventsState(),
  cash: 0,
  artistes: ['Mira', 'Zed'],
  fanaux: [],
});

const make = (
  events: EventDef<World>[],
  extra: Partial<Parameters<typeof createEventEngine<World>>[0]> = {},
) => createEventEngine<World>({ events, getState: (w) => w.events, chance: 1, ...extra });

function simulate(
  events: EventDef<World>[],
  ticks: number,
  seed: number | string = 'e',
  extra = {},
) {
  const engine = make(events, extra);
  const sim = createSimulation<World>({ streams: ['events'], phases: [engine.phase] });
  return { engine, sim, result: sim.run(sim.newState(seed, world()), ticks) };
}

const simple = (id: string, over: Partial<EventDef<World>> = {}): EventDef<World> => ({
  id,
  category: 'test',
  weight: 1,
  ...over,
});

describe('tirage pondéré', () => {
  it('respecte les poids relatifs (statistique)', () => {
    const { result } = simulate(
      [simple('rare', { weight: 1 }), simple('courant', { weight: 4 })],
      5000,
      'poids',
      { maxPerTick: 1 },
    );
    const count = result.state.data.events.count;
    const ratio = (count['courant'] ?? 0) / (count['rare'] ?? 1);
    expect(ratio).toBeGreaterThan(3.5);
    expect(ratio).toBeLessThan(4.6);
  });

  it('déclenche à la fréquence demandée (chance par semaine)', () => {
    const { result } = simulate([simple('a')], 4000, 'chance', { chance: 0.25, maxPerTick: 1 });
    const total = result.state.data.events.count['a'] ?? 0;
    expect(total / 4000).toBeGreaterThan(0.22);
    expect(total / 4000).toBeLessThan(0.28);
  });

  it('ne déclenche rien avec une chance nulle', () => {
    expect(simulate([simple('a')], 200, 'z', { chance: 0 }).result.state.data.events.count).toEqual(
      {},
    );
  });

  it("accepte une chance dépendant de l'état", () => {
    const calm = (w: World) => (w.cash > 0 ? 1 : 0);
    expect(
      simulate([simple('a')], 50, 's', { chance: calm }).result.state.data.events.history,
    ).toHaveLength(0);
  });

  it("plafonne le nombre d'événements par semaine", () => {
    const { result } = simulate([simple('a'), simple('b'), simple('c')], 100, 'max', {
      maxPerTick: 2,
    });
    const perTick = new Map<number, number>();
    for (const e of result.state.data.events.history)
      perTick.set(e.tick, (perTick.get(e.tick) ?? 0) + 1);
    expect(Math.max(...perTick.values())).toBe(2);
  });

  it('est déterministe : même graine, même hash', () => {
    const events = [simple('a'), simple('b', { weight: 3 }), simple('c', { cooldown: 5 })];
    expect(hashState(simulate(events, 200, 'X').result.state)).toBe(
      hashState(simulate(events, 200, 'X').result.state),
    );
    expect(hashState(simulate(events, 200, 'X').result.state)).not.toBe(
      hashState(simulate(events, 200, 'Y').result.state),
    );
  });
});

describe('éligibilité', () => {
  it('respecte le délai de recharge (propriété)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 12 }),
        fc.string({ maxLength: 6 }),
        (cooldown, seed) => {
          const { result } = simulate([simple('a', { cooldown })], 150, seed, { maxPerTick: 1 });
          const ticks = result.state.data.events.history.map((e) => e.tick);
          return ticks.every((tick, i) => i === 0 || tick - (ticks[i - 1] ?? 0) >= cooldown);
        },
      ),
      { numRuns: 60 },
    );
  });

  it("un événement « once » ne survient qu'une fois", () => {
    const { result } = simulate([simple('unique', { once: true })], 100);
    expect(result.state.data.events.count['unique']).toBe(1);
  });

  it('respecte minTick', () => {
    const { result } = simulate([simple('tard', { minTick: 30 })], 60);
    expect(Math.min(...result.state.data.events.history.map((e) => e.tick))).toBeGreaterThanOrEqual(
      30,
    );
  });

  it('respecte la condition `when`', () => {
    const { result } = simulate([simple('riche', { when: (w) => w.cash > 1_000_000 })], 100);
    expect(result.state.data.events.history).toHaveLength(0);
  });

  it('exclut un événement dont le poids dynamique est nul', () => {
    const { engine } = simulate(
      [simple('nul', { weight: () => 0 }), simple('ok', { weight: () => 2 })],
      1,
    );
    expect(engine.eligible(world(), 0).map((e) => e.id)).toEqual(['ok']);
  });

  it('refuse les poids non finis ou négatifs renvoyés par une fonction', () => {
    const { engine } = simulate(
      [simple('x', { weight: () => Number.NaN }), simple('y', { weight: () => -3 })],
      1,
    );
    expect(engine.eligible(world(), 0)).toEqual([]);
  });

  it('retire au sort un autre événement quand `prepare` annule', () => {
    const events = [
      simple('sans-cible', { weight: 1000, prepare: () => null }),
      simple('de-secours', { weight: 1 }),
    ];
    const { result } = simulate(events, 50, 's', { maxPerTick: 1 });
    const count = result.state.data.events.count;
    expect(count['sans-cible']).toBeUndefined();
    expect(count['de-secours']).toBe(50);
  });

  it("ne boucle pas quand plus aucun événement n'est possible", () => {
    const { result } = simulate([simple('sans-cible', { prepare: () => null })], 30);
    expect(result.state.data.events.history).toHaveLength(0);
  });
});

describe('préparation et effets', () => {
  const pause: EventDef<World> = {
    id: 'caprice',
    category: 'artistes',
    weight: 1,
    prepare: (w, ctx) => ({ artiste: ctx.rng('events').pick(w.artistes), montant: 25_000 }),
    apply(w, _ctx, vars) {
      w.cash -= Number(vars['montant']);
      w.fanaux.push(String(vars['artiste']));
      return [{ kind: 'tresorerie', params: { delta: -Number(vars['montant']) } }];
    },
  };

  it("applique les effets et conserve variables et conséquences dans l'historique", () => {
    const { result } = simulate([pause], 5, 'fx', { maxPerTick: 1 });
    const data = result.state.data;
    expect(data.cash).toBe(-125_000);
    expect(data.events.history).toHaveLength(5);
    const first = data.events.history[0];
    expect(first?.vars['montant']).toBe(25_000);
    expect(['Mira', 'Zed']).toContain(first?.vars['artiste']);
    expect(first?.consequences).toEqual([{ kind: 'tresorerie', params: { delta: -25_000 } }]);
    expect(first?.instanceId).toBe(1);
    expect(data.events.history[4]?.instanceId).toBe(5);
  });

  it('émet un signal par événement', () => {
    const { result } = simulate([pause], 3, 'sig', { maxPerTick: 1 });
    expect(result.signals.map((s) => s.kind)).toEqual(['evenement', 'evenement', 'evenement']);
    expect(result.signals[0]?.payload).toMatchObject({
      eventId: 'caprice',
      category: 'artistes',
      instanceId: 1,
    });
  });

  it("borne l'historique", () => {
    const { result } = simulate([simple('a')], 100, 'h', { maxPerTick: 1, historyLimit: 10 });
    const history = result.state.data.events.history;
    expect(history).toHaveLength(10);
    expect(history[9]?.instanceId).toBe(100);
    expect(result.state.data.events.count['a']).toBe(100);
  });

  it('garde un état entièrement sérialisable', () => {
    const { result } = simulate([pause, simple('a', { cooldown: 3 })], 80);
    expect(() => hashState(result.state)).not.toThrow();
  });
});

describe('déclenchement forcé', () => {
  it('déclenche un événement précis sans tirage, avec ses variables', () => {
    const engine = make([simple('ev', { apply: (w) => void (w.cash += 1) })]);
    const sim = createSimulation<World>({ streams: ['events'], phases: [] });
    const state = sim.newState('f', world());
    const ctx = {
      tick: 0,
      rng: () => {
        throw new Error('inutile');
      },
      emit: () => undefined,
    };
    const fired = engine.fire(state.data, ctx, 'ev', { x: 1 });
    expect(fired).toMatchObject({ eventId: 'ev', vars: { x: 1 }, instanceId: 1 });
    expect(state.data.cash).toBe(1);
  });

  it('renvoie null quand `prepare` refuse, et lève pour un événement inconnu', () => {
    const engine = make([simple('ev', { prepare: () => null })]);
    const ctx = {
      tick: 0,
      rng: () => {
        throw new Error('inutile');
      },
      emit: () => undefined,
    };
    expect(engine.fire(world(), ctx, 'ev')).toBeNull();
    expect(() => engine.fire(world(), ctx, 'absent')).toThrow(RangeError);
  });
});

describe('validation de la définition', () => {
  it('refuse les doublons, poids négatifs, recharges et plafonds invalides', () => {
    expect(() => make([simple('a'), simple('a')])).toThrow(RangeError);
    expect(() => make([simple('a', { weight: -1 })])).toThrow(RangeError);
    expect(() => make([simple('a', { cooldown: -2 })])).toThrow(RangeError);
    expect(() => make([simple('a', { cooldown: 1.5 })])).toThrow(RangeError);
    expect(() => make([simple('a')], { maxPerTick: 0 })).toThrow(RangeError);
  });
});
