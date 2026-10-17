import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import { ReplayError, type Session, createGame, reject } from '../sim';
import {
  type Checkpoint,
  checkDeterminism,
  firstDivergence,
  hashSession,
  proofOf,
  replayWithCheckpoints,
  verifyReplay,
} from './index';

interface Shop {
  cash: number;
  stock: number;
  price: number;
}
type ShopAction = { type: 'acheter'; quantite: number } | { type: 'vendre'; quantite: number };

const game = createGame<Shop, ShopAction>({
  streams: ['marche'],
  phases: [
    {
      name: 'cours',
      run(shop, ctx) {
        shop.price = Math.max(1, shop.price + ctx.rng('marche').int(-2, 2));
      },
    },
  ],
  actions: {
    acheter: {
      validate: (s, a) =>
        s.cash >= a.quantite * s.price && a.quantite > 0 ? null : reject('fonds'),
      apply(s, a) {
        s.cash -= a.quantite * s.price;
        s.stock += a.quantite;
      },
    },
    vendre: {
      validate: (s, a) => (s.stock >= a.quantite && a.quantite > 0 ? null : reject('stock')),
      apply(s, a) {
        s.cash += a.quantite * s.price;
        s.stock -= a.quantite;
      },
    },
  },
});

const initial = (): Shop => ({ cash: 5000, stock: 0, price: 10 });

function play(
  seed: string,
  plan: Array<[number, ShopAction]>,
  tail = 5,
): Session<Shop, ShopAction> {
  let session = game.newSession(seed, initial());
  for (const [advance, action] of plan) {
    session = game.advance(session, advance).session;
    const result = game.dispatch(session, action);
    if (result.ok) session = result.session;
  }
  return game.advance(session, tail).session;
}

const plan: Array<[number, ShopAction]> = [
  [2, { type: 'acheter', quantite: 5 }],
  [6, { type: 'vendre', quantite: 2 }],
  [9, { type: 'acheter', quantite: 3 }],
  [4, { type: 'vendre', quantite: 4 }],
];

describe('preuve de rejeu et vérification', () => {
  it("accepte la preuve honnête d'une partie", () => {
    const played = play('défi-2026-10-17', plan);
    const proof = proofOf(played);
    expect(verifyReplay(game, initial(), proof)).toEqual({ ok: true, hash: hashSession(played) });
  });

  it('survit à un aller-retour JSON complet de la preuve (envoi au serveur)', () => {
    const proof = proofOf(play('json', plan));
    const received = JSON.parse(JSON.stringify(proof)) as typeof proof;
    expect(verifyReplay(game, initial(), received).ok).toBe(true);
  });

  it('refuse un score gonflé : le hash ne correspond plus', () => {
    const proof = proofOf(play('triche', plan));
    const result = verifyReplay(game, initial(), { ...proof, hash: '0000000000000000' });
    expect(result).toMatchObject({
      ok: false,
      reason: 'hash-different',
      expected: '0000000000000000',
    });
  });

  it('refuse un journal falsifié (action modifiée)', () => {
    const proof = proofOf(play('triche', plan));
    const forged = proof.journal.map((entry, index) =>
      index === 0 ? { ...entry, action: { type: 'acheter' as const, quantite: 1 } } : entry,
    );
    const result = verifyReplay(game, initial(), { ...proof, journal: forged });
    expect(result.ok).toBe(false);
  });

  it("refuse un journal impossible (vendre avant d'avoir acheté) sans lever d'exception", () => {
    const result = verifyReplay(game, initial(), {
      seed: 'x',
      journal: [{ tick: 0, action: { type: 'vendre', quantite: 99 } }],
      untilTick: 10,
      hash: '0000000000000000',
    });
    expect(result).toMatchObject({ ok: false, reason: 'journal-invalide' });
  });

  it("refuse une semaine finale invalide sans lever d'exception", () => {
    expect(
      verifyReplay(game, initial(), { seed: 'x', journal: [], untilTick: -3, hash: 'x' }),
    ).toMatchObject({
      ok: false,
      reason: 'journal-invalide',
    });
  });

  it('refuse la même preuve avec une autre graine', () => {
    const proof = proofOf(play('A', plan));
    expect(verifyReplay(game, initial(), { ...proof, seed: 'B' }).ok).toBe(false);
  });
});

describe('points de contrôle', () => {
  it('relève un hash toutes les N semaines et à la dernière', () => {
    const played = play('cp', plan, 3);
    const { checkpoints } = replayWithCheckpoints(
      game,
      'cp',
      initial(),
      played.journal,
      played.engine.tick,
      5,
    );
    const ticks = checkpoints.map(([tick]) => tick);
    expect(ticks[0]).toBe(0);
    expect(ticks.filter((t) => t % 5 === 0).length).toBeGreaterThan(2);
    expect(ticks[ticks.length - 1]).toBe(played.engine.tick);
    expect(new Set(ticks).size).toBe(ticks.length);
  });

  it('le dernier point de contrôle est le hash final', () => {
    const played = play('cp2', plan);
    const { checkpoints, session } = replayWithCheckpoints(
      game,
      'cp2',
      initial(),
      played.journal,
      played.engine.tick,
    );
    expect(checkpoints[checkpoints.length - 1]?.[1]).toBe(hashSession(played));
    expect(hashSession(session)).toBe(hashSession(played));
  });

  it('refuse un intervalle invalide', () => {
    expect(() => replayWithCheckpoints(game, 'x', initial(), [], 5, 0)).toThrow(RangeError);
  });

  it('localise la première semaine où deux parties divergent', () => {
    const honest = play('div', plan, 10);
    const tampered = plan.map((p, i): [number, ShopAction] =>
      i === 2 ? [p[0], { type: 'acheter', quantite: 1 }] : p,
    );
    const other = play('div', tampered, 10);
    const a = replayWithCheckpoints(game, 'div', initial(), honest.journal, 40, 1).checkpoints;
    const b = replayWithCheckpoints(game, 'div', initial(), other.journal, 40, 1).checkpoints;
    const divergence = firstDivergence(a, b);
    const tickOfTamperedAction = other.journal[2]?.tick ?? -1;
    expect(divergence).toBe(tickOfTamperedAction);
    // Avant cette semaine, tout est identique
    expect(firstDivergence(a.slice(0, divergence ?? 0), b.slice(0, divergence ?? 0))).toBeNull();
  });

  it('firstDivergence gère les listes identiques, vides et de longueurs différentes', () => {
    const a: Checkpoint[] = [
      [0, 'a'],
      [4, 'b'],
    ];
    expect(firstDivergence(a, a)).toBeNull();
    expect(firstDivergence([], [])).toBeNull();
    expect(firstDivergence(a, [[0, 'a']])).toBe(4);
    expect(
      firstDivergence(
        [
          [0, 'a'],
          [4, 'x'],
        ],
        a,
      ),
    ).toBe(4);
  });
});

describe('contrôle du déterminisme', () => {
  it("confirme qu'une partie, son rejeu et un second rejeu sont identiques (propriété)", () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 6 }),
        fc.array(
          fc.tuple(
            fc.integer({ min: 0, max: 5 }),
            fc.oneof(
              fc.record({
                type: fc.constant('acheter' as const),
                quantite: fc.integer({ min: 0, max: 4 }),
              }),
              fc.record({
                type: fc.constant('vendre' as const),
                quantite: fc.integer({ min: 0, max: 4 }),
              }),
            ),
          ),
          { maxLength: 15 },
        ),
        (seed, steps) => checkDeterminism(game, initial(), play(seed, steps)).deterministic,
      ),
      { numRuns: 100 },
    );
  });

  it('détecte un rejeu qui diverge (état initial différent mais actions toujours acceptées)', () => {
    const played = play('d', plan);
    const report = checkDeterminism(game, { ...initial(), cash: 6000 }, played);
    expect(report.deterministic).toBe(false);
    // le rejeu est reproductible entre lui-même, c'est bien l'état de départ qui diffère
    expect(report.hashes[1]).toBe(report.hashes[2]);
    expect(report.hashes[0]).not.toBe(report.hashes[1]);
  });

  it('lève une ReplayError si les actions ne sont plus acceptables au rejeu', () => {
    const played = play('d', plan);
    expect(() => checkDeterminism(game, { ...initial(), cash: 1 }, played)).toThrow(ReplayError);
  });

  it('hashSession est stable pour un même état', () => {
    const played = play('h', plan);
    expect(hashSession(played)).toBe(hashState(played.engine));
  });
});
