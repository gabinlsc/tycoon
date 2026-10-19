import type { CSSProperties, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export type Ton = 'purple' | 'blue' | 'pink' | 'orange' | 'teal' | 'green' | 'red' | 'gold';

const PALETTE: readonly Ton[] = [
  'purple',
  'pink',
  'blue',
  'orange',
  'teal',
  'green',
  'gold',
  'red',
];
export const tonDeRang = (i: number): Ton => PALETTE[i % PALETTE.length] ?? 'purple';

/** Grosse tuile chiffrée : icône, valeur, libellé. */
export function Tuile({
  Icone,
  valeur,
  libelle,
  ton = 'purple',
  alerte = false,
}: {
  Icone: LucideIcon;
  valeur: ReactNode;
  libelle: string;
  ton?: Ton;
  alerte?: boolean;
}) {
  return (
    <div className={`lt-kpi lt-kpi--${ton}${alerte ? ' is-alerte' : ''}`}>
      <span className="lt-kpi__icone" aria-hidden="true">
        <Icone size={26} strokeWidth={2.4} />
      </span>
      <span className="lt-kpi__valeur mono">{valeur}</span>
      <span className="lt-kpi__libelle">{libelle}</span>
    </div>
  );
}

/** Rangée de tuiles. */
export function Tuiles({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="lt-kpis" role="group" aria-label={label}>
      {children}
    </div>
  );
}

/** Panneau titré, avec une pastille d'icône colorée. */
export function Panneau({
  titre,
  Icone,
  ton = 'purple',
  children,
  id,
}: {
  titre: string;
  Icone: LucideIcon;
  ton?: Ton;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className={`lt-panneau lt-panneau--${ton}`} aria-labelledby={id}>
      <header className="lt-panneau__tete">
        <span className="lt-panneau__icone" aria-hidden="true">
          <Icone size={22} strokeWidth={2.4} />
        </span>
        <h3 id={id}>{titre}</h3>
      </header>
      {children}
    </section>
  );
}

export interface Part {
  nom: string;
  valeur: number;
}

/** Anneau de répartition : chaque part a sa couleur, la légende donne les montants. */
export function Anneau({
  titre,
  parts,
  centre,
  format,
}: {
  titre: string;
  parts: readonly Part[];
  centre: string;
  format: (v: number) => string;
}) {
  const total = parts.reduce((s, p) => s + Math.max(0, p.valeur), 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <figure className="lt-anneau">
      <svg viewBox="0 0 140 140" role="img" aria-label={titre} className="lt-anneau__svg">
        <circle cx="70" cy="70" r={R} className="lt-anneau__fond" />
        {total > 0
          ? parts.map((p, i) => {
              const frac = Math.max(0, p.valeur) / total;
              const seg = (
                <circle
                  key={p.nom}
                  cx="70"
                  cy="70"
                  r={R}
                  className={`lt-anneau__part lt-ton--${tonDeRang(i)}`}
                  strokeDasharray={`${Math.max(0, frac * C - 2)} ${C}`}
                  strokeDashoffset={-acc * C}
                />
              );
              acc += frac;
              return seg;
            })
          : null}
        <text x="70" y="76" textAnchor="middle" className="lt-anneau__centre">
          {centre}
        </text>
      </svg>
      <figcaption>
        <ul className="lt-anneau__legende">
          {parts.map((p, i) => (
            <li key={p.nom}>
              <span className={`lt-anneau__pastille lt-ton--${tonDeRang(i)}`} aria-hidden="true" />
              <span>{p.nom}</span>
              <strong className="mono">{format(p.valeur)}</strong>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}

/** Jauge horizontale colorée 0-100 (ou 0-max). */
export function Barre({
  libelle,
  valeur,
  max = 100,
  ton = 'purple',
}: {
  libelle: string;
  valeur: number;
  max?: number;
  ton?: Ton;
}) {
  const pct = Math.max(0, Math.min(100, (valeur / Math.max(1, max)) * 100));
  return (
    <span className={`lt-jauge-h lt-ton--${ton}`}>
      <span className="lt-jauge-h__libelle">{libelle}</span>
      <span
        className="lt-jauge-h__piste"
        role="img"
        aria-label={`${libelle} : ${Math.round(valeur)} sur ${max}`}
      >
        <span style={{ width: `${pct}%` } as CSSProperties} />
      </span>
    </span>
  );
}
