import type { GameColor } from '../../data/games';
import { pseudoKey } from '../../accounts/pseudo';

const COLORS: readonly GameColor[] = ['purple', 'orange', 'blue', 'pink', 'green', 'red'];

/** Couleur stable dérivée du pseudo : le même pseudo a toujours le même avatar. */
function colorFor(pseudo: string): GameColor {
  let hash = 0;
  for (const char of pseudoKey(pseudo)) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return COLORS[hash % COLORS.length] ?? 'purple';
}

export function Avatar({ pseudo, size = 36 }: { pseudo: string; size?: number }) {
  return (
    <span
      className={`avatar game-bg game-bg--${colorFor(pseudo)}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden="true"
    >
      {[...pseudo][0]?.toUpperCase()}
    </span>
  );
}
