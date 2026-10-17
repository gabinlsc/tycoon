/** Identité du portail : seul endroit où le nom et le domaine sont écrits. */
export const SITE = {
  name: 'Le Tycoon',
  tagline: "Le quotidien de l'économie imaginaire",
  /** Domaine non choisi : à remplacer ici uniquement. */
  domain: 'tycoon.example',
  price: '0,00 € — gratuit, sans compte',
  locale: 'fr-FR',
  /** Date de lancement fictive, base du numéro d'édition. */
  editionOrigin: '2026-01-05',
} as const;

export const SITE_URL = `https://${SITE.domain}`;
