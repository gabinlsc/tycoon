import type { GameIcon as GameIconName } from '../../../data/games';

interface GameIconProps {
  name: GameIconName;
  size?: number;
}

const STROKE = {
  stroke: 'var(--outline)',
  strokeWidth: 3,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

/** Emblème de chaque jeu : formes simples, contour encre, mêmes codes que les pièces. */
export function GameIconShapes({ name }: { name: GameIconName }) {
  return (
    <>
      {name === 'vinyl' && (
        <>
          <circle cx="32" cy="32" r="26" fill="#2a2150" {...STROKE} />
          <circle
            cx="32"
            cy="32"
            r="17"
            fill="none"
            stroke="#fff"
            strokeWidth="1.5"
            opacity="0.35"
          />
          <circle cx="32" cy="32" r="10" fill="var(--gold)" {...STROKE} />
          <circle cx="32" cy="32" r="2.5" fill="var(--outline)" />
          <path
            d="M14 20 Q18 12 27 9"
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      )}
      {name === 'truck' && (
        <>
          <rect x="6" y="18" width="34" height="26" rx="5" fill="#fff" {...STROKE} />
          <path d="M40 26 H52 L58 34 V44 H40 Z" fill="var(--gold)" {...STROKE} />
          <rect x="12" y="24" width="22" height="9" rx="2" fill="var(--red)" {...STROKE} />
          <circle cx="18" cy="46" r="6" fill="#2a2150" {...STROKE} />
          <circle cx="48" cy="46" r="6" fill="#2a2150" {...STROKE} />
        </>
      )}
      {name === 'sneaker' && (
        <>
          <path
            d="M6 44 V32 Q6 28 10 28 L18 28 Q24 28 28 22 L32 16 Q36 24 44 28 L54 32 Q60 34 60 40 V44 Z"
            fill="#fff"
            {...STROKE}
          />
          <rect x="6" y="40" width="54" height="9" rx="4" fill="var(--blue)" {...STROKE} />
          <path
            d="M30 26 L38 30 M26 30 L34 34"
            stroke="var(--outline)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {name === 'disco' && (
        <>
          <path d="M32 4 V12" stroke="var(--outline)" strokeWidth="4" strokeLinecap="round" />
          <circle cx="32" cy="36" r="24" fill="var(--pink)" {...STROKE} />
          <path
            d="M8 36 H56 M32 12 V60 M15 20 Q32 30 49 20 M15 52 Q32 42 49 52"
            fill="none"
            stroke="var(--outline)"
            strokeWidth="2.5"
            opacity="0.6"
          />
          <rect x="38" y="20" width="9" height="9" rx="2" fill="#fff" opacity="0.85" />
          <rect x="17" y="40" width="9" height="9" rx="2" fill="#fff" opacity="0.6" />
        </>
      )}
      {name === 'ball' && (
        <>
          <circle cx="32" cy="32" r="26" fill="#fff" {...STROKE} />
          <path d="M32 20 L43 28 L39 41 H25 L21 28 Z" fill="var(--outline)" />
          <path
            d="M32 20 V8 M43 28 L55 24 M39 41 L47 52 M25 41 L17 52 M21 28 L9 24"
            stroke="var(--outline)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {name === 'case' && (
        <>
          <path d="M22 18 V13 Q22 9 26 9 H38 Q42 9 42 13 V18" fill="none" {...STROKE} />
          <rect x="6" y="18" width="52" height="36" rx="7" fill="var(--red)" {...STROKE} />
          <path d="M6 32 H58" stroke="var(--outline)" strokeWidth="3" />
          <rect x="27" y="28" width="10" height="10" rx="2" fill="var(--gold)" {...STROKE} />
        </>
      )}
    </>
  );
}

export function GameIcon({ name, size = 64 }: GameIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <GameIconShapes name={name} />
    </svg>
  );
}
