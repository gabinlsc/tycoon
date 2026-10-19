/** Couleur stable d'un genre musical, pour les pastilles et avatars. */
const PALETTE = ['purple', 'blue', 'pink', 'orange', 'teal', 'green', 'red', 'gold'] as const;
export function couleurDuGenre(genre: string): (typeof PALETTE)[number] {
  let h = 0;
  for (const c of genre) h = (h * 31 + (c.codePointAt(0) ?? 0)) >>> 0;
  return PALETTE[h % PALETTE.length] ?? 'purple';
}

/** Initiales d'un nom de scène (« Chloé L. » → « CL »). */
export const initiales = (nom: string): string =>
  nom
    .split(/[\s.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');

/** Avatar rond aux initiales, coloré selon le genre de l'artiste. */
export function Avatar({
  nom,
  genre,
  taille = 'md',
}: {
  nom: string;
  genre: string;
  taille?: 'md' | 'lg';
}) {
  return (
    <span
      className={`lt-avatar lt-avatar--${couleurDuGenre(genre)} lt-avatar--${taille}`}
      aria-hidden="true"
    >
      {initiales(nom)}
    </span>
  );
}
