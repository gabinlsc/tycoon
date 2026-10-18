import { describe, expect, it } from 'vitest';
import {
  BOT_STRATEGIES,
  CIBLES,
  type GameResult,
  analyser,
  quantile,
  renderReport,
  simulate,
  summarize,
} from './index';

const options = { games: 2, weeks: 60, seedPrefix: 'test' };

describe('simulation d’équilibrage', () => {
  const results = simulate(options);

  it('joue chaque stratégie sur les mêmes graines', () => {
    expect(results).toHaveLength(BOT_STRATEGIES.length * options.games);
    expect(new Set(results.map((r) => r.graine)).size).toBe(options.games);
  });

  it('est déterministe', () => {
    expect(simulate(options)).toEqual(results);
  });

  it('résume par stratégie avec des taux valides', () => {
    for (const s of summarize(results)) {
      expect(s.parties).toBe(options.games);
      for (const taux of [s.tauxFaillite, s.tauxFaillitePremiereAnnee, s.tauxPremierOr]) {
        expect(taux).toBeGreaterThanOrEqual(0);
        expect(taux).toBeLessThanOrEqual(1);
      }
      expect(s.tauxFaillitePremiereAnnee).toBeLessThanOrEqual(s.tauxFaillite);
    }
  });

  it('produit un rapport Markdown complet, de la faillite aux cibles', () => {
    const report = renderReport(results, options);
    for (const strategy of BOT_STRATEGIES) expect(report).toContain(`| ${strategy} |`);
    for (const titre of [
      '## Faillites',
      '## Premier disque d’or',
      '## Valorisation du label',
      '## Genres dominants',
      '## Stratégie gagnante',
      '## Cibles',
    ])
      expect(report).toContain(titre);
    expect(report).toContain('À 5 ans');
    expect(report).toContain('À 10 ans');
  });
});

describe('quantiles', () => {
  it('interpole entre les valeurs', () => {
    expect(quantile([], 0.5)).toBe(0);
    expect(quantile([10], 0.5)).toBe(10);
    expect(quantile([0, 10, 20, 30], 0.5)).toBe(15);
    expect(quantile([0, 10, 20, 30], 0.25)).toBeCloseTo(7.5);
  });
});

const partie = (extra: Partial<GameResult>): GameResult => ({
  strategie: 'prudent',
  graine: 'g',
  faillite: null,
  premierOr: 130,
  valorisation1an: 1,
  valorisation5ans: 1,
  valorisation10ans: 1000,
  valorisationFinale: 1000,
  genreDominant: 'rap',
  palier: 1,
  certifications: 1,
  ...extra,
});

describe('analyse des cibles', () => {
  const equilibre = (): GameResult[] => [
    partie({ strategie: 'prudent', genreDominant: 'rap' }),
    partie({ strategie: 'agressif', valorisation10ans: 1200, genreDominant: 'afro' }),
    partie({ strategie: 'specialiste', valorisation10ans: 1100, genreDominant: 'trap' }),
    partie({
      strategie: 'aleatoire',
      valorisation10ans: 100,
      premierOr: null,
      genreDominant: 'rnb',
    }),
  ];
  it('valide un jeu équilibré', () => {
    const a = analyser(equilibre());
    expect(a.gagnante).toBe('agressif');
    expect(a.verdicts.every((v) => v.atteinte)).toBe(true);
  });
  it('détecte une stratégie dominante', () => {
    const r = equilibre().map((g) =>
      g.strategie === 'agressif' ? { ...g, valorisation10ans: 1000 * CIBLES.dominanceMax * 2 } : g,
    );
    const a = analyser(r);
    expect(a.verdicts[2]?.atteinte).toBe(false);
  });
  it('détecte des faillites la première année, un disque d’or trop tardif et un genre dominant', () => {
    const r = [
      partie({ faillite: 20 }),
      partie({ strategie: 'agressif', premierOr: 400, genreDominant: 'rap' }),
      partie({ strategie: 'specialiste', premierOr: 400, genreDominant: 'rap' }),
      partie({ strategie: 'aleatoire', premierOr: null, genreDominant: 'rap' }),
    ];
    const a = analyser(r);
    expect(a.verdicts[0]?.atteinte).toBe(false);
    expect(a.verdicts[1]?.atteinte).toBe(false);
    expect(a.verdicts[3]?.atteinte).toBe(false);
  });
  it('ignore le bot aléatoire pour les faillites de la première année', () => {
    const r = [
      ...equilibre().filter((g) => g.strategie !== 'aleatoire'),
      partie({ strategie: 'aleatoire', faillite: 5, genreDominant: 'latino' }),
    ];
    expect(analyser(r).verdicts[0]?.atteinte).toBe(true);
  });
});
