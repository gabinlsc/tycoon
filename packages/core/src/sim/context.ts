import { Rng } from '../rng/rng';
import type { RngStreams } from '../rng/streams';
import type { RngState } from '../rng/xoshiro';
import type { Signal, TickContext } from './types';

/**
 * Accès aux flux aléatoires et aux signaux pendant un tick ou une action. Partagé par la boucle
 * de simulation et par le système d'actions, pour qu'une action tire dans les mêmes flux nommés
 * que les phases (et reste donc rejouable à l'identique).
 */
export interface StreamAccess<S extends Signal> {
  ctx: TickContext<S>;
  /** Flux mis à jour, dans l'ordre fixe `names` : seuls les flux effectivement utilisés changent. */
  commit(names: readonly string[]): RngStreams;
}

export function openStreams<S extends Signal>(
  known: ReadonlySet<string>,
  streams: RngStreams,
  tick: number,
  signals: S[],
): StreamAccess<S> {
  const used = new Map<string, Rng>();
  const ctx: TickContext<S> = {
    tick,
    rng(stream) {
      if (!known.has(stream)) throw new RangeError(`Flux aléatoire inconnu : ${stream}`);
      let rng = used.get(stream);
      if (!rng) {
        rng = new Rng(streams[stream] as RngState);
        used.set(stream, rng);
      }
      return rng;
    },
    emit(signal) {
      signals.push(signal);
    },
  };
  return {
    ctx,
    commit(names) {
      const next: Record<string, RngState> = { ...streams };
      for (const name of names) {
        const rng = used.get(name);
        if (rng) next[name] = rng.snapshot();
      }
      return next as RngStreams;
    },
  };
}
