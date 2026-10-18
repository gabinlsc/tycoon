import { describe, expect, it } from 'vitest';
import {
  BOT_STRATEGIES,
  type GameResult,
  analyser,
  quantile,
  renderReport,
  simulate,
  simulateRange,
  summarize,
} from './index';

const options = { games: 2, weeks: 60, seedPrefix: 'test' };

describe('simulation d’équilibrage', () => {
  const results = simulate(options);

  it('joue chaque stratégie sur les mêmes graines', () => {
    expect(results).toHaveLength(BOT_STRATEGIES.length * options.games);
    expect(new Set(results.map((r) => r.graine)).size).toBe(options.games);
  });

  it('se répartit par tranches de graines : les morceaux recollés valent la simulation entière', () => {
    const recollee = [...simulateRange(options, 0, 1), ...simulateRange(options, 1, 2)];
    const triee = (r: typeof results) =>
      [...r].sort(
        (a, b) => a.graine.localeCompare(b.graine) || a.strategie.localeCompare(b.strategie),
      );
    expect(triee(recollee)).toEqual(triee(results));
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
  /** Trois graines, un gagnant différent à chacune : aucune stratégie ne domine. */
  const equilibre = (): GameResult[] => {
    const genres = {
      prudent: 'rap',
      agressif: 'afro',
      specialiste: 'trap',
      aleatoire: 'rnb',
    } as const;
    const gagnants = ['agressif', 'prudent', 'specialiste'] as const;
    return gagnants.flatMap((gagnant, i) =>
      (['prudent', 'agressif', 'specialiste', 'aleatoire'] as const).map((strategie) =>
        partie({
          graine: `g${i}`,
          strategie,
          genreDominant: genres[strategie],
          valorisation10ans: strategie === 'aleatoire' ? 100 : strategie === gagnant ? 1200 : 1000,
          premierOr: strategie === 'aleatoire' ? null : 130,
        }),
      ),
    );
  };
  it('valide un jeu équilibré', () => {
    const a = analyser(equilibre());
    expect(a.gagnante).not.toBe('aleatoire');
    expect(a.verdicts.every((v) => v.atteinte)).toBe(true);
  });
  it('détecte une stratégie dominante : elle gagne presque toutes les graines', () => {
    const graines = ['a', 'b', 'c', 'd', 'e'];
    const r = graines.flatMap((graine) => [
      partie({ graine, strategie: 'prudent', valorisation10ans: 1000 }),
      partie({ graine, strategie: 'agressif', valorisation10ans: 5000 }),
      partie({ graine, strategie: 'specialiste', valorisation10ans: 900 }),
      partie({ graine, strategie: 'aleatoire', valorisation10ans: 10 }),
    ]);
    const a = analyser(r);
    expect(a.victoires.find((v) => v.strategie === 'agressif')?.part).toBe(1);
    expect(a.verdicts[2]?.atteinte).toBe(false);
  });
  it('accepte de gros écarts de médiane quand les victoires se partagent', () => {
    const gagnants = [
      'prudent',
      'agressif',
      'specialiste',
      'prudent',
      'agressif',
      'specialiste',
    ] as const;
    const r = gagnants.flatMap((g, i) =>
      (['prudent', 'agressif', 'specialiste'] as const).map((strategie) =>
        partie({ graine: `s${i}`, strategie, valorisation10ans: strategie === g ? 10_000 : 100 }),
      ),
    );
    expect(analyser(r).verdicts[2]?.atteinte).toBe(true);
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
  it('regroupe les sous-genres fictifs sous une seule ligne', () => {
    const r = [
      partie({ graine: 'a', genreDominant: 'sg-12' }),
      partie({ graine: 'b', genreDominant: 'sg-9876' }),
      partie({ graine: 'c', genreDominant: 'rap' }),
    ];
    const genres = analyser(r).genres;
    expect(genres.find((g) => g.genre === 'sous-genres émergents')?.parties).toBe(2);
    expect(genres.some((g) => g.genre.startsWith('sg-'))).toBe(false);
  });
  it('ignore le bot aléatoire pour les faillites de la première année', () => {
    const r = [
      ...equilibre().filter((g) => g.strategie !== 'aleatoire'),
      partie({ strategie: 'aleatoire', faillite: 5, genreDominant: 'latino' }),
    ];
    expect(analyser(r).verdicts[0]?.atteinte).toBe(true);
  });
});
