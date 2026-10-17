import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import { type Action, ReplayError, cloneJson, createGame, reject } from './index';
import type { Signal } from './index';

/** Mini-jeu de test : une boutique avec un cours aléatoire. */
interface Shop {
  cash: number;
  stock: number;
  price: number;
}

type ShopAction =
  | { type: 'acheter'; quantite: number }
  | { type: 'vendre'; quantite: number }
  | { type: 'fixer-prix'; prix: number };

const game = createGame<Shop, ShopAction, Signal>({
  streams: ['marche', 'actions'],
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
      validate: (shop, a) => {
        if (a.quantite <= 0) return reject('quantite-invalide');
        return shop.cash >= a.quantite * shop.price
          ? null
          : reject('fonds-insuffisants', { besoin: a.quantite * shop.price });
      },
      apply(shop, a, ctx) {
        // une action peut tirer au hasard (ici une remise), dans un flux nommé
        const remise = ctx.rng('actions').int(0, 1);
        shop.cash -= a.quantite * shop.price - remise;
        shop.stock += a.quantite;
        ctx.emit({ kind: 'achat' });
      },
    },
    vendre: {
      validate: (shop, a) =>
        a.quantite > 0 && shop.stock >= a.quantite ? null : reject('stock-insuffisant'),
      apply(shop, a) {
        shop.cash += a.quantite * shop.price;
        shop.stock -= a.quantite;
      },
    },
    'fixer-prix': {
      validate: (_s, a) => (a.prix >= 1 ? null : reject('prix-invalide')),
      apply: (shop, a) => ({ ...shop, price: a.prix }),
    },
  },
});

const initial = (): Shop => ({ cash: 1000, stock: 0, price: 10 });
const fresh = (seed: number | string = 'graine') => game.newSession(seed, initial());

describe('dispatch', () => {
  it('applique une action valide et la journalise à la bonne semaine', () => {
    let session = fresh();
    session = game.advance(session, 3).session;
    const result = game.dispatch(session, { type: 'acheter', quantite: 2 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session.engine.data.stock).toBe(2);
    expect(result.session.journal).toEqual([{ tick: 3, action: { type: 'acheter', quantite: 2 } }]);
    expect(result.signals).toEqual([{ kind: 'achat' }]);
  });

  it("refuse une action invalide, sans toucher l'état ni le journal", () => {
    const session = fresh();
    const snapshot = cloneJson(session);
    const result = game.dispatch(session, { type: 'vendre', quantite: 5 });
    expect(result).toMatchObject({ ok: false, rejection: { code: 'stock-insuffisant' } });
    expect(session).toEqual(snapshot);
    if (!result.ok) expect(result.session).toBe(session);
  });

  it('transmet les paramètres du refus', () => {
    const result = game.dispatch(fresh(), { type: 'acheter', quantite: 500 });
    expect(result).toMatchObject({
      ok: false,
      rejection: { code: 'fonds-insuffisants', params: { besoin: 5000 } },
    });
  });

  it('ne modifie jamais la session reçue, même en cas de succès', () => {
    const session = fresh();
    const snapshot = cloneJson(session);
    game.dispatch(session, { type: 'acheter', quantite: 1 });
    expect(session).toEqual(snapshot);
  });

  it("refuse un type d'action inconnu", () => {
    const result = game.dispatch(fresh(), { type: 'inconnu' } as unknown as ShopAction);
    expect(result).toMatchObject({
      ok: false,
      rejection: { code: 'action-inconnue', params: { type: 'inconnu' } },
    });
  });

  it("refuse une action qui n'est pas de la donnée JSON simple", () => {
    expect(() => game.dispatch(fresh(), { type: 'acheter', quantite: Number.NaN })).toThrow(
      TypeError,
    );
    expect(() =>
      game.dispatch(fresh(), {
        type: 'acheter',
        quantite: 1,
        extra: new Date(0),
      } as unknown as ShopAction),
    ).toThrow(TypeError);
  });

  it('permet à une action de renvoyer un remplaçant des données', () => {
    const result = game.dispatch(fresh(), { type: 'fixer-prix', prix: 42 });
    expect(result.ok && result.session.engine.data.price).toBe(42);
  });

  it('une action qui tire au hasard avance son flux, et pas les autres', () => {
    const session = fresh();
    const result = game.dispatch(session, { type: 'acheter', quantite: 1 });
    if (!result.ok) throw new Error('attendu : succès');
    expect(result.session.engine.streams['actions']).not.toEqual(session.engine.streams['actions']);
    expect(result.session.engine.streams['marche']).toEqual(session.engine.streams['marche']);
  });
});

describe('replay', () => {
  type Step = { avance: number; action: ShopAction };
  const actionArb: fc.Arbitrary<ShopAction> = fc.oneof(
    fc.record({ type: fc.constant('acheter' as const), quantite: fc.integer({ min: 0, max: 6 }) }),
    fc.record({ type: fc.constant('vendre' as const), quantite: fc.integer({ min: 0, max: 6 }) }),
    fc.record({ type: fc.constant('fixer-prix' as const), prix: fc.integer({ min: 0, max: 30 }) }),
  );
  const stepsArb = fc.array(
    fc.record({ avance: fc.integer({ min: 0, max: 4 }), action: actionArb }),
    { maxLength: 25 },
  );

  /** Joue une partie « en direct » : on avance, puis on tente une action (refusée = ignorée). */
  function playLive(seed: string, steps: Step[], tail: number) {
    let session = fresh(seed);
    for (const step of steps) {
      session = game.advance(session, step.avance).session;
      const result = game.dispatch(session, step.action);
      if (result.ok) session = result.session;
    }
    return game.advance(session, tail).session;
  }

  it('reproduit la partie jouée au bit près (propriété)', () => {
    fc.assert(
      fc.property(
        fc.string({ maxLength: 8 }),
        stepsArb,
        fc.integer({ min: 0, max: 6 }),
        (seed, steps, tail) => {
          const live = playLive(seed, steps, tail);
          const replayed = game.replay(seed, initial(), live.journal, live.engine.tick);
          return (
            hashState(replayed.engine) === hashState(live.engine) &&
            hashState(replayed.journal) === hashState(live.journal)
          );
        },
      ),
      { numRuns: 150 },
    );
  });

  it('survit à un aller-retour JSON du journal', () => {
    const live = playLive(
      'json',
      [
        { avance: 2, action: { type: 'acheter', quantite: 3 } },
        { avance: 5, action: { type: 'vendre', quantite: 1 } },
      ],
      4,
    );
    const journal = JSON.parse(JSON.stringify(live.journal)) as typeof live.journal;
    expect(hashState(game.replay('json', initial(), journal, live.engine.tick).engine)).toBe(
      hashState(live.engine),
    );
  });

  it('applique aussi les actions jouées après le dernier tick', () => {
    let session = game.advance(fresh('fin'), 5).session;
    const result = game.dispatch(session, { type: 'acheter', quantite: 1 });
    if (!result.ok) throw new Error('attendu : succès');
    session = result.session;
    const replayed = game.replay('fin', initial(), session.journal, 5);
    expect(hashState(replayed.engine)).toBe(hashState(session.engine));
  });

  it('rejette un journal mal ordonné', () => {
    const journal = [
      { tick: 4, action: { type: 'vendre', quantite: 1 } as ShopAction },
      { tick: 2, action: { type: 'vendre', quantite: 1 } as ShopAction },
    ];
    expect(() => game.replay('x', initial(), journal, 10)).toThrow(ReplayError);
  });

  it('rejette une entrée au-delà de la semaine cible', () => {
    expect(() =>
      game.replay('x', initial(), [{ tick: 9, action: { type: 'vendre', quantite: 1 } }], 5),
    ).toThrow(ReplayError);
  });

  it('rejette une action devenue invalide au rejeu, avec sa raison', () => {
    try {
      game.replay('x', initial(), [{ tick: 0, action: { type: 'vendre', quantite: 1 } }], 3);
      throw new Error('aurait dû échouer');
    } catch (error) {
      expect(error).toBeInstanceOf(ReplayError);
      expect((error as ReplayError).rejection?.code).toBe('stock-insuffisant');
      expect((error as ReplayError).index).toBe(0);
    }
  });

  it('refuse une semaine cible invalide', () => {
    expect(() => game.replay('x', initial(), [], -1)).toThrow(RangeError);
  });

  it('ne partage rien avec les données initiales fournies', () => {
    const data = initial();
    const session = game.replay('x', data, [], 4);
    expect(data).toEqual(initial());
    expect(session.engine.data).not.toBe(data);
  });
});

describe('types', () => {
  it('Action exige un champ type', () => {
    const a: Action = { type: 'x' };
    expect(a.type).toBe('x');
  });
});
