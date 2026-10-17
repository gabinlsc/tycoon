interface CoinProps {
  /** Diamètre en pixels. */
  size?: number;
  className?: string;
}

/** Pièce d'or avec un $ : l'élément de base de l'univers visuel. Décorative. */
export function Coin({ size = 32, className = '' }: CoinProps) {
  return (
    <svg
      className={`coin ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="20" cy="20" r="17" fill="var(--gold)" stroke="var(--outline)" strokeWidth="3.5" />
      <circle cx="20" cy="20" r="11.5" fill="none" stroke="var(--gold-dark)" strokeWidth="2.5" />
      <text
        x="20"
        y="26.5"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="19"
        fill="var(--outline)"
      >
        $
      </text>
      <path
        d="M10 14 Q12 9 17 8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}
