import type { CSSProperties } from 'react';
import type { Periode } from '../siege/Siege';

/** Étoiles fixes : positions fixées à l'avance, jamais de hasard (rendu identique à chaque fois). */
const ETOILES = Array.from({ length: 36 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 23 + 7) % 55,
  t: 1 + ((i * 7) % 3),
  d: (i * 0.37) % 3,
}));

/** Ciel : dégradé du moment, soleil ou lune sur sa trajectoire, étoiles la nuit, nuages qui dérivent. */
export function Ciel({ periode }: { periode: Periode }) {
  const nuit = periode === 'nuit';
  return (
    <div className={`lt-ciel lt-ciel--${periode}`} aria-hidden="true">
      {nuit
        ? ETOILES.map((e, i) => (
            <span
              key={i}
              className="lt-etoile"
              style={
                {
                  left: `${e.x}%`,
                  top: `${e.y}%`,
                  width: e.t,
                  height: e.t,
                  animationDelay: `${e.d}s`,
                } as CSSProperties
              }
            />
          ))
        : null}
      <span className={`lt-astre lt-astre--${periode}`} />
      <span className="lt-nuage lt-nuage--1" />
      <span className="lt-nuage lt-nuage--2" />
      <span className="lt-nuage lt-nuage--3" />
    </div>
  );
}
