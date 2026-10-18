/** Meilleur score du défi, par jour, mémorisé dans le navigateur (un défi se rejoue à volonté). */
const cle = (date: string): string => `tycoon:label:defi:${date}`;

export function lireMeilleurScore(date: string): number | null {
  try {
    const brut = window.localStorage.getItem(cle(date));
    const valeur = brut === null ? NaN : Number(brut);
    return Number.isFinite(valeur) ? valeur : null;
  } catch {
    return null;
  }
}

/** Enregistre le score s'il bat le précédent ; renvoie le meilleur score connu. */
export function enregistrerScore(date: string, score: number): number {
  const ancien = lireMeilleurScore(date);
  if (ancien !== null && ancien >= score) return ancien;
  try {
    window.localStorage.setItem(cle(date), String(score));
  } catch {
    /* stockage indisponible : le score ne sera pas mémorisé */
  }
  return score;
}
