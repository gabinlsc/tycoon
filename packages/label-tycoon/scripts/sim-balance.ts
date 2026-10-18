import { readFileSync, writeFileSync } from 'node:fs';
import { type GameResult, type SimOptions, renderReport, simulateRange } from '../src/sim-balance';

/**
 * Usage :
 *   pnpm sim:balance [--games 20] [--weeks 520] [--seed equilibre] [--out rapport.md] [--json resultats.json]
 *
 * Pour répartir sur plusieurs processus (une partie de 520 semaines prend quelques secondes) :
 *   pnpm sim:balance --games 24 --from 0 --to 6  --json a.json   (et de même pour 6-12, 12-18, 18-24)
 *   pnpm sim:balance --games 24 --merge a.json,b.json,c.json,d.json --out rapport.md
 */
function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const options: SimOptions = {
  games: Number(arg('games', '20')),
  weeks: Number(arg('weeks', '520')),
  seedPrefix: arg('seed', 'equilibre'),
};
const merge = arg('merge', '');
const results: GameResult[] = merge
  ? merge
      .split(',')
      .flatMap(
        (f) => (JSON.parse(readFileSync(f, 'utf8')) as { resultats: GameResult[] }).resultats,
      )
  : simulateRange(options, Number(arg('from', '0')), Number(arg('to', String(options.games))));

const json = arg('json', '');
if (json) writeFileSync(json, JSON.stringify({ options, resultats: results }, null, 2));
const partial = arg('from', '') !== '' || arg('to', '') !== '';
if (!partial) {
  const report = renderReport(results, options);
  const out = arg('out', '');
  if (out) writeFileSync(out, report);
  console.log(report);
}
