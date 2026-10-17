/** Logo : une manette stylisée sur une pastille jaune. Décoratif, le nom du site est dans le texte voisin. */
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="21" fill="var(--gold)" stroke="var(--outline)" strokeWidth="3.5" />
      <path
        d="M13 20 H35 Q40 20 40 26 V29 Q40 33 36 33 Q33 33 31.500 30 H16.500 Q15 33 12 33 Q8 33 8 29 V26 Q8 20 13 20 Z"
        transform="translate(0 -1)"
        fill="#fff"
        stroke="var(--outline)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M15 24 V30 M12 27 H18"
        stroke="var(--outline)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="30" cy="25" r="2" fill="var(--red)" stroke="var(--outline)" strokeWidth="1.5" />
      <circle cx="34" cy="28" r="2" fill="var(--green)" stroke="var(--outline)" strokeWidth="1.5" />
    </svg>
  );
}
