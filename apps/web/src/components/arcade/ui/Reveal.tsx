import type { ElementType, ReactNode } from 'react';
import { useInView } from '../../../lib/useInView';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Décalage d'entrée en ms, pour échelonner une rangée de cartes. */
  delay?: number;
}

/** Fait « sauter » son contenu à l'écran (rebond) quand il entre dans le viewport. */
export function Reveal({ children, as: Tag = 'div', className = '', delay = 0 }: RevealProps) {
  const { ref, inView } = useInView<HTMLElement>(0.1);
  return (
    <Tag
      ref={ref}
      className={`reveal${inView ? ' is-in' : ''} ${className}`.trim()}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
