interface FlipDigitsProps {
  value: string;
}

/**
 * Affiche un nombre caractère par caractère, façon tableau d'affichage mécanique.
 * La clé inclut le caractère : quand il change, le <span> est remonté et rejoue
 * l'animation de volet (voir .flip dans ticker.css). Les chiffres inchangés ne bougent pas.
 */
export function FlipDigits({ value }: FlipDigitsProps) {
  return (
    <span className="flip mono">
      {Array.from(value).map((char, index) => (
        <span key={`${index}-${char}`} className="flip__char">
          {char}
        </span>
      ))}
    </span>
  );
}
