import { BOT_STRATEGIES, type BotStrategy, runBot } from './bots';
import { labelScore } from './valuation';

export interface SimOptions {
  /** Parties par stratégie. */
  games: number;
  /** Horizon en semaines. */
  weeks: number;
  /** Préfixe des graines (les parties sont `prefixe-0`, `prefixe-1`…). */
  seedPrefix: string;
}

export interface GameResult {
  strategie: BotStrategy;
  graine: string;
  faillite: number | null;
  premierOr: number | null;
  valorisation5ans: number;
  valorisationFinale: number;
  genreDominant: string | null;
}

export interface StrategySummary {
  strategie: BotStrategy;
  parties: number;
  tauxFaillite: number;
  medianPremierOr: number | null;
  medianValorisation5ans: number;
  medianValorisationFinale: number;
}

const median = (values: readonly number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? 0)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
};

export const FIVE_YEARS = 260;

/** Joue une partie d'un bot et en extrait les indicateurs d'équilibrage. */
export function simulateGame(strategie: BotStrategy, graine: string, weeks: number): GameResult {
  const horizon5 = Math.min(weeks, FIVE_YEARS);
  const mid = runBot(strategie, graine, horizon5);
  const run = weeks > horizon5 ? runBot(strategie, graine, weeks) : mid;
  const d = run.session.engine.data;
  const roster = d.artistes.filter((a) => a.employeur === 'joueur');
  const byGenre = new Map<string, number>();
  for (const a of roster) byGenre.set(a.genre, (byGenre.get(a.genre) ?? 0) + a.fanbase);
  const dominant = [...byGenre.entries()].sort(
    (x, y) => y[1] - x[1] || x[0].localeCompare(y[0]),
  )[0];
  return {
    strategie,
    graine,
    faillite: run.faillite,
    premierOr: run.premierOr,
    valorisation5ans: labelScore(mid.session.engine.data, horizon5),
    valorisationFinale: labelScore(d, weeks),
    genreDominant: dominant?.[0] ?? null,
  };
}

/** Joue toutes les parties : chaque stratégie sur les mêmes graines. */
export function simulate(options: SimOptions): GameResult[] {
  const results: GameResult[] = [];
  for (const strategie of BOT_STRATEGIES)
    for (let i = 0; i < options.games; i += 1)
      results.push(simulateGame(strategie, `${options.seedPrefix}-${i}`, options.weeks));
  return results;
}

export function summarize(results: readonly GameResult[]): StrategySummary[] {
  return BOT_STRATEGIES.map((strategie) => {
    const games = results.filter((r) => r.strategie === strategie);
    const golds = games.map((g) => g.premierOr).filter((x): x is number => x !== null);
    return {
      strategie,
      parties: games.length,
      tauxFaillite:
        games.length === 0 ? 0 : games.filter((g) => g.faillite !== null).length / games.length,
      medianPremierOr: golds.length === 0 ? null : median(golds),
      medianValorisation5ans: median(games.map((g) => g.valorisation5ans)),
      medianValorisationFinale: median(games.map((g) => g.valorisationFinale)),
    };
  });
}

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Rapport Markdown : faillites, premier disque d'or, valorisation, genres dominants, stratégie gagnante. */
export function renderReport(results: readonly GameResult[], options: SimOptions): string {
  const summary = summarize(results);
  const winner = [...summary].sort(
    (a, b) => b.medianValorisationFinale - a.medianValorisationFinale,
  )[0];
  const genres = new Map<string, number>();
  for (const r of results)
    if (r.genreDominant) genres.set(r.genreDominant, (genres.get(r.genreDominant) ?? 0) + 1);
  const lines = [
    '# Rapport d’équilibrage',
    '',
    `${options.games} parties par stratégie, ${options.weeks} semaines, graines « ${options.seedPrefix}-n ».`,
    '',
    '| Stratégie | Faillites | 1er disque d’or (médiane) | Valorisation à 5 ans | Valorisation finale |',
    '| --- | --- | --- | --- | --- |',
    ...summary.map(
      (s) =>
        `| ${s.strategie} | ${(s.tauxFaillite * 100).toFixed(0)} % | ${s.medianPremierOr === null ? 'jamais' : `semaine ${s.medianPremierOr}`} | ${eur(s.medianValorisation5ans)} | ${eur(s.medianValorisationFinale)} |`,
    ),
    '',
    '## Genres dominants',
    '',
    ...[...genres.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([g, n]) => `- ${g} : ${n} parties`),
    '',
    `## Stratégie gagnante : ${winner?.strategie ?? 'aucune'}`,
    '',
    'Valeurs de départ : ce rapport sert à repérer les déséquilibres, pas à fixer les réglages.',
    '',
  ];
  return lines.join('\n');
}
