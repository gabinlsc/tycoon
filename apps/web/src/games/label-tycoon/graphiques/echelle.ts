/** Fonctions d'échelle pures des graphiques : testables sans DOM. */

export interface Plage {
  min: number;
  max: number;
}

/** Plage englobant toutes les valeurs, étendue à zéro si demandé ; jamais vide. */
export function plageDe(valeurs: readonly number[], inclureZero = true): Plage {
  if (valeurs.length === 0) return { min: 0, max: 1 };
  let min = Math.min(...valeurs);
  let max = Math.max(...valeurs);
  if (inclureZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  return min === max ? { min: min - 1, max: max + 1 } : { min, max };
}

/** Projette une valeur de `plage` vers `[debut, fin]` (l'axe peut être inversé : y de SVG). */
export function projeter(valeur: number, plage: Plage, debut: number, fin: number): number {
  const t = (valeur - plage.min) / (plage.max - plage.min);
  return debut + t * (fin - debut);
}

/** Graduations « rondes » (1, 2, 5 × 10^n) couvrant la plage, environ `cible` pas. */
export function graduations(plage: Plage, cible = 5): number[] {
  const brut = (plage.max - plage.min) / Math.max(1, cible);
  const exposant = Math.floor(Math.log10(brut));
  const base = 10 ** exposant;
  const pas = [1, 2, 5, 10].map((m) => m * base).find((p) => p >= brut) ?? base * 10;
  const out: number[] = [];
  for (let v = Math.ceil(plage.min / pas) * pas; v <= plage.max + pas * 1e-9; v += pas)
    out.push(Math.round(v / pas) * pas);
  return out;
}

export interface Point {
  x: number;
  y: number;
}

/** Tracé SVG d'une ligne brisée (`M x,y L x,y…`). */
export function cheminLigne(points: readonly Point[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
}

/** Tracé SVG d'une aire : la ligne, refermée sur la ligne de base. */
export function cheminAire(points: readonly Point[], base: number): string {
  const premier = points[0];
  const dernier = points[points.length - 1];
  if (!premier || !dernier) return '';
  return `${cheminLigne(points)} L${dernier.x.toFixed(1)},${base.toFixed(1)} L${premier.x.toFixed(1)},${base.toFixed(1)} Z`;
}

/** Formate un nombre court : 1 200 → « 1,2 k », 3 400 000 → « 3,4 M ». */
export function abrege(valeur: number): string {
  const a = Math.abs(valeur);
  if (a >= 1_000_000)
    return `${(valeur / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;
  if (a >= 1000)
    return `${(valeur / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k`;
  return valeur.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}
