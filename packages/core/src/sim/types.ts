import type { Rng } from '../rng/rng';

/** Information remontée par la simulation à l'interface (notification, demande de pause…). */
export interface Signal {
  kind: string;
  /** Si vrai, la boucle rapide s'arrête à la fin du tick (auto-pause). */
  interrupt?: boolean;
  payload?: Readonly<Record<string, unknown>>;
}

export interface TickContext<S extends Signal = Signal> {
  /** Indice de la semaine simulée (0 pour la première semaine de la partie). */
  readonly tick: number;
  /** Générateur du flux nommé. Il avance, et son état est réécrit dans l'état de jeu en fin de tick. */
  rng(stream: string): Rng;
  /** Émet un signal pour l'interface. */
  emit(signal: S): void;
}
