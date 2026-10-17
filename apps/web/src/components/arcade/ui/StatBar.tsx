interface StatBarProps {
  label: string;
  /** Valeur de 1 à 5. */
  value: number;
}

/** Barre de stat façon fiche de personnage : cinq segments, dont `value` sont remplis. */
export function StatBar({ label, value }: StatBarProps) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__bar" role="img" aria-label={`${value} sur 5`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={`stat__seg${n <= value ? ' is-on' : ''}`} />
        ))}
      </span>
    </div>
  );
}
