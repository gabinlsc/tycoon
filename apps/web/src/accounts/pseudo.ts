export const PSEUDO_MIN = 3;
export const PSEUDO_MAX = 16;

export type PseudoError = 'vide' | 'court' | 'long' | 'caracteres' | 'reserve';

/** Pseudos interdits : ils imiteraient l'équipe ou le système. */
const RESERVED = new Set([
  'admin',
  'administrateur',
  'moderateur',
  'modo',
  'support',
  'staff',
  'tycoon',
  'tycoonhub',
  'hub',
  'system',
  'systeme',
  'anonyme',
  'anonymous',
  'invite',
  'guest',
  'null',
  'undefined',
]);

/**
 * Clé d'unicité d'un pseudo : sans accents, sans casse, sans tirets ni underscores.
 * « Léo_42 », « leo42 » et « LEO-42 » désignent donc le même pseudo : on évite les sosies.
 */
export function pseudoKey(pseudo: string): string {
  return pseudo.trim().normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[_-]/g, '');
}

export function validatePseudo(value: string): PseudoError | null {
  const pseudo = value.trim();
  if (pseudo === '') return 'vide';
  const length = [...pseudo].length;
  if (length < PSEUDO_MIN) return 'court';
  if (length > PSEUDO_MAX) return 'long';
  if (!/^[\p{L}\p{N}_-]+$/u.test(pseudo)) return 'caracteres';
  if (RESERVED.has(pseudoKey(pseudo))) return 'reserve';
  return null;
}

export const PSEUDO_MESSAGES: Record<PseudoError, string> = {
  vide: 'Choisis un pseudo.',
  court: `Un pseudo doit faire au moins ${PSEUDO_MIN} caractères.`,
  long: `Un pseudo ne peut pas dépasser ${PSEUDO_MAX} caractères.`,
  caracteres: 'Lettres, chiffres, tiret et underscore uniquement, sans espace.',
  reserve: 'Ce pseudo est réservé, choisis-en un autre.',
};
