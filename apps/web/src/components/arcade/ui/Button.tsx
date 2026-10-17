import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Tone = 'green' | 'gold' | 'purple' | 'ghost';

interface CommonProps {
  tone?: Tone;
  size?: 'md' | 'lg';
  children: ReactNode;
}

type LinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

/** Bouton 3D de jeu mobile : s'enfonce au clic. Lien si `href`, bouton sinon. */
export function Button(props: LinkProps | ButtonProps) {
  const { tone = 'green', size = 'md', children, className = '', ...rest } = props;
  const classes = `btn btn--${tone} btn--${size} ${className}`.trim();
  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    );
  }
  return (
    <button className={classes} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
