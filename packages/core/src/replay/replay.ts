import { hashState } from '../hash';
import type { Seed } from '../rng/seed';
import {
  type Action,
  type Game,
  type JournalEntry,
  ReplayError,
  type Session,
  type Signal,
} from '../sim';

/**
 * Preuve de partie : tout ce qu'il faut pour qu'un tiers (le serveur du défi du jour) rejoue la
 * partie et vérifie le résultat annoncé, sans faire confiance au client.
 */
export interface ReplayProof<A extends Action> {
  seed: Seed;
  journal: readonly JournalEntry<A>[];
  /** Semaine finale de la partie. */
  untilTick: number;
  /** Hash de l'état final annoncé par le client. */
  hash: string;
}

export type Checkpoint = readonly [tick: number, hash: string];

/** Hash de l'état complet d'une partie (tick, graine, flux aléatoires, données). */
export const hashSession = <G, A extends Action>(session: Session<G, A>): string =>
  hashState(session.engine);

/**
 * Rejoue une partie en relevant le hash de l'état toutes les `every` semaines (et à la dernière).
 * Deux exécutions censées être identiques, sur deux machines, peuvent comparer leurs points de
 * contrôle pour savoir **à quelle semaine** elles divergent, au lieu de seulement constater que
 * les états finaux diffèrent.
 */
export function replayWithCheckpoints<G, A extends Action, S extends Signal>(
  game: Game<G, A, S>,
  seed: Seed,
  initialData: G,
  journal: readonly JournalEntry<A>[],
  untilTick: number,
  every = 4,
): { session: Session<G, A>; checkpoints: Checkpoint[] } {
  if (!Number.isInteger(every) || every < 1)
    throw new RangeError('Intervalle de points de contrôle invalide');
  const checkpoints: Checkpoint[] = [];
  const session = game.replay(seed, initialData, journal, untilTick, {
    onTick(engine) {
      if (engine.tick % every === 0 || engine.tick === untilTick) {
        const last = checkpoints[checkpoints.length - 1];
        // Un même tick peut être relevé deux fois (multiple de `every` et dernier) : on garde le dernier
        if (last && last[0] === engine.tick) checkpoints.pop();
        checkpoints.push([engine.tick, hashState(engine)]);
      }
    },
  });
  return { session, checkpoints };
}

/** Première semaine où deux listes de points de contrôle diffèrent, ou `null` si identiques. */
export function firstDivergence(a: readonly Checkpoint[], b: readonly Checkpoint[]): number | null {
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const left = a[i];
    const right = b[i];
    if (!left || !right) return (left ?? right)?.[0] ?? null;
    if (left[0] !== right[0] || left[1] !== right[1]) return Math.min(left[0], right[0]);
  }
  return null;
}

export type Verification =
  | { ok: true; hash: string }
  | { ok: false; reason: 'journal-invalide'; error: ReplayError | RangeError }
  | { ok: false; reason: 'hash-different'; expected: string; actual: string };

/** Rejoue une preuve et compare le hash final. Ne lève jamais : un journal falsifié est un refus, pas une exception. */
export function verifyReplay<G, A extends Action, S extends Signal>(
  game: Game<G, A, S>,
  initialData: G,
  proof: ReplayProof<A>,
): Verification {
  let session: Session<G, A>;
  try {
    session = game.replay(proof.seed, initialData, proof.journal, proof.untilTick);
  } catch (error) {
    if (error instanceof ReplayError || error instanceof RangeError) {
      return { ok: false, reason: 'journal-invalide', error };
    }
    throw error;
  }
  const actual = hashSession(session);
  return actual === proof.hash
    ? { ok: true, hash: actual }
    : { ok: false, reason: 'hash-different', expected: proof.hash, actual };
}

/** Construit la preuve d'une partie terminée (côté client, avant envoi). */
export function proofOf<G, A extends Action>(session: Session<G, A>): ReplayProof<A> {
  return {
    seed: session.engine.seed,
    journal: session.journal,
    untilTick: session.engine.tick,
    hash: hashSession(session),
  };
}

/**
 * Vérifie le déterminisme d'un scénario : la partie jouée, son rejeu, et un second rejeu doivent
 * donner exactement le même hash. À utiliser dans les tests de chaque jeu.
 */
export function checkDeterminism<G, A extends Action, S extends Signal>(
  game: Game<G, A, S>,
  initialData: G,
  played: Session<G, A>,
): { deterministic: boolean; hashes: [string, string, string] } {
  const first = game.replay(played.engine.seed, initialData, played.journal, played.engine.tick);
  const second = game.replay(played.engine.seed, initialData, played.journal, played.engine.tick);
  const hashes: [string, string, string] = [
    hashSession(played),
    hashSession(first),
    hashSession(second),
  ];
  return { deterministic: hashes[0] === hashes[1] && hashes[1] === hashes[2], hashes };
}
