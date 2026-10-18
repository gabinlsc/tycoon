import { describe, expect, it } from 'vitest';
import { runBot } from './bots';
import { type LabelSession, labelGame, newGame } from './index';

/** Plus petite durée (ms) sur plusieurs essais : un poste chargé ne doit pas faire échouer un budget. */
function meilleurTemps(essais: number, travail: () => void): number {
  let meilleur = Infinity;
  for (let i = 0; i < essais; i += 1) {
    const debut = performance.now();
    travail();
    meilleur = Math.min(meilleur, performance.now() - debut);
  }
  return meilleur;
}

describe('budgets de performance du moteur', () => {
  // Un label de cinq ans : plusieurs centaines d'artistes dans le monde, des dizaines de projets.
  const partie: LabelSession = runBot('agressif', 'perf-budget', 260).session;

  it('52 semaines se simulent en moins de 200 ms sur un label en pleine activité', () => {
    labelGame.advance(partie, 52); // échauffement
    const ms = meilleurTemps(5, () => labelGame.advance(partie, 52));
    expect(ms).toBeLessThan(200);
  });

  it('dix ans se simulent en moins de 3 s, même en partant d’un label déjà installé', () => {
    const ms = meilleurTemps(2, () => labelGame.advance(partie, 520));
    expect(ms).toBeLessThan(3000);
  });

  it('une partie neuve avance de dix ans bien plus vite encore', () => {
    const ms = meilleurTemps(2, () => labelGame.advance(newGame('perf-neuve'), 520));
    expect(ms).toBeLessThan(1000);
  });

  it('copier une partie (chaque action en fait une) reste négligeable', () => {
    const ms = meilleurTemps(5, () => {
      JSON.stringify(partie);
      structuredClone(partie);
    });
    expect(ms).toBeLessThan(100);
  });
});
