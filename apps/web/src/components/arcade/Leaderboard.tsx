import { useMemo } from 'react';
import { SITE } from '../../config/site';
import { weekKey, weeklyFortunes, type Fortune } from '../../data/leaderboard';
import { formatPercent } from '../../lib/format';
import { useCountUp } from '../../lib/useCountUp';
import { useInView } from '../../lib/useInView';
import { SectionTitle } from './ui/SectionTitle';

const dollars = new Intl.NumberFormat(SITE.locale);

function Row({ entry, active }: { entry: Fortune; active: boolean }) {
  // Les rangs bas démarrent un peu plus tard : le tableau se remplit du haut vers le bas
  const shown = useCountUp(entry.amount, active, 1200 + entry.rank * 80);
  const up = entry.weekly >= 0;
  const medal = entry.rank <= 3 ? ` board__row--top${entry.rank}` : '';
  return (
    <tr className={`board__row${medal}`}>
      <th scope="row" className="board__rank">
        <span className="board__badge mono">{entry.rank}</span>
      </th>
      <td className="board__player">{entry.player}</td>
      <td className="board__symbol">{entry.symbol}</td>
      <td className="board__amount mono">
        <span aria-hidden="true">${dollars.format(shown)}</span>
        <span className="visually-hidden">{dollars.format(entry.amount)} dollars</span>
      </td>
      <td className={`board__weekly mono ${up ? 'is-up' : 'is-down'}`}>
        {up ? '▲' : '▼'} {formatPercent(entry.weekly)}
      </td>
    </tr>
  );
}

/** Tableau des dix plus grosses fortunes de la semaine, avec compteurs animés. */
export function Leaderboard() {
  const rows = useMemo(() => weeklyFortunes(weekKey(new Date())), []);
  const { ref, inView } = useInView<HTMLDivElement>(0.15);

  return (
    <section id="classements" className="board-section page" aria-labelledby="classements-titre">
      <SectionTitle
        level="3"
        id="classements-titre"
        title="Les plus grosses fortunes"
        kicker="Le top 10 de la semaine, tous jeux confondus. Dollars fictifs, gloire bien réelle."
      />
      <div ref={ref} className="board-wrap card">
        <table className="board">
          <caption className="visually-hidden">
            Classement des dix plus grandes fortunes de la semaine
          </caption>
          <thead>
            <tr>
              <th scope="col">Rang</th>
              <th scope="col">Joueur</th>
              <th scope="col" className="board__symbol">
                Jeu
              </th>
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
