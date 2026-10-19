import type { CSSProperties } from 'react';
import type { Periode } from '../siege/Siege';

const empreinte = (texte: string): number => {
  let h = 0x811c9dc5;
  for (const c of texte) {
    h ^= c.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
};

/** Silhouettes lointaines de la ville, qui dérivent très lentement. */
export function Horizon() {
  const immeubles = [
    [0, 90],
    [34, 140],
    [70, 110],
    [104, 170],
    [142, 100],
    [176, 150],
    [214, 120],
    [250, 190],
    [290, 105],
    [326, 160],
    [362, 125],
    [398, 175],
    [436, 95],
    [472, 145],
    [510, 115],
    [548, 180],
  ] as const;
  return (
    <div className="lt-horizon" aria-hidden="true">
      {[0, 1].map((k) => (
        <svg key={k} viewBox="0 0 584 220" preserveAspectRatio="none" className="lt-horizon__bande">
          {immeubles.map(([x, h]) => (
            <rect key={x} x={x} y={220 - h} width="30" height={h} fill="currentColor" />
          ))}
        </svg>
      ))}
    </div>
  );
}

type Style = 'verre' | 'deco' | 'brique' | 'fleche';
const STYLES: readonly Style[] = ['verre', 'deco', 'brique', 'fleche'];

/** Tour d'un label rival : un style par rival, fenêtres allumées de façon stable, enseigne au nom. */
export function Tour({
  nom,
  hauteur,
  rang,
  periode,
}: {
  nom: string;
  hauteur: number;
  rang: number;
  periode: Periode;
}) {
  const style = STYLES[rang % STYLES.length] ?? 'verre';
  const h = empreinte(nom);
  const nuit = periode === 'nuit' || periode === 'soir';
  const colonnes = style === 'fleche' ? 3 : 4;
  const lignes = Math.round(hauteur / 7);
  return (
    <li className={`lt-tour lt-tour--${style}`} style={{ '--h': `${hauteur}%` } as CSSProperties}>
      <span className="lt-tour__nom">{nom}</span>
      {style === 'fleche' ? <span className="lt-tour__fleche" /> : null}
      {style === 'brique' ? <span className="lt-tour__reservoir" /> : null}
      <span className="lt-tour__corps">
        {Array.from({ length: lignes * colonnes }, (_, i) => {
          const allumee = ((h >> (i % 24)) + i * 7) % (nuit ? 3 : 7) === 0;
          return <i key={i} className={allumee ? 'is-on' : undefined} />;
        })}
      </span>
    </li>
  );
}
