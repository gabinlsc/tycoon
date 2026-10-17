import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import {
  type Phase,
  type Signal,
  calendarOf,
  cloneJson,
  createSimulation,
  MONTH_LENGTHS,
  WEEKS_PER_YEAR,
} from './index';

interface Data {
  journal: string[];
  total: number;
  tirages: number[];
}

const phases = (log?: string[]): Phase<Data>[] => [
  {
    name: 'marche',
    run(data, ctx) {
      log?.push(`marche:${ctx.tick}`);
      data.tirages.push(ctx.rng('marche').int(0, 99));
    },
  },
  {
    name: 'finances',
    run(data, ctx) {
      log?.push(`finances:${ctx.tick}`);
      data.total += ctx.rng('finances').int(1, 10);
    },
  },
  {
    name: 'mensuel',
    every: 4,
    run(data, ctx) {
      log?.push(`mensuel:${ctx.tick}`);
      data.journal.push(`mois@${ctx.tick}`);
      ctx.emit({ kind: 'rapport-mensuel', payload: { tick: ctx.tick } });
    },
  },
];

const sim = createSimulation<Data>({
  streams: ['marche', 'finances', 'inutilise'],
  phases: phases(),
});
const start = (seed: number | string = 'graine') =>
  sim.newState(seed, { journal: [], total: 0, tirages: [] });

describe('calendrier 4-4-5', () => {
  it('une année fait 52 semaines et 12 mois', () => {
    expect(MONTH_LENGTHS.reduce((a, b) => a + b, 0)).toBe(WEEKS_PER_YEAR);
    expect(MONTH_LENGTHS).toHaveLength(12);
  });

  it('numérote correctement la première année', () => {
    expect(calendarOf(0)).toMatchObject({
      year: 0,
      weekOfYear: 1,
      month: 1,
      weekOfMonth: 1,
      isMonthStart: true,
      isMonthEnd: false,
    });
    expect(calendarOf(3)).toMatchObject({ month: 1, weekOfMonth: 4, isMonthEnd: true });
    expect(calendarOf(4)).toMatchObject({ month: 2, weekOfMonth: 1 });
    expect(calendarOf(8)).toMatchObject({ month: 3, weekOfMonth: 1 });
    expect(calendarOf(12)).toMatchObject({ month: 3, weekOfMonth: 5, isMonthEnd: true });
    expect(calendarOf(51)).toMatchObject({
      month: 12,
      weekOfYear: 52,
      isMonthEnd: true,
      isYearEnd: true,
    });
    expect(calendarOf(52)).toMatchObject({ year: 1, weekOfYear: 1, month: 1 });
  });

  it("chaque année compte exactement 12 fins de mois et 1 fin d'année", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 30 }), (year) => {
        let monthEnds = 0;
        let yearEnds = 0;
        for (let w = 0; w < WEEKS_PER_YEAR; w += 1) {
          const date = calendarOf(year * WEEKS_PER_YEAR + w);
          if (date.isMonthEnd) monthEnds += 1;
          if (date.isYearEnd) yearEnds += 1;
        }
        return monthEnds === 12 && yearEnds === 1;
      }),
    );
  });

  it('refuse un indice invalide', () => {
    expect(() => calendarOf(-1)).toThrow(RangeError);
    expect(() => calendarOf(1.5)).toThrow(RangeError);
  });
});

describe('boucle de ticks', () => {
  it("exécute les phases dans l'ordre de la définition, à chaque tick", () => {
    const log: string[] = [];
    const local = createSimulation<Data>({ streams: ['marche', 'finances'], phases: phases(log) });
    local.step(local.newState(1, { journal: [], total: 0, tirages: [] }));
    expect(log).toEqual(['marche:0', 'finances:0']);
  });

  it('respecte la périodicité (« every ») : la phase mensuelle tombe aux semaines 4, 8, 12…', () => {
    const result = sim.run(start(), 12);
    expect(result.state.data.journal).toEqual(['mois@3', 'mois@7', 'mois@11']);
    expect(result.signals.map((s) => s.kind)).toEqual([
      'rapport-mensuel',
      'rapport-mensuel',
      'rapport-mensuel',
    ]);
    expect(result.state.tick).toBe(12);
  });

  it("ne modifie jamais l'état reçu (step et run)", () => {
    const initial = start();
    const snapshot = cloneJson(initial);
    sim.step(initial);
    sim.run(initial, 20);
    expect(initial).toEqual(snapshot);
  });

  it('est déterministe : même graine, même hash après 100 semaines', () => {
    expect(hashState(sim.run(start('A'), 100).state)).toBe(
      hashState(sim.run(start('A'), 100).state),
    );
    expect(hashState(sim.run(start('A'), 100).state)).not.toBe(
      hashState(sim.run(start('B'), 100).state),
    );
  });

  it('run(n) équivaut à n appels de step (même hash)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 40 }), fc.string(), (n, seed) => {
        let state = start(seed);
        for (let i = 0; i < n; i += 1) state = sim.step(state).state;
        return hashState(state) === hashState(sim.run(start(seed), n).state);
      }),
    );
  });

  it("découper un run en deux donne le même résultat qu'un run d'un bloc", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 30 }), fc.integer({ min: 0, max: 30 }), (a, b) => {
        const whole = sim.run(start('s'), a + b).state;
        const half = sim.run(sim.run(start('s'), a).state, b).state;
        return hashState(whole) === hashState(half);
      }),
    );
  });

  it('ne fait avancer que les flux utilisés', () => {
    const before = start();
    const after = sim.step(before).state;
    expect(after.streams['marche']).not.toEqual(before.streams['marche']);
    expect(after.streams['finances']).not.toEqual(before.streams['finances']);
    expect(after.streams['inutilise']).toEqual(before.streams['inutilise']);
  });

  it('rejette un flux inconnu', () => {
    const bad = createSimulation<Data>({
      streams: ['marche'],
      phases: [{ name: 'p', run: (_d, ctx) => void ctx.rng('absent') }],
    });
    expect(() => bad.step(bad.newState(1, { journal: [], total: 0, tirages: [] }))).toThrow(
      RangeError,
    );
  });

  it('permet à une phase de renvoyer un remplaçant des données', () => {
    const replace = createSimulation<{ n: number }>({
      streams: [],
      phases: [{ name: 'remplace', run: (d) => ({ n: d.n + 10 }) }],
    });
    expect(replace.step(replace.newState(1, { n: 1 })).state.data).toEqual({ n: 11 });
  });

  it('refuse les définitions invalides', () => {
    const noop = (): void => undefined;
    expect(() => createSimulation({ streams: ['a', 'a'], phases: [] })).toThrow(RangeError);
    expect(() =>
      createSimulation({
        streams: [],
        phases: [
          { name: 'x', run: noop },
          { name: 'x', run: noop },
        ],
      }),
    ).toThrow(RangeError);
    expect(() =>
      createSimulation({ streams: [], phases: [{ name: 'x', every: 0, run: noop }] }),
    ).toThrow(RangeError);
  });

  it('refuse un nombre de ticks invalide', () => {
    expect(() => sim.run(start(), -1)).toThrow(RangeError);
    expect(() => sim.run(start(), 1.5)).toThrow(RangeError);
    expect(sim.run(start(), 0).ticksRun).toBe(0);
  });
});

describe('signaux et auto-pause', () => {
  type Alerte = Signal & { kind: 'alerte' | 'info' };
  const alerting = createSimulation<{ n: number }, Alerte>({
    streams: [],
    phases: [
      {
        name: 'p',
        run(data, ctx) {
          data.n += 1;
          ctx.emit({ kind: 'info' });
          if (data.n === 5) ctx.emit({ kind: 'alerte', interrupt: true });
        },
      },
    ],
  });

  it("s'arrête à la fin du tick qui produit une interruption", () => {
    const result = alerting.run(alerting.newState(1, { n: 0 }), 100, { stopOnInterrupt: true });
    expect(result.ticksRun).toBe(5);
    expect(result.interrupted).toBe(true);
    expect(result.state.data.n).toBe(5);
    expect(result.signals.map((s) => s.kind)).toEqual([
      'info',
      'info',
      'info',
      'info',
      'info',
      'alerte',
    ]);
  });

  it('ignore les interruptions si on ne les demande pas', () => {
    const result = alerting.run(alerting.newState(1, { n: 0 }), 10);
    expect(result.ticksRun).toBe(10);
    expect(result.interrupted).toBe(false);
  });

  it('peut reprendre après une interruption', () => {
    const first = alerting.run(alerting.newState(1, { n: 0 }), 100, { stopOnInterrupt: true });
    const second = alerting.run(first.state, 3, { stopOnInterrupt: true });
    expect(second.ticksRun).toBe(3);
    expect(second.state.tick).toBe(8);
  });
});

describe('cloneJson', () => {
  it('copie profondément sans partager de référence', () => {
    const original = { a: [1, { b: 2 }], c: null, d: 'x' };
    const copy = cloneJson(original);
    expect(copy).toEqual(original);
    expect(copy.a).not.toBe(original.a);
    (copy.a[1] as { b: number }).b = 99;
    expect((original.a[1] as { b: number }).b).toBe(2);
  });
});
