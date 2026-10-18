import type { GameConfig, GameMode, VuePartie } from '@tycoon/label-tycoon';

/** Réglages d'une partie en cours, tels que le moteur les attend pour relancer la même carrière. */
export function configDepuisPartie(p: VuePartie): GameConfig {
  return {
    mode: p.mode as GameMode,
    difficulty: {
      startingCash: p.difficulte.capitalDepart,
      rivalAggression: p.difficulte.agressiviteRivaux,
      marketVolatility: p.difficulte.volatiliteMarche,
      rivalCashBonus: p.difficulte.bonusTresorerieRivaux,
    },
    ...(p.scenarioId !== null ? { scenarioId: p.scenarioId } : {}),
    ...(p.bacASable ? { sandbox: true } : {}),
    ...(!p.bacASable && !p.faillitePossible ? { bankruptcyOff: true } : {}),
    ...(p.frequenceEvenements !== 1 ? { eventRate: p.frequenceEvenements } : {}),
  };
}

export const NOMS_MODES: Readonly<Record<string, string>> = {
  carriere: 'Carrière',
  scenario: 'Scénario',
  'bac-a-sable': 'Bac à sable',
  defi: 'Défi du jour',
  tutoriel: 'Tutoriel',
};
