import type { BilanRegne } from '@tycoon/label-tycoon';

/** Un règne clos, tel que le Panthéon le conserve. */
export interface EntreePantheon {
  label: string;
  generation: number;
  /** Valorisation finale en centimes. */
  valorisation: number;
  palier: string;
  semaines: number;
  disquesCertifies: number;
  legendes: number;
  bonus: string[];
  clotureLe: string;
}

const CLE = 'tycoon:label:pantheon';
/** Le Panthéon garde les meilleurs règnes seulement. */
export const PANTHEON_MAX = 10;

const estEntree = (v: unknown): v is EntreePantheon => {
  if (typeof v !== 'object' || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e['label'] === 'string' &&
    typeof e['generation'] === 'number' &&
    typeof e['valorisation'] === 'number' &&
    typeof e['palier'] === 'string' &&
    typeof e['semaines'] === 'number' &&
    typeof e['disquesCertifies'] === 'number' &&
    typeof e['legendes'] === 'number' &&
    Array.isArray(e['bonus']) &&
    typeof e['clotureLe'] === 'string'
  );
};

/** Les règnes du Panthéon, du plus prestigieux au moins prestigieux. */
export function lirePantheon(): EntreePantheon[] {
  try {
    const brut = window.localStorage.getItem(CLE);
    const donnees: unknown = brut === null ? [] : JSON.parse(brut);
    return Array.isArray(donnees) ? donnees.filter(estEntree) : [];
  } catch {
    return [];
  }
}

/** Range un règne dans le Panthéon (une même clôture n'y entre qu'une fois) ; renvoie le Panthéon à jour. */
export function enregistrerRegne(bilan: BilanRegne, date = new Date()): EntreePantheon[] {
  const entree: EntreePantheon = {
    label: bilan.label,
    generation: bilan.generation,
    valorisation: bilan.valorisation,
    palier: bilan.palier,
    semaines: bilan.semaines,
    disquesCertifies: bilan.disquesCertifies,
    legendes: bilan.legendes,
    bonus: bilan.bonus.filter((b) => b.atteint).map((b) => b.id),
    clotureLe: date.toISOString(),
  };
  const existant = lirePantheon();
  const doublon = existant.some(
    (e) =>
      e.label === entree.label &&
      e.generation === entree.generation &&
      e.semaines === entree.semaines &&
      e.valorisation === entree.valorisation,
  );
  if (doublon) return existant;
  const liste = [...existant, entree]
    .sort((a, b) => b.valorisation - a.valorisation)
    .slice(0, PANTHEON_MAX);
  try {
    window.localStorage.setItem(CLE, JSON.stringify(liste));
  } catch {
    /* stockage indisponible : le règne ne sera pas mémorisé */
  }
  return liste;
}
