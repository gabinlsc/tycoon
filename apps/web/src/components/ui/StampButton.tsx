import type { AnchorHTMLAttributes, ReactNode } from 'react';

interface StampButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

/** Bouton d'action principal : un tampon encreur vermillon, qui s'écrase au clic. */
export function StampButton({ children, className = '', ...rest }: StampButtonProps) {
  return (
    <a className={`stamp-button ${className}`.trim()} {...rest}>
      {children}
    </a>
  );
}
