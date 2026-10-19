import type { CSSProperties } from 'react';

const MOTIFS = {
  hiver: { n: 34, classe: 'neige' },
  printemps: { n: 18, classe: 'petale' },
  ete: { n: 0, classe: 'soleil' },
  automne: { n: 22, classe: 'feuille' },
} as const;

/** Particules de saison : neige, pétales, rayons de soleil, feuilles mortes. */
export function Meteo({ saison }: { saison: 'hiver' | 'printemps' | 'ete' | 'automne' }) {
  const m = MOTIFS[saison];
  return (
    <div className={`lt-meteo lt-meteo--${m.classe}`} aria-hidden="true">
      {Array.from({ length: m.n }, (_, i) => (
        <span
          key={i}
          style={
            {
              left: `${(i * 53) % 100}%`,
              '--i': i,
              animationDelay: `${(i * 0.43) % 6}s`,
              animationDuration: `${5 + ((i * 7) % 6)}s`,
            } as CSSProperties
          }
        />
      ))}
      {saison === 'ete' ? <span className="lt-meteo__rayons" /> : null}
    </div>
  );
}
