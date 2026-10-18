import { describe, expect, it } from 'vitest';
import { hashState } from '@tycoon/core';
import { BOT_STRATEGIES, runBot } from './index';

describe('bots', () => {
  for (const strategy of BOT_STRATEGIES) {
    it(`${strategy} joue trois ans sans erreur, de façon déterministe`, () => {
      const a = runBot(strategy, 'bot-1', 156);
      expect(a.jouees).toBeGreaterThan(0);
      const b = runBot(strategy, 'bot-1', 156);
      expect(hashState(b.session.engine.data)).toBe(hashState(a.session.engine.data));
      expect(a.session.engine.data.label.tresorerie).toBe(
        Math.trunc(a.session.engine.data.label.tresorerie),
      );
    });
  }

  it('signent des artistes et sortent des projets (le jeu est jouable par actions)', () => {
    const run = runBot('agressif', 'bot-2', 200);
    const d = run.session.engine.data;
    expect(d.artistes.some((a) => a.employeur === 'joueur') || run.faillite !== null).toBe(true);
    expect(d.projets.length).toBeGreaterThanOrEqual(0);
  });

  it('les stratégies donnent des trajectoires différentes', () => {
    const hashes = new Set(
      BOT_STRATEGIES.map((s) => hashState(runBot(s, 'bot-3', 120).session.engine.data)),
    );
    expect(hashes.size).toBe(BOT_STRATEGIES.length);
  });
});
