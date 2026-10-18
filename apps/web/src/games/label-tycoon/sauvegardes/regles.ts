import { type Emplacement, type SauvegardeLabel } from './stockage';

/** Période de la sauvegarde automatique, en semaines de jeu. */
export const PERIODE_AUTO = 4;

/** Vrai quand la semaine courante ouvre une nouvelle sauvegarde automatique. */
export const sauvegardeAutoDue = (semaine: number, derniere: number): boolean =>
  semaine > 0 && semaine % PERIODE_AUTO === 0 && semaine !== derniere;

export const LIBELLES_EMPLACEMENT: Readonly<Record<Emplacement, string>> = {
  auto: 'Sauvegarde automatique',
  'manuel-1': 'Emplacement 1',
  'manuel-2': 'Emplacement 2',
  'manuel-3': 'Emplacement 3',
};

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Métadonnées remontées dans la page de compte : le jeu n'y expose que de quoi retrouver sa partie. */
export interface MetadonneesCompte {
  version: 1;
  resume: string;
  emplacements: number;
}

/**
 * Résumé des sauvegardes d'un compte : la partie la plus récente et le nombre d'emplacements
 * utilisés. `null` quand il n'y en a aucune.
 */
export function metadonneesCompte(
  contenu: Partial<Record<Emplacement, SauvegardeLabel>>,
): MetadonneesCompte | null {
  const parties = Object.values(contenu);
  if (parties.length === 0) return null;
  const recente = [...parties].sort((a, b) => b.enregistreLe.localeCompare(a.enregistreLe))[0];
  if (!recente) return null;
  return {
    version: 1,
    resume: `${resumeSauvegarde(recente)} (${parties.length} emplacement${parties.length > 1 ? 's' : ''})`,
    emplacements: parties.length,
  };
}

/** Ligne de résumé d'une sauvegarde : nom du label, semaine, palier et trésorerie. */
export const resumeSauvegarde = (s: SauvegardeLabel): string =>
  `${s.label} · semaine ${s.semaine}${s.palier ? ` · ${s.palier}` : ''} · ${eur(s.tresorerie)}`;
