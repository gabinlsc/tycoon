import { GAMES } from '../../data/games';
import { crossoverEdges, layoutNodes } from '../../lib/crossovers';
import { useInView } from '../../lib/useInView';
import { GameIconShapes } from './ui/GameIcon';
import { SectionTitle } from './ui/SectionTitle';

const WIDTH = 640;
const HEIGHT = 460;
const R = 38;

const edges = crossoverEdges();
const nodes = layoutNodes(WIDTH, HEIGHT, 70);
const positionOf = (symbol: string) => nodes.find((n) => n.symbol === symbol);
const gameOf = (symbol: string) => GAMES.find((g) => g.symbol === symbol);

/**
 * Carte des crossovers : chaque jeu est un médaillon coloré, relié aux autres par des traits épais
 * qui se dessinent l'un après l'autre à l'entrée dans le viewport (stroke-dashoffset).
 * La liste écrite à côté est l'équivalent accessible du dessin.
 */
export function CrossoverMap() {
  const { ref, inView } = useInView<SVGSVGElement>(0.3);

  return (
    <section id="crossovers" className="cross page" aria-labelledby="cross-titre">
      <SectionTitle
        level="5"
        id="cross-titre"
        title="Les empires se croisent"
        kicker="Chaque lien est un contrat, une exclusivité ou un coup de main entre deux jeux."
      />
      <div className="cross__layout">
        <svg
          ref={ref}
          className={`cross__map card${inView ? ' is-in' : ''}`}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Carte reliant les six jeux entre eux ; le détail des liens est donné dans la liste voisine."
        >
          {edges.map((edge, index) => {
            const a = positionOf(edge.from);
            const b = positionOf(edge.to);
            if (!a || !b) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                className="cross__edge"
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                pathLength={1}
                style={{ '--i': index } as React.CSSProperties}
              />
            );
          })}
          {nodes.map((node) => {
            const game = gameOf(node.symbol);
            if (!game) return null;
            return (
              <g key={node.symbol} transform={`translate(${node.x} ${node.y})`}>
                <circle r={R} className={`cross__node game-bg game-bg--${game.color}`} />
                <g transform="translate(-24 -24) scale(0.75)">
                  <GameIconShapes name={game.icon} />
                </g>
                <rect x={-30} y={R - 6} width={60} height={24} rx={12} className="cross__tag" />
                <text
                  className="cross__symbol"
                  y={R + 6}
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {node.symbol}
                </text>
              </g>
            );
          })}
        </svg>
        <ol className="cross__list">
          {edges.map((edge) => (
            <li key={`${edge.from}-${edge.to}`} className="card">
              <span className="cross__pair">
                {edge.from} <span aria-hidden="true">⇄</span>
                <span className="visually-hidden">et</span> {edge.to}
              </span>
              <span>{edge.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
