import { describe, expect, it } from 'vitest';
import { hashState } from './hash';
import { cloneJson, createSimulation } from './sim';
import { Rng, exp, ln, sin, cos } from './index';

/**
 * Budgets de performance du moteur. Les seuils sont volontairement larges (plusieurs fois la
 * mesure sur une machine moyenne) pour ne pas être fragiles en intégration continue : ils
 * attrapent une régression d'ordre de grandeur, pas une variation de quelques pour cent.
 *
 * Contexte : le jeu doit simuler 52 semaines en moins de 200 ms (≈ 3,8 ms par semaine) et 10 ans
 * en moins de 3 s. Le moteur ne doit consommer qu'une petite part de ce budget.
 */

/** Médiane de `runs` mesures en millisecondes (les premiers passages servent à chauffer le moteur). */
function measure(fn: () => void, runs = 7): number {
  fn();
  const samples: number[] = [];
  for (let i = 0; i < runs; i += 1) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)] ?? 0;
}

/** État synthétique de la taille visée pour une partie avancée : ~2 000 objets de ~10 champs. */
function bigData(n: number) {
  return {
    artistes: Array.from({ length: n }, (_, i) => ({
      id: i,
      nom: `Artiste ${i}`,
      plume: i % 100,
      flow: (i * 7) % 100,
      charisme: (i * 13) % 100,
      moral: 60,
      fatigue: i % 50,
      fans: i * 1000,
      genres: ['rap', 'afro'],
      contrat: { avance: 5_000_00, duree: 3 },
    })),
    tresorerie: 10_000_000,
  };
}

type Big = ReturnType<typeof bigData>;

describe('budgets du moteur', () => {
  it('copie un état de 2 000 artistes en moins de 25 ms', () => {
    const data = bigData(2000);
    const ms = measure(() => void cloneJson(data));
    expect(ms).toBeLessThan(25);
  });

  it('hash un état de 2 000 artistes en moins de 60 ms', () => {
    const data = bigData(2000);
    const ms = measure(() => void hashState(data));
    expect(ms).toBeLessThan(60);
  });

  it('le coût du moteur seul est négligeable : 52 semaines de 12 phases en moins de 20 ms', () => {
    const phases = Array.from({ length: 12 }, (_, i) => ({
      name: `phase-${i}`,
      run(data: { n: number }, ctx: { rng(s: string): Rng }) {
        data.n += ctx.rng('a').int(0, 3);
      },
    }));
    const sim = createSimulation<{ n: number }>({ streams: ['a'], phases });
    const start = sim.newState('perf', { n: 0 });
    expect(measure(() => void sim.run(start, 52))).toBeLessThan(20);
  });

  it("run copie l'état une seule fois : 52 semaines sur 2 000 artistes en moins de 120 ms", () => {
    const sim = createSimulation<Big>({
      streams: ['a'],
      phases: [
        {
          name: 'tick',
          run(data, ctx) {
            for (const artiste of data.artistes)
              artiste.fatigue = (artiste.fatigue + ctx.rng('a').int(0, 2)) % 100;
          },
        },
      ],
    });
    const start = sim.newState('perf', bigData(2000));
    expect(measure(() => void sim.run(start, 52), 5)).toBeLessThan(120);
  });

  it('runOwned évite la copie : pas plus lent que run, même état', () => {
    const sim = createSimulation<{ n: number; pad: number[] }>({
      streams: [],
      phases: [{ name: 'x', run: (d) => void (d.n += 1) }],
    });
    const start = sim.newState('x', { n: 0, pad: new Array<number>(50_000).fill(1) });
    const viaRun = measure(() => void sim.run(start, 100), 5);
    const viaOwned = measure(() => void sim.runOwned(cloneJson(start), 100), 5);
    expect(viaOwned).toBeLessThan(viaRun * 3 + 5);
  });

  it("tire 1 million d'entiers aléatoires en moins de 150 ms", () => {
    const ms = measure(() => {
      const rng = Rng.fromSeed('perf');
      let sum = 0;
      for (let i = 0; i < 1_000_000; i += 1) sum += rng.int(0, 99);
      expect(sum).toBeGreaterThan(0);
    }, 5);
    expect(ms).toBeLessThan(400);
  });

  it('calcule 200 000 gaussiens (ln et cos maison) en moins de 400 ms', () => {
    const ms = measure(() => {
      const rng = Rng.fromSeed('gauss');
      let sum = 0;
      for (let i = 0; i < 200_000; i += 1) sum += rng.gaussian();
      expect(Number.isFinite(sum)).toBe(true);
    }, 5);
    expect(ms).toBeLessThan(400);
  });

  it('exp, ln, sin et cos maison : 200 000 appels de chaque en moins de 400 ms', () => {
    const ms = measure(() => {
      let acc = 0;
      for (let i = 1; i <= 200_000; i += 1) {
        const x = (i % 1000) / 100;
        acc += exp(-x) + ln(1 + x) + sin(x) + cos(x);
      }
      expect(Number.isFinite(acc)).toBe(true);
    }, 5);
    expect(ms).toBeLessThan(400);
  });
});
