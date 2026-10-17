import { useMemo } from 'react';
import { SITE } from '../../config/site';
import { weekKey, weeklyFortunes, type Fortune } from '../../data/leaderboard';
import { formatPercent } from '../../lib/format';
import { useCountUp } from '../../lib/useCountUp';
import { useInView } from '../../lib/useInView';
import { SectionHeading } from '../ui/SectionHeading';

const euros = new Intl.NumberFormat(SITE.locale);

function Row({ entry, active }: { entry: Fortune; active: boolean }) {
  // Les rangs bas démarrent un peu plus tard : le tableau se « remplit » du haut vers le bas
  const shown = useCountUp(entry.amount, active, 1200 + entry.rank * 80);
  const up = entry.weekly >= 0;
  return (
    <tr>
      <th scope="row" className="board__rank mono">
        {entry.rank}
      </th>
      <td className="board__player">{entry.player}</td>
      <td className="board__symbol mono">{entry.symbol}</td>
      <td className="board__amount mono">
        <span aria-hidden="true">{euros.format(shown)} €</span>
        <span className="visually-hidden">{euros.format(entry.amount)} euros</span>
      </td>
      <td className={`board__weekly mono ${up ? 'is-up' : 'is-down'}`}>
        {up ? '▲' : '▼'} {formatPercent(entry.weekly)}
      </td>
    </tr>
  );
}

/** Palmarès façon cote boursière : les dix plus grandes fortunes de la semaine. */
export function Leaderboard() {
  const rows = useMemo(() => weeklyFortunes(weekKey(new Date())), []);
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <section id="classements" className="leaderboard page" aria-labelledby="classements-titre">
      <SectionHeading
        number="03"
        id="classements-titre"
        title="Les plus grandes fortunes de la semaine"
        kicker="Arrêté à l'ouverture de ce matin. Tous jeux confondus, en euros fictifs."
      />
      <div ref={ref} className="board-wrap">
        <table className="board">
          <caption className="visually-hidden">
            Classement des dix plus grandes fortunes de la semaine
          </caption>
          <thead>
            <tr className="mono">
              <th scope="col">Rang</th>
              <th scope="col">Joueur</th>
              <th scope="col">Valeur</th>
              <th scope="col" className="board__num">
                Fortune
              </th>
              <th scope="col" className="board__num">
                Semaine
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => (
              <Row key={entry.rank} entry={entry} active={inView} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
