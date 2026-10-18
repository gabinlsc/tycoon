import { cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { EVENT_RATE_BOUNDS, defaultConfig, labelGame, newGame, validateConfig } from './index';

const bacASable = (extra: Partial<ReturnType<typeof defaultConfig>> = {}) => ({
  ...defaultConfig('normal', 'bac-a-sable'),
  ...extra,
});

describe('bac à sable', () => {
  it('part d’une fortune quasi illimitée et ne connaît pas la faillite', () => {
    const s = newGame('sable', bacASable({ sandbox: true }));
    expect(s.engine.data.label.tresorerie).toBeGreaterThan(money.euros(100_000_000));
    s.engine.data.label.tresorerie = cents(-1_000_000);
    expect(labelGame.advance(s, 12).session.engine.data.faillite.semaines).toBe(0);
  });

  it('désactive la faillite sans argent illimité quand on le demande', () => {
    const s = newGame('sans-faillite', bacASable({ bankruptcyOff: true }));
    s.engine.data.label.tresorerie = cents(-1_000_000);
    const apres = labelGame.advance(s, 12).session.engine.data;
    expect(apres.faillite.semaines).toBe(0);
    expect(apres.faillite.terminee).toBe(false);
  });

  it('garde la faillite par défaut', () => {
    const s = newGame('faillite', bacASable());
    s.engine.data.label.tresorerie = cents(-1_000_000);
    expect(labelGame.advance(s, 3).session.engine.data.faillite.semaines).toBe(3);
  });

  it('règle la fréquence des événements : aucun à 0, davantage à 3', () => {
    const tirees = (eventRate: number) => {
      let session = newGame('evenements', bacASable({ sandbox: true, eventRate }));
      let n = 0;
      for (let i = 0; i < 60; i += 1) {
        const r = labelGame.advance(session, 1);
        session = r.session;
        n += r.signals.filter((x) => x.kind === 'evenement').length;
      }
      return n;
    };
    expect(tirees(0)).toBe(0);
    expect(tirees(3)).toBeGreaterThan(tirees(1));
  });

  it('refuse une fréquence hors bornes et la copie dans l’état', () => {
    expect(validateConfig(bacASable({ eventRate: EVENT_RATE_BOUNDS.max + 1 }))).toMatch(
      /Fréquence des événements/,
    );
    expect(validateConfig(bacASable({ eventRate: 2 }))).toBeNull();
    expect(newGame('copie', bacASable({ eventRate: 2 })).engine.data.config.eventRate).toBe(2);
  });
});
