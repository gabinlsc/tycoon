import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type Tone = 'green' | 'gold' | 'purple' | 'ghost';

type ButtonProps<T extends ElementType> = {
  /** Élément rendu : <button> par défaut, <a>, ou <Link> de react-router. */
  as?: T;
  tone?: Tone;
  size?: 'md' | 'lg';
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'tone' | 'size' | 'children'>;

/** Bouton 3D de jeu mobile : s'enfonce au clic. */
export function Button<T extends ElementType = 'button'>({
  as,
  tone = 'green',
  size = 'md',
  children,
  className = '',
  ...rest
}: ButtonProps<T> & { className?: string }) {
  const Tag: ElementType = as ?? 'button';
  return (
    <Tag className={`btn btn--${tone} btn--${size} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
