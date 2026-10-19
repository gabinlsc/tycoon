import type { ReactNode } from 'react';
import { H_SALLE, L_INT, X_INT } from './geometrie';

const X1 = X_INT + L_INT;

/** Fond commun d'une salle : mur, plinthe, sol et rangée de plafonniers allumés selon le niveau. */
export function FondSalle({
  y,
  mur,
  sol = 'url(#sg-parquet)',
  niveau,
  max,
  children,
}: {
  y: number;
  mur: [string, string];
  sol?: string;
  niveau: number;
  max: number;
  children?: ReactNode;
}) {
  const id = `mur-${Math.round(y)}`;
  const lampes = 6;
  const allumees = Math.max(1, Math.round((niveau / Math.max(1, max)) * lampes));
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={mur[0]} />
          <stop offset="1" stopColor={mur[1]} />
        </linearGradient>
      </defs>
      <rect x={X_INT} y={y} width={L_INT} height={H_SALLE} fill={`url(#${id})`} />
      <rect x={X_INT} y={y + H_SALLE - 14} width={L_INT} height="14" fill={sol} />
      <rect x={X_INT} y={y + H_SALLE - 16} width={L_INT} height="3" fill="rgb(0 0 0 / 0.35)" />
      {children}
      {Array.from({ length: lampes }, (_, i) => {
        const cx = X_INT + 36 + i * ((L_INT - 72) / (lampes - 1));
        const on = i < allumees;
        return (
          <g key={i}>
            <rect x={cx - 12} y={y} width="24" height="5" rx="2" fill="#3a3358" />
            {on ? (
              <>
                <ellipse cx={cx} cy={y + 20} rx="26" ry="22" fill="url(#sg-halo)" opacity="0.55" />
                <rect x={cx - 10} y={y + 5} width="20" height="3" rx="1.5" fill="#fff6c9" />
              </>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}

/** Reflet de la vitre posé par-dessus une salle. */
export function Vitre({ y }: { y: number }) {
  return (
    <g pointerEvents="none">
      <rect x={X_INT} y={y} width={L_INT} height={H_SALLE} fill="url(#sg-verre)" />
      <path
        d={`M${X_INT + 120} ${y}l60 ${H_SALLE}`}
        stroke="rgb(255 255 255 / 0.07)"
        strokeWidth="14"
      />
      <path
        d={`M${X_INT + 260} ${y}l60 ${H_SALLE}`}
        stroke="rgb(255 255 255 / 0.05)"
        strokeWidth="26"
      />
    </g>
  );
}

const trait = {
  stroke: '#1b0f3a',
  strokeWidth: 2,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
};

/** Studio d'enregistrement : cabine vitrée, console de mixage, enceintes, mousse acoustique. */
export function Studio({ y, niveau, actif }: { y: number; niveau: number; actif: boolean }) {
  return (
    <FondSalle y={y} mur={['#3b1c7a', '#24124f']} niveau={niveau} max={5}>
      <rect
        x={X_INT}
        y={y + 14}
        width="64"
        height={H_SALLE - 28}
        fill="url(#sg-mousse)"
        opacity="0.9"
      />
      {/* cabine vitrée */}
      <rect
        x={X1 - 108}
        y={y + 18}
        width="92"
        height={H_SALLE - 32}
        rx="4"
        fill="rgb(140 200 255 / 0.12)"
        stroke="rgb(255 255 255 / 0.4)"
        strokeWidth="2"
      />
      <path d={`M${X1 - 62} ${y + 30}v${H_SALLE - 62}`} stroke="#8d96aa" strokeWidth="3" />
      <circle cx={X1 - 62} cy={y + 38} r="6" fill="#1b0f3a" stroke="#ffc61a" strokeWidth="2" />
      <circle
        cx={X1 - 62}
        cy={y + 38}
        r="13"
        fill="none"
        stroke="rgb(255 255 255 / 0.5)"
        strokeWidth="1.5"
      />
      <path
        d={`M${X1 - 80} ${y + H_SALLE - 16}h36`}
        stroke="#8d96aa"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* enseigne ON AIR */}
      <rect
        x={X1 - 92}
        y={y + 8}
        width="60"
        height="14"
        rx="4"
        fill={actif ? '#d62b49' : '#4a2a5c'}
        {...trait}
      />
      <text
        x={X1 - 62}
        y={y + 19}
        textAnchor="middle"
        fontSize="9"
        fontWeight="900"
        fill={actif ? '#fff' : '#8b7aa8'}
        fontFamily="system-ui, sans-serif"
      >
        ON AIR
      </text>
      {actif ? (
        <ellipse
          cx={X1 - 62}
          cy={y + 15}
          rx="46"
          ry="14"
          fill="#d62b49"
          opacity="0.35"
          filter="url(#sg-flou)"
        />
      ) : null}
      {/* console */}
      <path
        d={`M${X_INT + 80} ${y + H_SALLE - 14}V${y + 60}l12-10h150l12 10v${H_SALLE - 74}z`}
        fill="#2d1f55"
        {...trait}
      />
      <path d={`M${X_INT + 92} ${y + 50}h150l12 10h-174z`} fill="url(#sg-metal)" {...trait} />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect x={X_INT + 100 + i * 12} y={y + 54} width="4" height="12" rx="1" fill="#1b0f3a" />
          <rect
            x={X_INT + 99 + i * 12}
            y={y + 56 + ((i * 5) % 7)}
            width="6"
            height="3"
            rx="1"
            fill={i % 3 === 0 ? '#ff6fb5' : '#5ad1ff'}
          />
        </g>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <circle
          key={i}
          cx={X_INT + 108 + i * 24}
          cy={y + 76}
          r="4"
          fill="#ffc61a"
          stroke="#1b0f3a"
          strokeWidth="1.5"
        />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <rect
          key={i}
          className={actif ? 'lt-vu' : undefined}
          x={X_INT + 104 + i * 18}
          y={y + 38}
          width="8"
          height="10"
          rx="1"
          fill={['#35d36b', '#35d36b', '#ffc61a', '#d62b49'][i % 4]}
          style={{ animationDelay: `${(i * 0.13) % 0.9}s` }}
        />
      ))}
      {/* enceintes */}
      {[X_INT + 76, X_INT + 252].map((x) => (
        <g key={x}>
          <rect x={x} y={y + 24} width="30" height="38" rx="4" fill="#1b0f3a" {...trait} />
          <circle
            className={actif ? 'lt-woofer' : undefined}
            cx={x + 15}
            cy={y + 46}
            r="9"
            fill="#3b2a6e"
            stroke="#8d96aa"
            strokeWidth="2"
            style={{ transformOrigin: `${x + 15}px ${y + 46}px` }}
          />
          <circle
            cx={x + 15}
            cy={y + 32}
            r="3.5"
            fill="#3b2a6e"
            stroke="#8d96aa"
            strokeWidth="1.5"
          />
        </g>
      ))}
      {niveau >= 2 ? (
        <g>
          <rect
            x={X_INT + 8}
            y={y + 10}
            width="46"
            height={H_SALLE - 24}
            rx="3"
            fill="#15102e"
            {...trait}
          />
          {Array.from({ length: 6 }, (_, i) => (
            <g key={i}>
              <rect
                x={X_INT + 12}
                y={y + 15 + i * 12}
                width="38"
                height="8"
                rx="1.5"
                fill="#2d2557"
              />
              <circle
                cx={X_INT + 17}
                cy={y + 19 + i * 12}
                r="1.6"
                fill={i % 2 ? '#35d36b' : '#ffc61a'}
              />
            </g>
          ))}
        </g>
      ) : null}
      {niveau >= 3 ? (
        <g>
          <rect
            x={X_INT + 150}
            y={y + 14}
            width="64"
            height="28"
            rx="3"
            fill="#0f1a3a"
            {...trait}
          />
          <path
            d={`M${X_INT + 156} ${y + 30}q6-12 12 0t12 0t12 0t12 0t12 0`}
            fill="none"
            stroke="#5ad1ff"
            strokeWidth="2"
          />
        </g>
      ) : null}
      {niveau >= 5 ? (
        <g transform={`translate(${X_INT + 66} ${y + 10})`}>
          <rect width="22" height="22" fill="#ffc61a" {...trait} />
          <circle cx="11" cy="11" r="6" fill="#1b0f3a" />
        </g>
      ) : null}
    </FondSalle>
  );
}

/** Bureaux : postes de travail, tableau blanc, plantes. */
export function Bureaux({ y, niveau }: { y: number; niveau: number }) {
  const postes = Math.min(4, niveau + 1);
  return (
    <FondSalle y={y} mur={['#2c4a8a', '#1d3366']} niveau={niveau} max={4} sol="#5a4a66">
      <rect x={X_INT + 20} y={y + 16} width="92" height="46" rx="3" fill="#f4f1ff" {...trait} />
      <path
        d={`M${X_INT + 30} ${y + 50}l16-14l14 8l20-22l16 12`}
        fill="none"
        stroke="#35d36b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d={`M${X_INT + 30} ${y + 54}h72`} stroke="#c9c3d9" strokeWidth="2" />
      <circle cx={X1 - 40} cy={y + 30} r="14" fill="#f4f1ff" {...trait} />
      <path
        d={`M${X1 - 40} ${y + 30}v-8M${X1 - 40} ${y + 30}l7 4`}
        stroke="#1b0f3a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {Array.from({ length: postes }, (_, i) => {
        const x = X_INT + 130 + i * 66;
        return (
          <g key={i}>
            <rect x={x} y={y + 52} width="52" height="5" rx="2" fill="#c68642" {...trait} />
            <path
              d={`M${x + 4} ${y + 57}v22M${x + 48} ${y + 57}v22`}
              stroke="#1b0f3a"
              strokeWidth="3"
            />
            <rect x={x + 14} y={y + 34} width="26" height="17" rx="2" fill="#0f1a3a" {...trait} />
            <rect
              x={x + 17}
              y={y + 37}
              width="20"
              height="11"
              fill={['#5ad1ff', '#ff6fb5', '#35d36b', '#ffc61a'][i % 4]}
              opacity="0.75"
            />
            <path d={`M${x + 27} ${y + 51}v-0`} stroke="#1b0f3a" strokeWidth="3" />
            <rect x={x + 18} y={y + 66} width="18" height="8" rx="3" fill="#d62b49" {...trait} />
          </g>
        );
      })}
      <g transform={`translate(${X1 - 28} ${y + H_SALLE - 38})`}>
        <path d="M0 24h18l-3 -14h-12z" fill="#c8553d" {...trait} />
        <path
          d="M9 10C0 4 -2 -6 4 -12C10 -6 14 0 9 10zM9 10C18 6 22 -2 16 -10C10 -4 8 2 9 10z"
          fill="#35d36b"
          {...trait}
        />
      </g>
    </FondSalle>
  );
}

/** Salle de répétition : batterie, amplis, guitares, affiches. */
export function Repetition({ y, niveau }: { y: number; niveau: number }) {
  return (
    <FondSalle y={y} mur={['#1f6b4a', '#144432']} niveau={niveau} max={3} sol="#3a2f2a">
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={X_INT + 20 + i * 38}
          y={y + 14}
          width="28"
          height="38"
          fill={['#ff6fb5', '#ffc61a', '#5ad1ff'][i]}
          {...trait}
          transform={`rotate(${i % 2 ? 3 : -3} ${X_INT + 34 + i * 38} ${y + 33})`}
        />
      ))}
      {/* batterie */}
      <g transform={`translate(${X_INT + 190} ${y + 36})`}>
        <ellipse cx="0" cy="34" rx="20" ry="22" fill="#d62b49" {...trait} />
        <ellipse cx="0" cy="34" rx="9" ry="10" fill="#1b0f3a" />
        <ellipse cx="-30" cy="14" rx="12" ry="6" fill="#f4f1ff" {...trait} />
        <ellipse cx="30" cy="14" rx="12" ry="6" fill="#f4f1ff" {...trait} />
        <path d="M-34 -2L-52 -10M34 -2L52 -10" stroke="#ffc61a" strokeWidth="3" />
        <ellipse cx="-56" cy="-10" rx="16" ry="3" fill="#ffc61a" {...trait} />
        <ellipse cx="56" cy="-10" rx="16" ry="3" fill="#ffc61a" {...trait} />
      </g>
      {/* amplis */}
      <rect x={X1 - 90} y={y + 36} width="38" height="46" rx="3" fill="#1b0f3a" {...trait} />
      <circle cx={X1 - 71} cy={y + 62} r="12" fill="#3b2a6e" stroke="#8d96aa" strokeWidth="2" />
      <rect x={X1 - 48} y={y + 52} width="32" height="30" rx="3" fill="#1b0f3a" {...trait} />
      <circle cx={X1 - 32} cy={y + 68} r="9" fill="#3b2a6e" stroke="#8d96aa" strokeWidth="2" />
      {/* guitare au mur */}
      <g transform={`translate(${X_INT + 330} ${y + 20}) rotate(18)`}>
        <ellipse cx="0" cy="28" rx="13" ry="16" fill="#ff8a2b" {...trait} />
        <rect x="-3" y="-20" width="6" height="40" fill="#7a4a22" {...trait} />
        <circle cx="0" cy="26" r="4" fill="#1b0f3a" />
      </g>
    </FondSalle>
  );
}

/** Usine de pressage : presse, tapis roulant de disques, cartons. */
export function Pressage({ y, niveau }: { y: number; niveau: number }) {
  return (
    <FondSalle y={y} mur={['#6b5a1f', '#3f3414']} niveau={niveau} max={3} sol="#4a4350">
      <rect x={X_INT} y={y + H_SALLE - 18} width={L_INT} height="4" fill="url(#sg-danger)" />
      <g>
        <rect
          x={X_INT + 20}
          y={y + 20}
          width="110"
          height="62"
          rx="4"
          fill="url(#sg-metal)"
          {...trait}
        />
        <rect x={X_INT + 34} y={y + 30} width="82" height="14" fill="#1b0f3a" />
        <rect
          className="lt-piston"
          x={X_INT + 62}
          y={y + 18}
          width="26"
          height="30"
          fill="#8d96aa"
          {...trait}
        />
        <circle cx={X_INT + 36} cy={y + 64} r="6" fill="#d62b49" {...trait} />
        <circle cx={X_INT + 54} cy={y + 64} r="6" fill="#35d36b" {...trait} />
      </g>
      <rect
        x={X_INT + 130}
        y={y + 66}
        width={L_INT - 150}
        height="10"
        rx="5"
        fill="#2a2433"
        {...trait}
      />
      <g className="lt-tapis">
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <circle
              cx={X_INT + 150 + i * 40}
              cy={y + 60}
              r="10"
              fill="#1b0f3a"
              stroke="#ffc61a"
              strokeWidth="1.5"
            />
            <circle cx={X_INT + 150 + i * 40} cy={y + 60} r="3" fill="#ffc61a" />
          </g>
        ))}
      </g>
      {[0, 1].map((i) => (
        <rect
          key={i}
          x={X1 - 62 + i * 30}
          y={y + 28 + i * 14}
          width="30"
          height="26"
          fill="#c68642"
          {...trait}
        />
      ))}
    </FondSalle>
  );
}

/** Salle de concert : scène, rideau, projecteurs, public. */
export function Concert({ y, niveau }: { y: number; niveau: number }) {
  return (
    <FondSalle y={y} mur={['#6b0f2e', '#35081a']} niveau={niveau} max={3} sol="#1b0f3a">
      <path
        d={`M${X_INT} ${y}h${L_INT}v14q-20 8-40 0t-40 0t-40 0t-40 0t-40 0t-40 0t-40 0t-40 0t-40 0t-40 0t-28 0z`}
        fill="#a3172f"
        {...trait}
      />
      <rect
        x={X_INT + 40}
        y={y + 56}
        width={L_INT - 80}
        height="26"
        rx="3"
        fill="#7a4a22"
        {...trait}
      />
      <rect x={X_INT + 40} y={y + 56} width={L_INT - 80} height="5" fill="#c68642" />
      {[0, 1, 2].map((i) => (
        <g
          key={i}
          className="lt-faisceau"
          style={{
            transformOrigin: `${X_INT + 110 + i * 100}px ${y + 8}px`,
            animationDelay: `${i * -0.8}s`,
          }}
        >
          <path
            d={`M${X_INT + 110 + i * 100} ${y + 8}l-26 80h52z`}
            fill="url(#sg-lampe)"
            opacity="0.5"
          />
        </g>
      ))}
      <rect x={X_INT + 12} y={y + 30} width="22" height="52" rx="3" fill="#1b0f3a" {...trait} />
      <rect x={X1 - 34} y={y + 30} width="22" height="52" rx="3" fill="#1b0f3a" {...trait} />
      <circle cx={X_INT + 23} cy={y + 50} r="7" fill="#3b2a6e" stroke="#8d96aa" strokeWidth="2" />
      <circle cx={X1 - 23} cy={y + 50} r="7" fill="#3b2a6e" stroke="#8d96aa" strokeWidth="2" />
      <path d={`M${X_INT + 210} ${y + 82}V${y + 40}`} stroke="#8d96aa" strokeWidth="3" />
      <circle
        cx={X_INT + 210}
        cy={y + 38}
        r="4.5"
        fill="#1b0f3a"
        stroke="#ffc61a"
        strokeWidth="2"
      />
      {Array.from({ length: 14 }, (_, i) => (
        <circle
          key={i}
          className="lt-foule"
          cx={X_INT + 16 + i * 30}
          cy={y + H_SALLE - 6 - ((i * 7) % 5)}
          r="8"
          fill="#0d0620"
          style={{ animationDelay: `${(i * 0.21) % 1.2}s` }}
        />
      ))}
      <text
        x={X_INT + 210}
        y={y + 28}
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill="#ff6fb5"
        fontFamily="'Lilita One', system-ui, sans-serif"
        style={{ filter: 'drop-shadow(0 0 6px #ff2d95)' }}
      >
        LIVE
      </text>
    </FondSalle>
  );
}

/** Salle fermée : plan bleu, échafaudage et ruban de chantier, ou cadenas selon l'état. */
export function SalleFermee({
  y,
  etat,
  restantes,
}: {
  y: number;
  etat: 'verrouille' | 'libre' | 'travaux';
  restantes: number;
}) {
  return (
    <g>
      <rect x={X_INT} y={y} width={L_INT} height={H_SALLE} fill="#120c2a" />
      <rect x={X_INT} y={y} width={L_INT} height={H_SALLE} fill="url(#sg-plan)" />
      <rect
        x={X_INT + 10}
        y={y + 10}
        width={L_INT - 20}
        height={H_SALLE - 20}
        fill="none"
        stroke="#5ad1ff"
        strokeOpacity="0.55"
        strokeWidth="2"
        strokeDasharray="8 6"
      />
      {etat === 'travaux' ? (
        <g>
          <path
            d={`M${X_INT} ${y + 20}L${X1} ${y + 70}`}
            stroke="url(#sg-danger)"
            strokeWidth="10"
          />
          <path
            d={`M${X_INT + 40} ${y} v${H_SALLE}M${X1 - 40} ${y} v${H_SALLE}`}
            stroke="#c9c3d9"
            strokeWidth="4"
          />
          <path
            d={`M${X_INT + 40} ${y + 30}H${X1 - 40}M${X_INT + 40} ${y + 62}H${X1 - 40}`}
            stroke="#c9c3d9"
            strokeWidth="3"
          />
          <text
            x={X_INT + L_INT / 2}
            y={y + 56}
            textAnchor="middle"
            fontSize="20"
            fontWeight="900"
            fill="#ffc61a"
            fontFamily="'Lilita One', system-ui, sans-serif"
          >
            {`Travaux · ${restantes} sem.`}
          </text>
          <g className="lt-etincelles">
            <circle cx={X_INT + 200} cy={y + 76} r="3" fill="#ffc61a" />
            <circle cx={X_INT + 214} cy={y + 70} r="2" fill="#fff" />
            <circle cx={X_INT + 188} cy={y + 72} r="2" fill="#ff8a2b" />
          </g>
        </g>
      ) : etat === 'libre' ? (
        <g>
          <circle
            cx={X_INT + L_INT / 2}
            cy={y + 46}
            r="26"
            fill="none"
            stroke="#35d36b"
            strokeWidth="5"
          />
          <path
            d={`M${X_INT + L_INT / 2 - 12} ${y + 46}h24M${X_INT + L_INT / 2} ${y + 34}v24`}
            stroke="#35d36b"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g transform={`translate(${X_INT + L_INT / 2} ${y + 46})`}>
          <rect x="-16" y="-4" width="32" height="26" rx="4" fill="#3b2a6e" {...trait} />
          <path
            d="M-9 -4v-8a9 9 0 0 1 18 0v8"
            fill="none"
            stroke="#8d96aa"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="0" cy="9" r="3.5" fill="#ffc61a" />
        </g>
      )}
    </g>
  );
}
