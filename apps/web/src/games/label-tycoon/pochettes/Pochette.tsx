import { useId } from 'react';
import { hsl, parametresPochette, type Motif, type ParametresPochette } from './generer';

const T = 200;

function Motif({ motif, p }: { motif: Motif; p: ParametresPochette }) {
  const [, forme, accent] = p.teintes;
  const [a, b, c] = p.variantes;
  const clair = hsl(forme, 85, 62);
  const vif = hsl(accent, 90, 58);
  switch (motif) {
    case 'cercles':
      return (
        <g>
          <circle
            cx={60 + a * 80}
            cy={70 + b * 40}
            r={50 + c * 25}
            fill={clair}
            stroke="var(--outline)"
            strokeWidth="5"
          />
          <circle
            cx={130 - b * 50}
            cy={120 + a * 30}
            r={28 + c * 14}
            fill={vif}
            stroke="var(--outline)"
            strokeWidth="5"
          />
        </g>
      );
    case 'rayures':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={-10}
              y={20 + i * 36 + a * 6}
              width={T + 20}
              height={14 + c * 8}
              fill={i % 2 ? clair : vif}
              stroke="var(--outline)"
              strokeWidth="4"
              transform={`rotate(${-12 + b * 24} 100 100)`}
            />
          ))}
        </g>
      );
    case 'soleil':
      return (
        <g>
          {Array.from({ length: 12 }, (_, i) => (
            <path
              key={i}
              d="M100 100 L92 -10 L108 -10 Z"
              fill={i % 2 ? clair : vif}
              transform={`rotate(${i * 30 + a * 30} 100 100)`}
            />
          ))}
          <circle
            cx="100"
            cy="100"
            r={34 + b * 12}
            fill={hsl(accent, 95, 65)}
            stroke="var(--outline)"
            strokeWidth="6"
          />
        </g>
      );
    case 'damier':
      return (
        <g>
          {Array.from({ length: 16 }, (_, i) => {
            const x = i % 4;
            const y = Math.floor(i / 4);
            return (x + y) % 2 === 0 ? (
              <rect
                key={i}
                x={x * 50}
                y={y * 50}
                width="50"
                height="50"
                fill={i % 3 === 0 ? vif : clair}
                stroke="var(--outline)"
                strokeWidth="3"
              />
            ) : null;
          })}
        </g>
      );
    case 'vagues':
      return (
        <g fill="none" strokeWidth="9" strokeLinecap="round">
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              stroke={i % 2 ? clair : vif}
              d={`M-10 ${50 + i * 38} Q 40 ${20 + i * 38 + a * 30} 100 ${50 + i * 38} T 210 ${50 + i * 38 + b * 12}`}
            />
          ))}
        </g>
      );
  }
}

/**
 * Pochette de vinyle générée en SVG. `graine` (par exemple l'identifiant de la sortie) et `genre`
 * déterminent le motif et les couleurs ; `titre` s'affiche sur la pochette.
 */
export function Pochette({
  graine,
  genre,
  titre,
  taille = 160,
}: {
  graine: string;
  genre: string;
  titre: string;
  taille?: number;
}) {
  const p = parametresPochette(graine, genre);
  const id = useId();
  const [fond] = p.teintes;
  return (
    <svg
      viewBox={`0 0 ${T} ${T}`}
      width={taille}
      height={taille}
      role="img"
      aria-labelledby={id}
      className="pochette"
    >
      <title id={id}>{`Pochette de ${titre}`}</title>
      <clipPath id={`${id}-clip`}>
        <rect width={T} height={T} rx="14" />
      </clipPath>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width={T} height={T} fill={hsl(fond, 70, 48)} />
        <Motif motif={p.motif} p={p} />
        <rect x="0" y={T - 44} width={T} height="44" fill="var(--outline)" opacity="0.88" />
        <text x="100" y={T - 16} textAnchor="middle" className="pochette__titre">
          {titre.length > 18 ? `${titre.slice(0, 17)}…` : titre}
        </text>
      </g>
      <rect width={T} height={T} rx="14" fill="none" stroke="var(--outline)" strokeWidth="8" />
    </svg>
  );
}
