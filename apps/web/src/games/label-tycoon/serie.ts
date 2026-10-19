/** Série de jours : combien de jours d'affilée le joueur est venu faire tourner son label. */

const CLE = 'tycoon:label:jours';

/** Date locale au format AAAA-MM-JJ. */
export function dateDuJour(maintenant: Date = new Date()): string {
  const m = String(maintenant.getMonth() + 1).padStart(2, '0');
  const j = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${m}-${j}`;
}

const JOUR_MS = 86_400_000;
const enJours = (iso: string): number => Math.floor(Date.parse(`${iso}T00:00:00Z`) / JOUR_MS);

/**
 * Longueur de la série en cours : jours consécutifs jusqu'à aujourd'hui, ou jusqu'à hier si
 * aujourd'hui n'est pas encore joué (la série n'est perdue qu'après un jour entier d'absence).
 */
export function calculerSerie(jours: readonly string[], aujourdhui: string): number {
  const connus = new Set(jours.map(enJours));
  let jour = enJours(aujourdhui);
  if (!connus.has(jour)) jour -= 1;
  let serie = 0;
  while (connus.has(jour)) {
    serie += 1;
    jour -= 1;
  }
  return serie;
}

/** Paliers de la série qui donnent un titre de plus en plus flatteur. */
export function titreDeSerie(serie: number): string | null {
  if (serie >= 30) return 'Légende du label';
  if (serie >= 7) return 'Habitué';
  if (serie >= 3) return 'Régulier';
  return null;
}

export function lireJours(): string[] {
  try {
    const brut = window.localStorage.getItem(CLE);
    const liste = brut ? (JSON.parse(brut) as unknown) : [];
    return Array.isArray(liste) ? liste.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Note aujourd'hui comme jour joué et renvoie la série à jour. */
export function enregistrerJour(maintenant: Date = new Date()): number {
  const jour = dateDuJour(maintenant);
  const jours = lireJours();
  if (!jours.includes(jour)) {
    jours.push(jour);
    try {
      window.localStorage.setItem(CLE, JSON.stringify(jours.slice(-120)));
    } catch {
      /* stockage indisponible : la série vaut pour la session */
    }
  }
  return calculerSerie(jours, jour);
}
