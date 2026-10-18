import { money } from '@tycoon/core';
import type { ScenarioDef } from './types';

/**
 * Catalogue des scénarios. Chaque scénario est une donnée : conditions de départ, objectifs et
 * limite de temps. Les définitions vivent ici ; la partie ne garde que l'identifiant.
 */
export const SCENARIOS: Readonly<Record<string, ScenarioDef>> = {
  'premier-disque-d-or': {
    id: 'premier-disque-d-or',
    titre: 'Premier disque d’or',
    description:
      'Deux ans, 5 000 € en caisse : décroche ton premier disque d’or avant la fin du délai.',
    graine: 'scenario-premier-or',
    limiteSemaines: 104,
    objectifs: [{ type: 'certification', niveau: 'or' }],
    depart(state) {
      state.label.tresorerie = money.euros(5000);
    },
  },
};
