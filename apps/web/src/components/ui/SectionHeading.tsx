import type { ReactNode } from 'react';
import { Rule } from './Rule';

interface SectionHeadingProps {
  /** Numéro de rubrique, affiché en mono : « 01 ». */
  number: string;
  id: string;
  title: string;
  /** Sous-titre en italique, façon surtitre de journal. */
  kicker?: ReactNode;
}

/** En-tête de rubrique : numéro, filet épais, titre display. */
export function SectionHeading({ number, id, title, kicker }: SectionHeadingProps) {
  return (
    <header className="section-heading">
      <Rule weight="thick" />
      <div className="section-heading__row">
        <span className="section-heading__number mono">{number}</span>
        <h2 id={id} className="section-heading__title">
          {title}
        </h2>
        {kicker ? <p className="section-heading__kicker">{kicker}</p> : null}
      </div>
    </header>
  );
}
