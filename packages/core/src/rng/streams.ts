import { Rng, stateFromSeed } from './rng';
import type { Seed } from './seed';
import type { RngState } from './xoshiro';

/**
 * Flux aléatoires indépendants, un par système (marché, repérage, production…).
 *
 * Pourquoi : avec un seul flux, ajouter un tirage dans un système décale tous les tirages
 * suivants de tous les autres systèmes, et casse les graines partagées et les replays d'une
 * version à l'autre. Avec un flux par système, chaque système n'est affecté que par lui-même.
 */
export type RngStreams<Name extends string = string> = Readonly<Record<Name, RngState>>;

/** État initial d'un flux nommé : dérivé de la graine maîtresse et du nom, rien d'autre. */
export function streamState(masterSeed: Seed, name: string): RngState {
  return stateFromSeed(`${String(masterSeed)}\u0000${name}`);
}

export function createStreams<Name extends string>(
  masterSeed: Seed,
  names: readonly Name[],
): RngStreams<Name> {
  const entries = names.map((name) => [name, streamState(masterSeed, name)] as const);
  return Object.fromEntries(entries) as RngStreams<Name>;
}

/**
 * Exécute `use` avec le générateur du flux `name`, et renvoie le résultat avec les flux mis à
 * jour (seul le flux utilisé change). Les flux d'origine ne sont pas modifiés.
 */
export function withStream<S extends RngStreams, T>(
  streams: S,
  name: keyof S & string,
  use: (rng: Rng) => T,
): [T, S] {
  const rng = new Rng(streams[name] as RngState);
  const result = use(rng);
  return [result, { ...streams, [name]: rng.snapshot() }];
}
