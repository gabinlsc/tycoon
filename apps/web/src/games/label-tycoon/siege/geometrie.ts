/** Géométrie du siège dessiné (unités du viewBox 560 × 740). */
export const LARGEUR = 560;
export const HAUTEUR = 740;
/** Marges de la façade et intérieur visible des salles. */
export const X_FACADE = 40;
export const X_INT = 66;
export const L_INT = 428;
/** Hauteur d'une salle et pas entre deux étages. */
export const H_SALLE = 96;
export const PAS = 102;
/** Ordonnée du haut de la première salle (le concert, au sommet). */
export const Y_PREMIERE = 150;

export const yEtage = (rang: number): number => Y_PREMIERE + rang * PAS;

/** Position d'une salle en pourcentage de la scène, pour poser les vrais boutons par-dessus. */
export function zoneEtage(rang: number): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${(X_INT / LARGEUR) * 100}%`,
    top: `${(yEtage(rang) / HAUTEUR) * 100}%`,
    width: `${(L_INT / LARGEUR) * 100}%`,
    height: `${(H_SALLE / HAUTEUR) * 100}%`,
  };
}
