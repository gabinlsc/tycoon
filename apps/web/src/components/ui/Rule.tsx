interface RuleProps {
  /** Filet épais (manchette) ou fin (colonnes). */
  weight?: 'thin' | 'thick' | 'double';
  /** Joue le tracé de gauche à droite au chargement. */
  draw?: boolean;
}

/** Filet d'imprimerie horizontal. Décoratif, donc masqué aux lecteurs d'écran. */
export function Rule({ weight = 'thin', draw = false }: RuleProps) {
  return (
    <div
      className={`rule rule--${weight}${draw ? ' rule--draw' : ''}`}
      role="presentation"
      aria-hidden="true"
    />
  );
}
