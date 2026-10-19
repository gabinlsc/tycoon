import { renderToStaticMarkup } from 'react-dom/server';
import { Visage, traitsDuVisage } from '../Visage';

export type Pose = 'debout' | 'assis' | 'chante' | 'batterie' | 'guitare' | 'tape' | 'danse';

/** Tête seule d'un visage (sans l'élément racine ni les épaules), mise en cache par nom. */
const teteEnCache = new Map<string, string>();
function tetesDe(graine: string): string {
  const connue = teteEnCache.get(graine);
  if (connue) return connue;
  const marque = renderToStaticMarkup(<Visage graine={graine} taille={100} />)
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>$/, '');
  teteEnCache.set(graine, marque);
  return marque;
}

/**
 * Personnage en pied : tête dessinée à partir du nom, corps coloré, bras et jambes selon la pose.
 * L'origine est au sol, entre les pieds ; `echelle` 1 mesure environ 62 unités de haut.
 */
export function Personnage({
  graine,
  x,
  y,
  echelle = 0.82,
  pose = 'debout',
  las = false,
  retourne = false,
  retard = 0,
}: {
  graine: string;
  x: number;
  y: number;
  echelle?: number;
  pose?: Pose;
  las?: boolean;
  retourne?: boolean;
  /** Décalage d'animation en secondes, pour que tout le monde ne bouge pas en même temps. */
  retard?: number;
}) {
  const t = traitsDuVisage(graine);
  const assis = pose === 'assis' || pose === 'tape' || pose === 'batterie';
  const hanche = assis ? -18 : -26;
  const contour = {
    stroke: '#1b0f3a',
    strokeWidth: 2,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${(retourne ? -1 : 1) * echelle} ${echelle})`}>
      <g
        className={`lt-pers lt-pers--${pose}${las ? ' is-las' : ''}`}
        style={{ animationDelay: `${retard}s` }}
      >
        <ellipse cx="0" cy="1" rx="14" ry="3" fill="rgb(0 0 0 / 0.3)" />
        {/* jambes */}
        {assis ? (
          <>
            <path
              d="M-6 -18H8v-0 8"
              fill="none"
              stroke="#1b0f3a"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M-6 -18H10L14 0"
              fill="none"
              stroke="#2b2150"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <>
            <path d={`M-5 ${hanche}V-2`} stroke="#2b2150" strokeWidth="8" strokeLinecap="round" />
            <path d={`M5 ${hanche}V-2`} stroke="#2b2150" strokeWidth="8" strokeLinecap="round" />
            <rect x="-9" y="-4" width="8" height="4" rx="2" fill="#f4f1ff" {...contour} />
            <rect x="1" y="-4" width="8" height="4" rx="2" fill="#f4f1ff" {...contour} />
          </>
        )}
        {/* bras arrière */}
        <g className="lt-pers__bras lt-pers__bras--g" style={{ transformOrigin: '-9px -48px' }}>
          <path
            d="M-9 -48L-17 -34"
            stroke="#1b0f3a"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M-9 -48L-17 -34"
            stroke={t.haut}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="-17" cy="-33" r="3.2" fill={t.peau} {...contour} />
        </g>
        {/* torse */}
        <path d={`M-10 ${hanche}V-46q0-6 6-6h8q6 0 6 6V${hanche}z`} fill={t.haut} {...contour} />
        <path d={`M-10 ${hanche + 4}H10`} stroke="rgb(0 0 0 / 0.25)" strokeWidth="2" />
        {/* tête */}
        <svg x="-17" y="-86" width="34" height="40" viewBox="18 12 64 72" className="lt-pers__tete">
          <g dangerouslySetInnerHTML={{ __html: tetesDe(graine) }} />
        </svg>
        {/* bras avant */}
        <g className="lt-pers__bras lt-pers__bras--d" style={{ transformOrigin: '9px -48px' }}>
          <path
            d="M9 -48L17 -34"
            stroke="#1b0f3a"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M9 -48L17 -34"
            stroke={t.haut}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="17" cy="-33" r="3.2" fill={t.peau} {...contour} />
        </g>
      </g>
    </g>
  );
}
