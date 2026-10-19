import type { CSSProperties } from 'react';
import { Personnage } from '../siege/Personnage';
import type { Periode } from '../siege/Siege';

const VOITURES = ['#d62b49', '#34a4ff', '#ffc61a', '#35d36b', '#ff6fb5', '#f4f1ff'] as const;

function Voiture({ couleur, retourne }: { couleur: string; retourne: boolean }) {
  return (
    <svg
      viewBox="0 0 72 30"
      className={`lt-voiture-svg${retourne ? ' is-retour' : ''}`}
      aria-hidden="true"
    >
      <path
        d="M4 22v-6q0-3 4-4l10-1 8-8h20l9 8 11 2q4 1 4 5v4z"
        fill={couleur}
        stroke="#1b0f3a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M26 5h16l7 7H20z"
        fill="rgb(180 225 255 / 0.85)"
        stroke="#1b0f3a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="23" r="5.5" fill="#1b0f3a" />
      <circle cx="54" cy="23" r="5.5" fill="#1b0f3a" />
      <circle cx="20" cy="23" r="2" fill="#c9c3d9" />
      <circle cx="54" cy="23" r="2" fill="#c9c3d9" />
      <rect x="66" y="14" width="4" height="4" rx="1" fill="#fff6c9" />
    </svg>
  );
}

/** Rue au premier plan : voies avec circulation dans les deux sens, passants, arbres de la saison. */
export function Rue({
  saison,
  periode,
}: {
  saison: 'hiver' | 'printemps' | 'ete' | 'automne';
  periode: Periode;
}) {
  const feuilles = { hiver: '#e8f1ff', printemps: '#ffb3d4', ete: '#35d36b', automne: '#e0803d' }[
    saison
  ];
  return (
    <div className="lt-rue" aria-hidden="true">
      <div className="lt-rue__trottoir">
        {[8, 92].map((x, i) => (
          <svg key={x} viewBox="0 0 60 90" className="lt-arbre" style={{ left: `${x}%` }}>
            <rect
              x="26"
              y="46"
              width="8"
              height="40"
              rx="2"
              fill="#6b4a22"
              stroke="#1b0f3a"
              strokeWidth="2.5"
            />
            {saison === 'hiver' ? (
              <path
                d="M30 50L16 30M30 50L44 28M30 40L24 18M30 40L38 16"
                stroke="#6b4a22"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            ) : null}
            <ellipse
              cx="30"
              cy={saison === 'hiver' ? 24 : 30}
              rx={saison === 'hiver' ? 20 : 26}
              ry={saison === 'hiver' ? 8 : 24}
              fill={feuilles}
              stroke="#1b0f3a"
              strokeWidth="2.5"
              opacity={saison === 'hiver' ? 0.9 : 1}
            />
            {i === 0 && saison !== 'hiver' ? (
              <circle cx="22" cy="24" r="5" fill="rgb(255 255 255 / 0.25)" />
            ) : null}
          </svg>
        ))}
        {['marcheur-a', 'marcheur-b', 'marcheur-c'].map((g, i) => (
          <svg key={g} viewBox="0 0 40 60" className={`lt-passant lt-passant--${i}`}>
            <Personnage graine={g} x={20} y={58} echelle={0.55} pose="debout" />
          </svg>
        ))}
      </div>
      <div className="lt-rue__route">
        <span className="lt-rue__lignes" />
        {VOITURES.slice(0, periode === 'nuit' ? 3 : 5).map((c, i) => (
          <span
            key={c}
            className={`lt-rue__voiture lt-rue__voiture--${i % 2 ? 'g' : 'd'}`}
            style={{ '--i': i } as CSSProperties}
          >
            <Voiture couleur={c} retourne={i % 2 === 1} />
          </span>
        ))}
      </div>
    </div>
  );
}
