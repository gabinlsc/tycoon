import { useId } from 'react';
import { useInView } from '../../lib/useInView';

interface SparklineProps {
  values: readonly number[];
  /** Hausse, baisse ou stable : détermine la couleur du trait. */
  tone: 'up' | 'down' | 'flat';
}

const WIDTH = 120;
const HEIGHT = 40;
const PAD = 3;

/** Convertit une série en points SVG, min et max calés sur les bords (avec une marge). */
function toPoints(values: readonly number[]): Array<[number, number]> {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * WIDTH,
    PAD + (1 - (v - min) / span) * (HEIGHT - PAD * 2),
  ]);
}

/**
 * Mini-courbe « à l'encre » : un trait SVG, sous lequel une trame de points remplace l'aplat.
 * Le tracé utilise `pathLength="1"` : le trait s'anime avec stroke-dashoffset quel que soit
 * le nombre de points. Voir sparkline.css pour les animations d'entrée et de survol.
 */
export function Sparkline({ values, tone }: SparklineProps) {
  const patternId = useId();
  const { ref, inView } = useInView<SVGSVGElement>(0.3);
  const points = toPoints(values);
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
  const area = `${line.join(' ')} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  return (
    <svg
      ref={ref}
      className={`sparkline sparkline--${tone}${inView ? ' is-in' : ''}`}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <pattern id={patternId} width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.7" className="sparkline__dot" />
        </pattern>
      </defs>
      <path d={area} fill={`url(#${patternId})`} className="sparkline__area" />
      <path
        d={line.join(' ')}
        pathLength={1}
        className="sparkline__line"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
