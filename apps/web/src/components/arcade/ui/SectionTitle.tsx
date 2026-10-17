import type { ReactNode } from 'react';

interface SectionTitleProps {
  /** Numéro de niveau affiché dans la pastille. */
  level: string;
  id: string;
  title: string;
  kicker?: ReactNode;
}

/** Titre de rubrique : pastille de niveau, gros titre, sous-titre. */
export function SectionTitle({ level, id, title, kicker }: SectionTitleProps) {
  return (
    <header className="section-title">
      <p className="section-title__level" aria-hidden="true">
        <span>Niv.</span> {level}
      </p>
      <h2 id={id} className="section-title__text">
        {title}
      </h2>
      {kicker ? <p className="section-title__kicker">{kicker}</p> : null}
    </header>
  );
}
