import { stableStringify } from '../hash/canonical';
import { hashState } from '../hash/hash';
import { type Action, type EngineState, type JournalEntry, type Session, cloneJson } from '../sim';

/**
 * Sauvegarde versionnée.
 *
 * Une sauvegarde est un fichier JSON : `{ schema, version, tick, hash, meta, engine, journal }`.
 * - `schema` identifie le jeu (une sauvegarde de Label Tycoon n'ouvre pas un autre tycoon) ;
 * - `version` est la version du **format** ; chaque évolution du format ajoute une migration ;
 * - `hash` est l'empreinte de `engine` à l'écriture : elle détecte une corruption ou une retouche ;
 * - `meta` est fournie par l'application (date, nom de l'emplacement) : le moteur ne lit jamais
 *   l'horloge, la date n'a donc rien à faire dans la simulation.
 *
 * Le chargement **ne lève jamais d'exception** sur des données invalides : il renvoie une erreur
 * typée, pour qu'une sauvegarde abîmée n'empêche jamais le jeu de démarrer.
 */

export type SaveMeta = Readonly<Record<string, string | number | boolean>>;

export interface SaveEnvelope<G, A extends Action> {
  schema: string;
  version: number;
  /** Semaine de la partie (lecture rapide, sans ouvrir l'état). */
  tick: number;
  hash: string;
  meta: SaveMeta;
  engine: EngineState<G>;
  journal: JournalEntry<A>[];
}

/** Charge utile manipulée par les migrations : du JSON non typé, car elle date d'une ancienne version. */
export interface SavePayload {
  engine: Record<string, unknown>;
  journal: unknown[];
}

/** Fait passer une sauvegarde de la version `from` à `from + 1`. Fonction pure sur une copie. */
export interface Migration {
  readonly from: number;
  readonly migrate: (payload: SavePayload) => SavePayload;
}

export interface SaveFormatOptions {
  readonly schema: string;
  /** Version courante du format. */
  readonly version: number;
  /** Migrations de la version 1 à la version courante, une par saut, sans trou. */
  readonly migrations?: readonly Migration[];
  /**
   * Contrôle supplémentaire de l'état après migration (par exemple un schéma zod côté jeu).
   * Renvoie un message d'erreur, ou `null` si l'état est valide.
   */
  readonly validateEngine?: (engine: Record<string, unknown>) => string | null;
}

export type LoadError =
  | { code: 'json-invalide' }
  | { code: 'enveloppe-invalide'; detail: string }
  | { code: 'schema-inconnu'; found: string }
  | { code: 'version-trop-recente'; found: number; supported: number }
  | { code: 'corrompu'; expected: string; actual: string }
  | { code: 'migration-echouee'; from: number; detail: string }
  | { code: 'etat-invalide'; detail: string };

export type LoadResult<G, A extends Action> =
  | { ok: true; session: Session<G, A>; meta: SaveMeta; migratedFrom: number | null }
  | { ok: false; error: LoadError };

export interface SaveFormat<G, A extends Action> {
  readonly schema: string;
  readonly version: number;
  /** Construit l'enveloppe d'une partie. `meta` vient de l'application. */
  serialize(session: Session<G, A>, meta?: SaveMeta): SaveEnvelope<G, A>;
  /** Texte JSON canonique (clés triées) : deux écritures du même état sont identiques. */
  toJson(envelope: SaveEnvelope<G, A>): string;
  /** Charge une valeur déjà parsée (par exemple lue en IndexedDB). */
  load(raw: unknown): LoadResult<G, A>;
  /** Charge depuis du texte JSON (import de fichier). */
  loadText(text: string): LoadResult<G, A>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Forme minimale d'un état de moteur : sans elle, impossible de reprendre la partie. */
function engineShapeProblem(engine: unknown): string | null {
  if (!isRecord(engine)) return "l'état n'est pas un objet";
  if (!Number.isInteger(engine['tick']) || (engine['tick'] as number) < 0) return 'tick invalide';
  if (typeof engine['seed'] !== 'string' && typeof engine['seed'] !== 'number')
    return 'graine invalide';
  if (!isRecord(engine['streams'])) return 'flux aléatoires manquants';
  for (const [name, state] of Object.entries(engine['streams'])) {
    if (
      !Array.isArray(state) ||
      state.length !== 4 ||
      state.some((w) => !Number.isInteger(w) || w < 0 || w > 0xffffffff)
    ) {
      return `flux aléatoire invalide (${name})`;
    }
  }
  if (!('data' in engine)) return 'données de jeu manquantes';
  return null;
}

function journalProblem(journal: unknown): string | null {
  if (!Array.isArray(journal)) return "le journal n'est pas une liste";
  let previous = 0;
  for (let i = 0; i < journal.length; i += 1) {
    const entry: unknown = journal[i];
    if (
      !isRecord(entry) ||
      !Number.isInteger(entry['tick']) ||
      (entry['tick'] as number) < previous
    ) {
      return `entrée ${i} du journal invalide ou mal ordonnée`;
    }
    if (!isRecord(entry['action']) || typeof entry['action']['type'] !== 'string') {
      return `action invalide à l'entrée ${i} du journal`;
    }
    previous = entry['tick'] as number;
  }
  return null;
}

export function createSaveFormat<G, A extends Action>(
  options: SaveFormatOptions,
): SaveFormat<G, A> {
  const { schema, version } = options;
  if (!Number.isInteger(version) || version < 1) throw new RangeError('Version de format invalide');

  const migrations = new Map<number, Migration>();
  for (const migration of options.migrations ?? []) {
    if (!Number.isInteger(migration.from) || migration.from < 1 || migration.from >= version) {
      throw new RangeError(`Migration hors plage : depuis la version ${migration.from}`);
    }
    if (migrations.has(migration.from))
      throw new RangeError(`Migration dupliquée depuis la version ${migration.from}`);
    migrations.set(migration.from, migration);
  }
  for (let from = 1; from < version; from += 1) {
    if (!migrations.has(from)) throw new RangeError(`Migration manquante : ${from} → ${from + 1}`);
  }

  function load(raw: unknown): LoadResult<G, A> {
    if (!isRecord(raw))
      return { ok: false, error: { code: 'enveloppe-invalide', detail: "ce n'est pas un objet" } };
    if (typeof raw['schema'] !== 'string')
      return { ok: false, error: { code: 'enveloppe-invalide', detail: 'schéma manquant' } };
    if (raw['schema'] !== schema)
      return { ok: false, error: { code: 'schema-inconnu', found: raw['schema'] } };
    const savedVersion = raw['version'];
    if (!Number.isInteger(savedVersion) || (savedVersion as number) < 1) {
      return { ok: false, error: { code: 'enveloppe-invalide', detail: 'version invalide' } };
    }
    if ((savedVersion as number) > version) {
      return {
        ok: false,
        error: { code: 'version-trop-recente', found: savedVersion as number, supported: version },
      };
    }
    if (typeof raw['hash'] !== 'string')
      return { ok: false, error: { code: 'enveloppe-invalide', detail: 'empreinte manquante' } };

    const shapeBefore = engineShapeProblem(raw['engine']);
    if (shapeBefore)
      return { ok: false, error: { code: 'enveloppe-invalide', detail: shapeBefore } };
    const journalBefore = journalProblem(raw['journal']);
    if (journalBefore)
      return { ok: false, error: { code: 'enveloppe-invalide', detail: journalBefore } };

    // Intégrité contrôlée AVANT migration : l'empreinte date de la version d'écriture
    let actual: string;
    try {
      actual = hashState(raw['engine']);
    } catch (error) {
      return { ok: false, error: { code: 'enveloppe-invalide', detail: (error as Error).message } };
    }
    if (actual !== raw['hash'])
      return { ok: false, error: { code: 'corrompu', expected: raw['hash'], actual } };

    let payload: SavePayload = cloneJson({
      engine: raw['engine'] as Record<string, unknown>,
      journal: raw['journal'] as unknown[],
    });
    for (let from = savedVersion as number; from < version; from += 1) {
      try {
        payload = (migrations.get(from) as Migration).migrate(payload);
      } catch (error) {
        return {
          ok: false,
          error: { code: 'migration-echouee', from, detail: (error as Error).message },
        };
      }
    }

    const shapeAfter = engineShapeProblem(payload.engine) ?? journalProblem(payload.journal);
    if (shapeAfter) return { ok: false, error: { code: 'etat-invalide', detail: shapeAfter } };
    const custom = options.validateEngine?.(payload.engine);
    if (custom) return { ok: false, error: { code: 'etat-invalide', detail: custom } };

    const meta = isRecord(raw['meta']) ? (raw['meta'] as SaveMeta) : {};
    return {
      ok: true,
      session: {
        engine: payload.engine as unknown as EngineState<G>,
        journal: payload.journal as JournalEntry<A>[],
      },
      meta,
      migratedFrom: savedVersion === version ? null : (savedVersion as number),
    };
  }

  return {
    schema,
    version,
    serialize(session, meta = {}) {
      return {
        schema,
        version,
        tick: session.engine.tick,
        hash: hashState(session.engine),
        meta,
        engine: cloneJson(session.engine),
        journal: cloneJson(session.journal),
      };
    },
    toJson: (envelope) => stableStringify(envelope),
    load,
    loadText(text) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: { code: 'json-invalide' } };
      }
      return load(parsed);
    },
  };
}
