export type EmailError = 'vide' | 'invalide';

/**
 * Validation volontairement simple : une partie locale, un @, un domaine avec un point.
 * La seule vraie vérification d'une adresse, c'est l'e-mail de confirmation (côté serveur, plus tard).
 */
export function validateEmail(value: string): EmailError | null {
  const email = value.trim();
  if (email === '') return 'vide';
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email)) return 'invalide';
  return null;
}

export const EMAIL_MESSAGES: Record<EmailError, string> = {
  vide: 'Indiquez une adresse e-mail pour recevoir l’édition.',
  invalide: 'Cette adresse ne ressemble pas à une adresse e-mail : vérifiez le @ et le domaine.',
};
