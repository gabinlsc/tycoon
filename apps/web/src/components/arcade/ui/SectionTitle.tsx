import type { ReactNode } from 'react';

interface SectionTitleProps {
  /** Numéro de niveau affiché dans la pastille. */
  level: string;
  id: string;
  title: string;
  kicker?: ReactNode;
  /** h1 quand la rubrique est le titre de la page, h2 sinon. */
  as?: 'h1' | 'h2';
}

/** Titre de rubrique : pastille de niveau, gros titre, sous-titre. */
export function SectionTitle({ level, id, title, kicker, as: Heading = 'h2' }: SectionTitleProps) {
  return (
    <header className="section-title">
      <p className="section-title__level" aria-hidden="true">
        <span>Niv.</span> {level}
      </p>
      <Heading id={id} className="section-title__text">
        {title}
      </Heading>
      {kicker ? <p className="section-title__kicker">{kicker}</p> : null}
    </header>
  );
}
