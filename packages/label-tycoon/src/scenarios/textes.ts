import { fr } from '../strings/fr';
import type { Condition } from './types';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

const CERTIFICATIONS = {
  or: 'disque d’or',
  platine: 'disque de platine',
  diamant: 'disque de diamant',
};

/** Phrase d'objectif lisible pour une condition. */
export function texteCondition(c: Condition): string {
  switch (c.type) {
    case 'tresorerie':
      return `Avoir ${eur(c.min)} en caisse`;
    case 'valorisation':
      return `Atteindre une valorisation de ${eur(c.min)}`;
    case 'palier':
      return `Atteindre le palier ${fr.tiers[c.palier]}`;
    case 'certification':
      return `Décrocher un ${CERTIFICATIONS[c.niveau]}`;
    case 'classement':
      return c.rang === 1
        ? 'Placer une sortie en tête du classement'
        : `Placer une sortie dans le Top ${c.rang}`;
    case 'credibilite':
      return `Atteindre ${c.min} de crédibilité en ${(fr.genres as Record<string, string>)[c.genre] ?? c.genre}`;
    case 'sorties':
      return `Publier ${c.min} sortie(s)`;
    case 'signatures':
      return `Signer ${c.min} artiste(s)`;
    case 'retours':
      return `Réussir ${c.min} retour(s) en grâce`;
    case 'equipe':
      return `Employer ${c.min} membre(s) d’équipe`;
    case 'survie':
      return 'Tenir jusqu’au bout sans faire faillite';
  }
}
