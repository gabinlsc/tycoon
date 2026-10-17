import type { PodiumEntry } from '../../lib/daily';
import { SITE } from '../../config/site';

const scoreFormat = new Intl.NumberFormat(SITE.locale);

/** Podium de la veille : trois marches, le premier au centre comme sur un vrai podium. */
export function Podium({ entries }: { entries: readonly PodiumEntry[] }) {
  const order = [entries[1], entries[0], entries[2]].filter((e): e is PodiumEntry => Boolean(e));
  return (
    <ol className="podium" aria-label="Podium de la veille">
      {order.map((entry) => (
        <li key={entry.rank} className={`podium__step podium__step--${entry.rank}`}>
          <span className="podium__name">{entry.name}</span>
          <span className="podium__score mono">{scoreFormat.format(entry.score)} €</span>
          <span className="podium__rank mono" aria-label={`Rang ${entry.rank}`}>
            {entry.rank}
          </span>
        </li>
      ))}
    </ol>
  );
}
