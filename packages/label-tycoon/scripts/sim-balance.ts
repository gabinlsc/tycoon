import { writeFileSync } from 'node:fs';
import { renderReport, simulate } from '../src/sim-balance';

/** Usage : pnpm sim:balance [--games 20] [--weeks 520] [--seed equilibre] [--out rapport.md] [--json resultats.json] */
function arg(name: string, fallback: string): string {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback;
}

const options = {
  games: Number(arg('games', '20')),
  weeks: Number(arg('weeks', '520')),
  seedPrefix: arg('seed', 'equilibre'),
};
const results = simulate(options);
const report = renderReport(results, options);
const out = arg('out', '');
if (out) writeFileSync(out, report);
const json = arg('json', '');
if (json) writeFileSync(json, JSON.stringify({ options, resultats: results }, null, 2));
console.log(report);
