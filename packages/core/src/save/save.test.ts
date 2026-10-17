import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { hashState } from '../hash';
import { type Session, createGame, reject } from '../sim';
import { type Migration, createSaveFormat } from './index';

/** Mini-jeu : v3 est le format courant. */
interface Shop {
  tresorerie: number;
  stock: number;
  prix: number;
}
type ShopAction = { type: 'achat'; quantite: number };

const game = createGame<Shop, ShopAction>({
  streams: ['marche'],
  phases: [
    {
      name: 'cours',
      run(s, ctx) {
        s.prix = Math.max(1, s.prix + ctx.rng('marche').int(-1, 1));
      },
    },
  ],
  actions: {
    achat: {
      validate: (s, a) =>
        s.tresorerie >= a.quantite * s.prix && a.quantite > 0 ? null : reject('fonds'),
      apply(s, a) {
        s.tresorerie -= a.quantite * s.prix;
        s.stock += a.quantite;
      },
    },
  },
});

const migrations: Migration[] = [
  {
    // v1 → v2 : « cash » devient « tresorerie »
    from: 1,
    migrate(payload) {
      const data = payload.engine['data'] as Record<string, unknown>;
      data['tresorerie'] = data['cash'];
      delete data['cash'];
      return payload;
    },
  },
  {
    // v2 → v3 : ajout du prix, et « acheter » devient « achat »
    from: 2,
    migrate(payload) {
      (payload.engine['data'] as Record<string, unknown>)['prix'] = 10;
      for (const entry of payload.journal as Array<{ action: { type: string } }>) {
        if (entry.action.type === 'acheter') entry.action.type = 'achat';
      }
      return payload;
    },
  },
];

const format = createSaveFormat<Shop, ShopAction>({ schema: 'boutique', version: 3, migrations });
const fresh = () => game.newSession('graine', { tresorerie: 1000, stock: 0, prix: 10 });

function played(): Session<Shop, ShopAction> {
  let session = game.advance(fresh(), 4).session;
  const result = game.dispatch(session, { type: 'achat', quantite: 3 });
  if (!result.ok) throw new Error('attendu');
  session = game.advance(result.session, 5).session;
  return session;
}

describe('écriture et lecture', () => {
  it("relit exactement la partie écrite, et peut la continuer à l'identique", () => {
    const session = played();
    const loaded = format.load(format.serialize(session, { emplacement: 'A' }));
    expect(loaded).toMatchObject({ ok: true, migratedFrom: null, meta: { emplacement: 'A' } });
    if (!loaded.ok) return;
    expect(hashState(loaded.session.engine)).toBe(hashState(session.engine));
    // la suite de la simulation est identique que l'on parte de la partie ou de la sauvegarde
    expect(hashState(game.advance(loaded.session, 12).session.engine)).toBe(
      hashState(game.advance(session, 12).session.engine),
    );
  });

  it('survit à un aller-retour par du texte JSON', () => {
    const session = played();
    const text = format.toJson(format.serialize(session));
    const loaded = format.loadText(text);
    expect(loaded.ok && hashState(loaded.session.engine)).toBe(hashState(session.engine));
  });

  it('écrit un texte identique pour un même état (clés triées)', () => {
    const a = format.toJson(format.serialize(played(), { b: 1, a: 2 }));
    const b = format.toJson(format.serialize(played(), { a: 2, b: 1 }));
    expect(a).toBe(b);
  });

  it('une sauvegarde rechargée se rejoue au même hash', () => {
    const session = played();
    const loaded = format.loadText(format.toJson(format.serialize(session)));
    if (!loaded.ok) throw new Error('attendu');
    const replayed = game.replay(
      'graine',
      { tresorerie: 1000, stock: 0, prix: 10 },
      loaded.session.journal,
      loaded.session.engine.tick,
    );
    expect(hashState(replayed.engine)).toBe(hashState(session.engine));
  });

  it('ne modifie pas la partie en la sérialisant, et ne partage rien avec elle', () => {
    const session = played();
    const before = hashState(session.engine);
    const envelope = format.serialize(session);
    expect(hashState(session.engine)).toBe(before);
    envelope.engine.data.stock = 999;
    expect(session.engine.data.stock).not.toBe(999);
  });

  it('expose la semaine en tête de fichier', () => {
    expect(format.serialize(played()).tick).toBe(9);
  });
});

describe('migrations (sauvegardes de référence figées)', () => {
  // Fichiers écrits avec les formats v1 et v2 : ils ne changent jamais, c'est leur raison d'être.
  const SAVE_V1 = `{"schema":"boutique","version":1,"tick":3,"hash":"0b070f5dda344f35","meta":{"emplacement":"vieux"},"engine":{"tick":3,"seed":"ref","streams":{"marche":[1,2,3,4]},"data":{"cash":1000,"stock":2}},"journal":[{"tick":1,"action":{"type":"acheter","quantite":2}}]}`;
  const SAVE_V2 = `{"schema":"boutique","version":2,"tick":3,"hash":"eaf1ad64efdac925","meta":{},"engine":{"tick":3,"seed":"ref","streams":{"marche":[1,2,3,4]},"data":{"tresorerie":1000,"stock":2}},"journal":[{"tick":1,"action":{"type":"acheter","quantite":2}}]}`;

  it("migre une sauvegarde v1 jusqu'à la version courante (deux sauts)", () => {
    const loaded = format.loadText(SAVE_V1);
    expect(loaded).toMatchObject({ ok: true, migratedFrom: 1, meta: { emplacement: 'vieux' } });
    if (!loaded.ok) return;
    expect(loaded.session.engine.data).toEqual({ tresorerie: 1000, stock: 2, prix: 10 });
    expect(loaded.session.journal).toEqual([{ tick: 1, action: { type: 'achat', quantite: 2 } }]);
  });

  it('migre une sauvegarde v2 (un saut)', () => {
    const loaded = format.loadText(SAVE_V2);
    expect(loaded).toMatchObject({ ok: true, migratedFrom: 2 });
    if (loaded.ok)
      expect(loaded.session.engine.data).toEqual({ tresorerie: 1000, stock: 2, prix: 10 });
  });

  it('une partie migrée continue de se simuler', () => {
    const loaded = format.loadText(SAVE_V1);
    if (!loaded.ok) throw new Error('attendu');
    const next = game.advance(loaded.session, 10).session;
    expect(next.engine.tick).toBe(13);
    // le journal migré utilise des actions que le jeu courant comprend
    const dispatched = game.dispatch(loaded.session, { type: 'achat', quantite: 1 });
    expect(dispatched.ok).toBe(true);
  });

  it('ne modifie pas la valeur brute reçue pendant la migration', () => {
    const raw = JSON.parse(SAVE_V1) as unknown;
    const snapshot = JSON.stringify(raw);
    format.load(raw);
    expect(JSON.stringify(raw)).toBe(snapshot);
  });

  it("signale l'échec d'une migration avec sa version de départ", () => {
    const broken = createSaveFormat<Shop, ShopAction>({
      schema: 'boutique',
      version: 2,
      migrations: [
        {
          from: 1,
          migrate: () => {
            throw new Error('boum');
          },
        },
      ],
    });
    expect(broken.loadText(SAVE_V1)).toEqual({
      ok: false,
      error: { code: 'migration-echouee', from: 1, detail: 'boum' },
    });
  });

  it("refuse une migration qui rend l'état invalide", () => {
    const bad = createSaveFormat<Shop, ShopAction>({
      schema: 'boutique',
      version: 2,
      migrations: [{ from: 1, migrate: (p) => ({ ...p, engine: { tick: 'x' } as never }) }],
    });
    expect(bad.loadText(SAVE_V1)).toMatchObject({ ok: false, error: { code: 'etat-invalide' } });
  });
});

describe("sauvegardes abîmées : jamais d'exception", () => {
  const good = () =>
    JSON.parse(format.toJson(format.serialize(played()))) as Record<string, unknown>;

  it("détecte une corruption de l'état (empreinte)", () => {
    const raw = good();
    ((raw['engine'] as Record<string, unknown>)['data'] as Record<string, number>)['tresorerie'] =
      10_000_000;
    expect(format.load(raw)).toMatchObject({ ok: false, error: { code: 'corrompu' } });
  });

  it('détecte une empreinte retouchée', () => {
    const raw = good();
    raw['hash'] = '0000000000000000';
    expect(format.load(raw)).toMatchObject({ ok: false, error: { code: 'corrompu' } });
  });

  it('refuse un JSON tronqué', () => {
    const text = format.toJson(format.serialize(played()));
    expect(format.loadText(text.slice(0, text.length - 20))).toEqual({
      ok: false,
      error: { code: 'json-invalide' },
    });
    expect(format.loadText('')).toEqual({ ok: false, error: { code: 'json-invalide' } });
  });

  it('refuse un autre jeu, une version future et une enveloppe incomplète', () => {
    expect(format.load({ ...good(), schema: 'autre-jeu' })).toEqual({
      ok: false,
      error: { code: 'schema-inconnu', found: 'autre-jeu' },
    });
    expect(format.load({ ...good(), version: 4 })).toEqual({
      ok: false,
      error: { code: 'version-trop-recente', found: 4, supported: 3 },
    });
    expect(format.load({ ...good(), version: 0 })).toMatchObject({
      ok: false,
      error: { code: 'enveloppe-invalide' },
    });
    expect(format.load({ ...good(), hash: undefined })).toMatchObject({
      ok: false,
      error: { code: 'enveloppe-invalide' },
    });
    expect(format.load({ ...good(), engine: null })).toMatchObject({
      ok: false,
      error: { code: 'enveloppe-invalide' },
    });
    expect(format.load({ ...good(), journal: 'x' })).toMatchObject({
      ok: false,
      error: { code: 'enveloppe-invalide' },
    });
    expect(format.load(null)).toMatchObject({ ok: false });
    expect(format.load([])).toMatchObject({ ok: false });
  });

  it('refuse un flux aléatoire invalide et un journal mal ordonné', () => {
    const raw = good();
    (raw['engine'] as { streams: Record<string, unknown> }).streams['marche'] = [1, 2, 3];
    expect(format.load(raw)).toMatchObject({ ok: false, error: { code: 'enveloppe-invalide' } });
    const unordered = {
      ...good(),
      journal: [
        { tick: 5, action: { type: 'achat' } },
        { tick: 2, action: { type: 'achat' } },
      ],
    };
    expect(format.load(unordered)).toMatchObject({
      ok: false,
      error: { code: 'enveloppe-invalide' },
    });
  });

  it("applique le contrôle d'état propre au jeu", () => {
    const strict = createSaveFormat<Shop, ShopAction>({
      schema: 'boutique',
      version: 3,
      migrations,
      validateEngine: (engine) =>
        (engine['data'] as Shop).tresorerie < 0 ? 'trésorerie négative' : null,
    });
    const session = played();
    session.engine.data.tresorerie = -5;
    expect(strict.load(strict.serialize(session))).toEqual({
      ok: false,
      error: { code: 'etat-invalide', detail: 'trésorerie négative' },
    });
  });

  it('ne lève jamais, quelle que soit la valeur reçue (propriété)', () => {
    fc.assert(
      fc.property(fc.anything(), (value) => {
        const result = format.load(value);
        return typeof result.ok === 'boolean';
      }),
      { numRuns: 500 },
    );
    fc.assert(
      fc.property(fc.string(), (text) => typeof format.loadText(text).ok === 'boolean'),
      { numRuns: 300 },
    );
  });
});

describe('définition du format', () => {
  it('exige une chaîne de migrations complète et valide', () => {
    expect(() =>
      createSaveFormat({ schema: 's', version: 3, migrations: [migrations[0] as Migration] }),
    ).toThrow(RangeError);
    expect(() => createSaveFormat({ schema: 's', version: 2, migrations: [] })).toThrow(RangeError);
    expect(() =>
      createSaveFormat({
        schema: 's',
        version: 2,
        migrations: [migrations[0] as Migration, migrations[0] as Migration],
      }),
    ).toThrow(RangeError);
    expect(() =>
      createSaveFormat({ schema: 's', version: 1, migrations: [migrations[0] as Migration] }),
    ).toThrow(RangeError);
    expect(() => createSaveFormat({ schema: 's', version: 0 })).toThrow(RangeError);
    expect(() => createSaveFormat({ schema: 's', version: 1 })).not.toThrow();
  });
});
