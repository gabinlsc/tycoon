import { crossoverEdges, layoutNodes } from '../../lib/crossovers';
import { useInView } from '../../lib/useInView';
import { SectionHeading } from '../ui/SectionHeading';

const WIDTH = 640;
const HEIGHT = 440;
const NODE_W = 84;
const NODE_H = 34;

const edges = crossoverEdges();
const nodes = layoutNodes(WIDTH, HEIGHT, 70);
const positionOf = (symbol: string) => nodes.find((n) => n.symbol === symbol);

/**
 * Schéma des crossovers : les jeux sont des cartouches reliées par des traits d'encre.
 * Les traits se dessinent (stroke-dashoffset) quand le schéma entre dans le viewport,
 * l'un après l'autre. La liste écrite en dessous est l'équivalent accessible du dessin.
 */
export function Crossovers() {
  const { ref, inView } = useInView<SVGSVGElement>(0.3);

  return (
    <section id="crossovers" className="cross page" aria-labelledby="cross-titre">
      <SectionHeading
        number="05"
        id="cross-titre"
        title="Quand les empires se croisent"
        kicker="Chaque trait est un contrat, une exclusivité ou un service rendu entre deux jeux."
      />
      <div className="cross__layout">
        <svg
          ref={ref}
          className={`cross__diagram${inView ? ' is-in' : ''}`}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="Schéma reliant les six jeux entre eux ; le détail des liens est donné dans la liste voisine."
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
          {nodes.map((node) => (
            <g
              key={node.symbol}
              className="cross__node"
              transform={`translate(${node.x} ${node.y})`}
            >
              <rect x={-NODE_W / 2} y={-NODE_H / 2} width={NODE_W} height={NODE_H} />
              <text className="cross__symbol" textAnchor="middle" dominantBaseline="central">
                {node.symbol}
              </text>
            </g>
          ))}
        </svg>
        <ol className="cross__list">
          {edges.map((edge) => (
            <li key={`${edge.from}-${edge.to}`}>
              <span className="cross__pair mono">
                {edge.from} — {edge.to}
              </span>
              <span>{edge.label}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
