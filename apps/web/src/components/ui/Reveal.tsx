import type { ElementType, ReactNode } from 'react';
import { useInView } from '../../lib/useInView';

interface RevealProps {
  children: ReactNode;
  /** Balise rendue : section, div, article… */
  as?: ElementType;
  className?: string;
  /** Style de révélation : masque descendant (texte) ou ouverture latérale (blocs). */
  mask?: 'down' | 'right';
  id?: string;
  'aria-labelledby'?: string;
}

/** Révèle son contenu par masque quand il entre dans le viewport (voir .reveal dans reveal.css). */
export function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  mask = 'down',
  ...rest
}: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref}
      className={`reveal reveal--${mask}${inView ? ' is-in' : ''} ${className}`.trim()}
      {...rest}
    >
      {children}
    </Tag>
  );
}
