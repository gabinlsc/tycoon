/**
 * Visage dessiné d'un artiste, déduit de son nom : même nom, même visage. Peau, coiffure, regard,
 * bouche et accessoires se combinent pour des milliers de têtes différentes.
 */

const PEAUX = ['#ffe0c2', '#f5c9a0', '#e0a878', '#c68642', '#8d5524', '#5c3a1e'] as const;
const CHEVEUX = [
  '#1b0f3a',
  '#4a2a10',
  '#c88a3a',
  '#ff6fb5',
  '#5ad1ff',
  '#e6e6ee',
  '#d62b49',
  '#6a3df0',
] as const;
const HAUTS = [
  '#6a3df0',
  '#ff6fb5',
  '#34a4ff',
  '#ff8a2b',
  '#1fd0c0',
  '#35d36b',
  '#d62b49',
  '#ffc61a',
] as const;

const empreinte = (texte: string): number => {
  let h = 0x811c9dc5;
  for (const c of texte) {
    h ^= c.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
};

/** Caractéristiques du visage (exportées pour les tests). */
export function traitsDuVisage(graine: string) {
  const h = empreinte(graine);
  const p = (n: number, mod: number) => Math.floor(h / n) % mod;
  return {
    peau: PEAUX[p(1, PEAUX.length)] ?? PEAUX[0],
    cheveux: CHEVEUX[p(7, CHEVEUX.length)] ?? CHEVEUX[0],
    haut: HAUTS[p(31, HAUTS.length)] ?? HAUTS[0],
    coiffure: p(101, 6),
    yeux: p(211, 3),
    bouche: p(401, 3),
    lunettes: p(809, 4) === 0,
    boucle: p(1601, 3) === 0,
    casquette: p(3203, 6) === 0,
  };
}

export type Humeur = 'ravi' | 'neutre' | 'triste' | 'furieux';

/** Humeur affichée sur le visage d'après le moral (0-100). */
export const humeurDuMoral = (moral: number): Humeur =>
  moral >= 70 ? 'ravi' : moral >= 40 ? 'neutre' : moral >= 20 ? 'triste' : 'furieux';

export function Visage({
  graine,
  taille = 120,
  humeur = 'neutre',
}: {
  graine: string;
  taille?: number;
  humeur?: Humeur;
}) {
  const t = traitsDuVisage(graine);
  const contour = { stroke: 'var(--outline)', strokeWidth: 3, strokeLinejoin: 'round' as const };
  return (
    <svg
      viewBox="0 0 100 110"
      width={taille}
      height={(taille * 110) / 100}
      aria-hidden="true"
      className="lt-visage"
    >
      {/* épaules */}
      <path d="M8 110c2-22 20-30 42-30s40 8 42 30z" fill={t.haut} {...contour} />
      {/* cheveux arrière */}
      {t.coiffure === 1 ? (
        <path
          d="M18 52c-6 30 4 40 10 42h44c6-2 16-12 10-42-2-26-20-34-32-34S20 26 18 52z"
          fill={t.cheveux}
          {...contour}
        />
      ) : null}
      {t.coiffure === 2 ? <circle cx="50" cy="44" r="38" fill={t.cheveux} {...contour} /> : null}
      {/* cou et tête */}
      <rect x="42" y="68" width="16" height="16" rx="4" fill={t.peau} {...contour} />
      <ellipse cx="50" cy="48" rx="26" ry="29" fill={t.peau} {...contour} />
      {t.boucle ? (
        <circle cx="24" cy="56" r="3" fill="#ffc61a" {...contour} strokeWidth={2} />
      ) : null}
      {/* cheveux avant */}
      {t.coiffure === 0 ? (
        <path
          d="M24 40c0-18 12-24 26-24s26 6 26 24c-10-8-18-10-26-10s-16 2-26 10z"
          fill={t.cheveux}
          {...contour}
        />
      ) : null}
      {t.coiffure === 1 ? (
        <path
          d="M24 42c4-16 14-22 26-22s22 6 26 22c-8-6-16-8-26-8s-18 2-26 8z"
          fill={t.cheveux}
          {...contour}
        />
      ) : null}
      {t.coiffure === 2 ? (
        <path
          d="M26 38c4-12 12-16 24-16s20 4 24 16c-8-4-16-6-24-6s-16 2-24 6z"
          fill={t.cheveux}
          {...contour}
        />
      ) : null}
      {t.coiffure === 3 ? <path d="M42 8h16l2 28H40z" fill={t.cheveux} {...contour} /> : null}
      {t.coiffure === 4 ? (
        <path
          d="M22 44c-2-24 12-32 28-32s30 8 28 32c-4-14-14-18-28-18S26 30 22 44z"
          fill={t.cheveux}
          {...contour}
        />
      ) : null}
      {t.casquette ? (
        <g>
          <path d="M22 36c2-16 14-22 28-22s26 6 28 22z" fill={t.haut} {...contour} />
          <path d="M56 34h30c0 6-8 8-30 4z" fill={t.haut} {...contour} />
        </g>
      ) : null}
      {/* yeux */}
      {t.yeux === 0 ? (
        <>
          <circle cx="39" cy="50" r="4" fill="#1b0f3a" />
          <circle cx="61" cy="50" r="4" fill="#1b0f3a" />
          <circle cx="40.5" cy="48.5" r="1.4" fill="#fff" />
          <circle cx="62.5" cy="48.5" r="1.4" fill="#fff" />
        </>
      ) : t.yeux === 1 ? (
        <>
          <path
            d="M34 50q5-6 10 0"
            fill="none"
            stroke="#1b0f3a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M56 50q5-6 10 0"
            fill="none"
            stroke="#1b0f3a"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <ellipse cx="39" cy="50" rx="5" ry="3.4" fill="#fff" {...contour} strokeWidth={2} />
          <ellipse cx="61" cy="50" rx="5" ry="3.4" fill="#fff" {...contour} strokeWidth={2} />
          <circle cx="40" cy="50" r="2" fill="#1b0f3a" />
          <circle cx="62" cy="50" r="2" fill="#1b0f3a" />
        </>
      )}
      <path
        d={
          humeur === 'ravi'
            ? 'M33 41q6-4 12 0M55 41q6-4 12 0'
            : humeur === 'triste'
              ? 'M33 44l12-3M55 41l12 3'
              : humeur === 'furieux'
                ? 'M33 39l12 5M55 44l12-5'
                : 'M33 42h12M55 42h12'
        }
        fill="none"
        stroke={t.cheveux}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {t.lunettes ? (
        <g fill="rgb(120 200 255 / 0.25)" {...contour} strokeWidth={2.5}>
          <circle cx="39" cy="50" r="8.5" />
          <circle cx="61" cy="50" r="8.5" />
          <path d="M47.5 50h5" fill="none" />
        </g>
      ) : null}
      {/* bouche */}
      {humeur === 'ravi' ? (
        <path d="M38 62q12 15 24 0z" fill="#fff" {...contour} strokeWidth={2.5} />
      ) : humeur === 'triste' ? (
        <path
          d="M41 69q9-8 18 0"
          fill="none"
          stroke="#1b0f3a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : humeur === 'furieux' ? (
        <path
          d="M40 68l5-3 5 3 5-3 5 3"
          fill="none"
          stroke="#1b0f3a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : t.bouche === 0 ? (
        <path
          d="M40 64q10 9 20 0"
          fill="#fff"
          stroke="#1b0f3a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : t.bouche === 1 ? (
        <path
          d="M42 65q8 5 16 0"
          fill="none"
          stroke="#1b0f3a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ) : (
        <ellipse cx="50" cy="65" rx="5" ry="4" fill="#8d1f3a" {...contour} strokeWidth={2.5} />
      )}
    </svg>
  );
}
