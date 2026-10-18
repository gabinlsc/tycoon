import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { GLOSSAIRE, termLabel } from '@tycoon/label-tycoon';

export interface TermeExplique {
  cle: string;
  contribution: number;
}

/** Part de chaque terme dans le total des contributions (en valeur absolue), pour dessiner les barres. */
export function partsAbsolues(termes: readonly TermeExplique[]): number[] {
  const total = termes.reduce((sum, t) => sum + Math.abs(t.contribution), 0);
  return termes.map((t) => (total === 0 ? 0 : Math.abs(t.contribution) / total));
}

/**
 * Infobulle accessible : s'ouvre au survol, au focus clavier ou au toucher, se ferme avec Échap.
 * Le déclencheur est un bouton, la bulle est référencée par `aria-describedby`.
 */
export function Infobulle({
  children,
  contenu,
  className = '',
}: {
  children: ReactNode;
  contenu: ReactNode;
  className?: string;
}) {
  const id = useId();
  const [ouverte, setOuverte] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ouverte) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOuverte(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ouverte]);

  return (
    <span
      ref={ref}
      className={`label-tip ${className}`.trim()}
      onMouseEnter={() => setOuverte(true)}
      onMouseLeave={() => setOuverte(false)}
    >
      <button
        type="button"
        className="label-tip__trigger"
        aria-describedby={ouverte ? id : undefined}
        aria-expanded={ouverte}
        onFocus={() => setOuverte(true)}
        onBlur={() => setOuverte(false)}
        onClick={() => setOuverte((o) => !o)}
      >
        {children}
      </button>
      {ouverte ? (
        <span role="tooltip" id={id} className="label-tip__bubble">
          {contenu}
        </span>
      ) : null}
    </span>
  );
}

/** Infobulle d'un terme du glossaire (« hype », « fourchette »…). Texte brut si la notion est inconnue. */
export function Terme({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSAIRE[id];
  if (!entry) return <>{children ?? id}</>;
  return (
    <Infobulle
      contenu={
        <>
          <strong>{entry.terme}</strong>
          <br />
          {entry.definition}
        </>
      }
    >
      {children ?? entry.terme}
    </Infobulle>
  );
}

const format = (contribution: number, argent: boolean): string => {
  const value = argent ? Math.round(contribution / 100) : Math.round(contribution * 10) / 10;
  return `${value > 0 ? '+' : ''}${value.toLocaleString('fr-FR')}${argent ? ' €' : ''}`;
};

/** Infobulle d'un calcul : liste des termes avec leur contribution, la somme faisant la valeur affichée. */
export function InfobulleCalcul({
  children,
  termes,
  argent = false,
}: {
  children: ReactNode;
  termes: readonly TermeExplique[];
  argent?: boolean;
}) {
  const parts = partsAbsolues(termes);
  return (
    <Infobulle
      contenu={
        <ul className="label-tip__terms">
          {termes.map((t, i) => (
            <li key={t.cle}>
              <span>{termLabel(t.cle)}</span>
              <span className="label-tip__bar" aria-hidden="true">
                <span
                  style={{ width: `${Math.round((parts[i] ?? 0) * 100)}%` }}
                  data-negatif={t.contribution < 0 ? '' : undefined}
                />
              </span>
              <span className="mono">{format(t.contribution, argent)}</span>
            </li>
          ))}
        </ul>
      }
    >
      {children}
    </Infobulle>
  );
}
