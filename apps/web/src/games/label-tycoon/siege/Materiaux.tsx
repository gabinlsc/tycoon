import { HAUTEUR, LARGEUR } from './geometrie';

/** Dégradés, motifs et filtres partagés par toutes les pièces du siège. */
export function Materiaux() {
  return (
    <defs>
      <linearGradient id="sg-ciel-nuit" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#0b0630" />
        <stop offset="1" stopColor="#3b1c7a" />
      </linearGradient>
      <linearGradient id="sg-brique" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#8e3b2b" />
        <stop offset="0.5" stopColor="#b9553d" />
        <stop offset="1" stopColor="#7a3023" />
      </linearGradient>
      <pattern id="sg-briques" width="28" height="14" patternUnits="userSpaceOnUse">
        <rect width="28" height="14" fill="url(#sg-brique)" />
        <path
          d="M0 0.5h28M0 7.5h28M14 0v7M0 7v7M28 7v7"
          stroke="rgb(0 0 0 / 0.22)"
          strokeWidth="1"
          fill="none"
        />
        <path d="M0 1.5h28" stroke="rgb(255 255 255 / 0.08)" strokeWidth="1" />
      </pattern>
      <linearGradient id="sg-beton" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#c9c3d9" />
        <stop offset="1" stopColor="#9d96b2" />
      </linearGradient>
      <linearGradient id="sg-verre" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="rgb(255 255 255 / 0.35)" />
        <stop offset="0.35" stopColor="rgb(255 255 255 / 0.05)" />
        <stop offset="0.5" stopColor="rgb(255 255 255 / 0.22)" />
        <stop offset="1" stopColor="rgb(255 255 255 / 0)" />
      </linearGradient>
      <linearGradient id="sg-parquet" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#c68642" />
        <stop offset="1" stopColor="#7a4a22" />
      </linearGradient>
      <linearGradient id="sg-metal" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#d9d6e6" />
        <stop offset="1" stopColor="#7d7894" />
      </linearGradient>
      <linearGradient id="sg-lampe" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff6c9" />
        <stop offset="1" stopColor="#ffc61a" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="sg-halo" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6c9" stopOpacity="0.9" />
        <stop offset="1" stopColor="#fff6c9" stopOpacity="0" />
      </radialGradient>
      <pattern id="sg-mousse" width="16" height="16" patternUnits="userSpaceOnUse">
        <rect width="16" height="16" fill="#2a1450" />
        <path d="M0 8L8 0L16 8L8 16Z" fill="#3b1c7a" stroke="rgb(0 0 0 / 0.35)" strokeWidth="1" />
      </pattern>
      <pattern id="sg-plan" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M12 0H0V12" fill="none" stroke="#5ad1ff" strokeOpacity="0.35" strokeWidth="1" />
      </pattern>
      <pattern
        id="sg-danger"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="10" height="20" fill="#ffc61a" />
        <rect x="10" width="10" height="20" fill="#1b0f3a" />
      </pattern>
      <filter id="sg-flou" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="sg-ombre" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000" floodOpacity="0.45" />
      </filter>
      <clipPath id="sg-coupe-plein">
        <rect x="0" y="0" width={LARGEUR} height={HAUTEUR} />
      </clipPath>
    </defs>
  );
}
