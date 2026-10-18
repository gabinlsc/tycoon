import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  INTEL,
  analystLevel,
  expectedPopularity,
  forecastError,
  labelGame,
  newGame,
} from './index';

const rich = (seed = 'veille') => {
  const s = newGame(seed);
  s.engine.data.label.tresorerie = money.euros(100_000);
  return s;
};

describe('erreur de prévision', () => {
  it("diminue avec la qualité de l'analyste", () => {
    expect(forecastError(0)).toBe(INTEL.baseError);
    expect(forecastError(100)).toBeLessThan(forecastError(50));
    expect(forecastError(50)).toBeLessThan(forecastError(0));
  });
  it("l'analyste est le meilleur dénicheur employé", () => {
    const d = rich().engine.data;
    expect(analystLevel(d)).toBe(0);
    d.denicheurs.push(
      { id: 1, nom: 'a', niveau: 30, genreFetiche: 'rap' },
      { id: 2, nom: 'b', niveau: 70, genreFetiche: 'rap' },
    );
    expect(analystLevel(d)).toBe(70);
  });
});

describe('étude de marché', () => {
  it('coûte de l’argent et enregistre une prévision bornée avec sa marge', () => {
    const s = rich();
    const before = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, { type: 'etude-marche', genre: 'rap', horizon: 13 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.session.engine.data;
    expect(d.label.tresorerie).toBe(before - cents(INTEL.studyCost));
    const p = d.previsions[0];
    expect(p?.pour).toBe(13);
    expect(p?.valeur).toBeGreaterThanOrEqual(0);
    expect(p?.valeur).toBeLessThanOrEqual(100);
    expect(p?.marge).toBe(Math.round(2 * forecastError(0)));
  });

  it('refuse un genre ou un horizon inconnu, et un budget insuffisant', () => {
    const s = rich();
    expect(labelGame.dispatch(s, { type: 'etude-marche', genre: 'zzz', horizon: 4 })).toMatchObject(
      { ok: false, rejection: { code: 'genre-inconnu' } },
    );
    expect(labelGame.dispatch(s, { type: 'etude-marche', genre: 'rap', horizon: 5 })).toMatchObject(
      { ok: false, rejection: { code: 'horizon-invalide' } },
    );
    s.engine.data.label.tresorerie = cents(100);
    expect(labelGame.dispatch(s, { type: 'etude-marche', genre: 'rap', horizon: 4 })).toMatchObject(
      { ok: false, rejection: { code: 'fonds-insuffisants' } },
    );
  });

  it("un meilleur analyste donne des prévisions plus proches de l'attendu, en moyenne", () => {
    const meanError = (level: number) => {
      let sum = 0;
      for (let i = 0; i < 300; i += 1) {
        const s = rich(`e${i}`);
        s.engine.data.denicheurs.push({ id: 1, nom: 'a', niveau: level, genreFetiche: 'rap' });
        const r = labelGame.dispatch(s, { type: 'etude-marche', genre: 'rap', horizon: 26 });
        if (!r.ok) throw new Error('étude attendue');
        const p = r.session.engine.data.previsions[0];
        sum += Math.abs((p?.valeur ?? 0) - expectedPopularity(r.session.engine.data, 'rap', 26));
      }
      return sum / 300;
    };
    expect(meanError(100)).toBeLessThan(meanError(0));
    void Rng;
  });
});
