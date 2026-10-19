import { useId } from 'react';
import { abrege, cheminAire, cheminLigne, graduations, plageDe, projeter } from './echelle';

export interface Serie {
  nom: string;
  valeurs: readonly number[];
}

interface CommunProps {
  /** Titre lu par les lecteurs d'écran, et utilisé dans la légende de la table de secours. */
  titre: string;
  /** Étiquettes de l'axe horizontal (une par valeur). */
  etiquettes: readonly string[];
  series: readonly Serie[];
  largeur?: number;
  hauteur?: number;
}

const MARGE = { haut: 12, droite: 12, bas: 28, gauche: 48 };
const COULEURS = [
  'var(--purple)',
  'var(--green)',
  'var(--orange)',
  'var(--blue)',
  'var(--pink)',
] as const;
const couleur = (i: number): string => COULEURS[i % COULEURS.length] ?? 'var(--purple)';

/** Table de secours : mêmes données pour les lecteurs d'écran, masquée visuellement. */
function TableSecours({
  titre,
  etiquettes,
  series,
}: Pick<CommunProps, 'titre' | 'etiquettes' | 'series'>) {
  return (
    <table className="visually-hidden">
      <caption>{titre}</caption>
      <thead>
        <tr>
          <th scope="col">Période</th>
          {series.map((s) => (
            <th key={s.nom} scope="col">
              {s.nom}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {etiquettes.map((e, i) => (
          <tr key={`${e}-${i}`}>
            <th scope="row">{e}</th>
            {series.map((s) => (
              <td key={s.nom}>{s.valeurs[i] ?? ''}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Repere({
  ticks,
  plage,
  largeur,
  hauteur,
}: {
  ticks: number[];
  plage: { min: number; max: number };
  largeur: number;
  hauteur: number;
}) {
  return (
    <g className="graph__grid" aria-hidden="true">
      {ticks.map((t) => {
        const y = projeter(t, plage, hauteur - MARGE.bas, MARGE.haut);
        return (
          <g key={t}>
            <line x1={MARGE.gauche} x2={largeur - MARGE.droite} y1={y} y2={y} />
            <text x={MARGE.gauche - 6} y={y + 4} textAnchor="end">
              {abrege(t)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function Legende({ series }: { series: readonly Serie[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="graph__legend">
      {series.map((s, i) => (
        <li key={s.nom}>
          <span className="graph__swatch" style={{ background: couleur(i) }} aria-hidden="true" />{' '}
          {s.nom}
        </li>
      ))}
    </ul>
  );
}

/** Courbes (une ou plusieurs séries) ; `aire` remplit sous la première série. */
export function GraphCourbe({
  titre,
  etiquettes,
  series,
  largeur = 520,
  hauteur = 220,
  aire = false,
}: CommunProps & { aire?: boolean }) {
  const tous = series.flatMap((s) => s.valeurs);
  const plage = plageDe(tous);
  const ticks = graduations(plage);
  const n = Math.max(etiquettes.length, ...series.map((s) => s.valeurs.length));
  const x = (i: number) =>
    projeter(i, { min: 0, max: Math.max(1, n - 1) }, MARGE.gauche, largeur - MARGE.droite);
  const y = (v: number) => projeter(v, plage, hauteur - MARGE.bas, MARGE.haut);
  const base = y(Math.max(plage.min, Math.min(0, plage.max)));
  const id = useId();
  return (
    <figure className="graph">
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        role="img"
        aria-labelledby={id}
        className="graph__svg"
      >
        <title id={id}>{titre}</title>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={s.nom} id={`${id}-g${si}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={couleur(si)} stopOpacity="0.55" />
              <stop offset="1" stopColor={couleur(si)} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        <Repere ticks={ticks} plage={plage} largeur={largeur} hauteur={hauteur} />
        {series.map((s, si) => {
          const pts = s.valeurs.map((v, i) => ({ x: x(i), y: y(v) }));
          const dernier = pts[pts.length - 1];
          const derniereValeur = s.valeurs[s.valeurs.length - 1];
          return (
            <g key={s.nom}>
              {aire && si === 0 ? (
                <path
                  d={cheminAire(pts, base)}
                  className="graph__area"
                  style={{ fill: `url(#${id}-g${si})` }}
                />
              ) : null}
              <path d={cheminLigne(pts)} className="graph__line" style={{ stroke: couleur(si) }} />
              {dernier && derniereValeur !== undefined ? (
                <g className="graph__fin" aria-hidden="true">
                  <circle
                    cx={dernier.x}
                    cy={dernier.y}
                    r={9}
                    className="graph__halo"
                    style={{ fill: couleur(si) }}
                  />
                  <circle
                    cx={dernier.x}
                    cy={dernier.y}
                    r={4.5}
                    className="graph__point"
                    style={{ stroke: couleur(si) }}
                  />
                  {si === 0 ? (
                    <text
                      x={dernier.x}
                      y={Math.max(MARGE.haut + 8, dernier.y - 14)}
                      textAnchor="end"
                      className="graph__bulle"
                    >
                      {abrege(derniereValeur)}
                    </text>
                  ) : null}
                </g>
              ) : null}
            </g>
          );
        })}
        <g className="graph__axis" aria-hidden="true">
          {etiquettes.map((e, i) =>
            i % Math.ceil(n / 8) === 0 ? (
              <text key={`${e}-${i}`} x={x(i)} y={hauteur - 8} textAnchor="middle">
                {e}
              </text>
            ) : null,
          )}
        </g>
      </svg>
      <Legende series={series} />
      <TableSecours titre={titre} etiquettes={etiquettes} series={series} />
    </figure>
  );
}

/** Barres groupées : une barre par série et par période. */
export function GraphBarres({
  titre,
  etiquettes,
  series,
  largeur = 520,
  hauteur = 220,
}: CommunProps) {
  const plage = plageDe(series.flatMap((s) => s.valeurs));
  const ticks = graduations(plage);
  const n = etiquettes.length;
  const groupe = (largeur - MARGE.gauche - MARGE.droite) / Math.max(1, n);
  const barre = (groupe * 0.8) / Math.max(1, series.length);
  const y = (v: number) => projeter(v, plage, hauteur - MARGE.bas, MARGE.haut);
  const zero = y(0);
  const id = useId();
  return (
    <figure className="graph">
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        role="img"
        aria-labelledby={id}
        className="graph__svg"
      >
        <title id={id}>{titre}</title>
        <Repere ticks={ticks} plage={plage} largeur={largeur} hauteur={hauteur} />
        {etiquettes.map((e, i) => (
          <g key={`${e}-${i}`}>
            {series.map((s, si) => {
              const v = s.valeurs[i] ?? 0;
              const top = Math.min(y(v), zero);
              return (
                <rect
                  key={s.nom}
                  x={MARGE.gauche + i * groupe + groupe * 0.1 + si * barre}
                  y={top}
                  width={Math.max(1, barre - 2)}
                  height={Math.abs(y(v) - zero)}
                  rx={3}
                  className="graph__bar"
                  style={{ fill: v < 0 ? 'var(--red)' : couleur(si) }}
                />
              );
            })}
            <text
              x={MARGE.gauche + i * groupe + groupe / 2}
              y={hauteur - 8}
              textAnchor="middle"
              className="graph__axis"
              aria-hidden="true"
            >
              {e}
            </text>
          </g>
        ))}
      </svg>
      <Legende series={series} />
      <TableSecours titre={titre} etiquettes={etiquettes} series={series} />
    </figure>
  );
}

export interface LigneHitParade {
  rang: number;
  nom: string;
  valeur: number;
  /** Mise en avant (par exemple une sortie du joueur). */
  joueur?: boolean;
}

/** Hit-parade : liste classée avec une barre proportionnelle au meilleur score. */
export function HitParade({ titre, lignes }: { titre: string; lignes: readonly LigneHitParade[] }) {
  const max = Math.max(1, ...lignes.map((l) => l.valeur));
  return (
    <figure className="graph graph--hit">
      <figcaption>{titre}</figcaption>
      <ol className="hit">
        {lignes.map((l) => (
          <li key={`${l.rang}-${l.nom}`} className={l.joueur ? 'hit__row is-player' : 'hit__row'}>
            <span className={`hit__rank mono${l.rang <= 3 ? ` hit__rank--${l.rang}` : ''}`}>
              {l.rang}
            </span>
            <span className="hit__name">{l.nom}</span>
            <span className="hit__bar" aria-hidden="true">
              <span style={{ width: `${Math.round((l.valeur / max) * 100)}%` }} />
            </span>
            <span className="hit__value mono">{abrege(l.valeur)}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
