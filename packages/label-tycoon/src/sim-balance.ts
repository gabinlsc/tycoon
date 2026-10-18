import { BOT_STRATEGIES, type BotStrategy, runBot } from './bots';
import { TIERS } from './balance';
import type { LabelState } from './state';
import { tierRank } from './tiers';
import { labelScore } from './valuation';

export interface SimOptions {
  /** Parties par stratégie. */
  games: number;
  /** Horizon en semaines. */
  weeks: number;
  /** Préfixe des graines (les parties sont `prefixe-0`, `prefixe-1`…). */
  seedPrefix: string;
}

export const ONE_YEAR = 52;
export const FIVE_YEARS = 260;
export const TEN_YEARS = 520;

export interface GameResult {
  strategie: BotStrategy;
  graine: string;
  /** Semaine de la faillite, ou `null`. */
  faillite: number | null;
  /** Première semaine de disque d'or, ou `null`. */
  premierOr: number | null;
  /** Valorisation (centimes) à 1, 5 et 10 ans ; 0 si la partie s'est arrêtée avant, par faillite. */
  valorisation1an: number;
  valorisation5ans: number;
  valorisation10ans: number;
  valorisationFinale: number;
  genreDominant: string | null;
  /** Rang du palier atteint (0 = Home-studio) et nombre de certifications à la fin. */
  palier: number;
  certifications: number;
}

export interface StrategySummary {
  strategie: BotStrategy;
  parties: number;
  tauxFaillite: number;
  /** Part des parties en faillite avant la fin de la première année. */
  tauxFaillitePremiereAnnee: number;
  medianFaillite: number | null;
  /** Part des parties qui décrochent un disque d'or, et médiane de la semaine. */
  tauxPremierOr: number;
  medianPremierOr: number | null;
  medianValorisation5ans: number;
  medianValorisation10ans: number;
  quartilesValorisation10ans: [number, number];
  medianValorisationFinale: number;
  palierMedian: number;
}

export const quantile = (values: readonly number[], q: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const bas = Math.floor(position);
  const haut = Math.ceil(position);
  const a = sorted[bas] ?? 0;
  const b = sorted[haut] ?? 0;
  return a + (b - a) * (position - bas);
};
const median = (values: readonly number[]): number => quantile(values, 0.5);

/** Joue une partie d'un bot en une seule passe et relève les indicateurs d'équilibrage. */
export function simulateGame(strategie: BotStrategy, graine: string, weeks: number): GameResult {
  const marques = new Map<number, number>();
  let dernier: LabelState | null = null;
  const run = runBot(strategie, graine, weeks, undefined, (semaines, state) => {
    dernier = state as LabelState;
    if (semaines === ONE_YEAR || semaines === FIVE_YEARS || semaines === TEN_YEARS)
      marques.set(semaines, Math.max(0, labelScore(state as LabelState, semaines)));
  });
  const d = run.session.engine.data;
  const roster = d.artistes.filter((a) => a.employeur === 'joueur');
  const byGenre = new Map<string, number>();
  for (const a of roster) byGenre.set(a.genre, (byGenre.get(a.genre) ?? 0) + a.fanbase);
  const dominant = [...byGenre.entries()].sort(
    (x, y) => y[1] - x[1] || x[0].localeCompare(y[0]),
  )[0];
  const fin: LabelState = dernier ?? d;
  return {
    strategie,
    graine,
    faillite: run.faillite,
    premierOr: run.premierOr,
    valorisation1an: marques.get(ONE_YEAR) ?? 0,
    valorisation5ans: marques.get(FIVE_YEARS) ?? 0,
    valorisation10ans: marques.get(TEN_YEARS) ?? 0,
    valorisationFinale: Math.max(0, labelScore(d, run.session.engine.tick)),
    genreDominant: dominant?.[0] ?? null,
    palier: tierRank(fin.label.tier),
    certifications: fin.projets.filter((p) => p.certification !== null).length,
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
    const n = games.length;
    const part = (pred: (g: GameResult) => boolean): number =>
      n === 0 ? 0 : games.filter(pred).length / n;
    const golds = games.map((g) => g.premierOr).filter((x): x is number => x !== null);
    const faillites = games.map((g) => g.faillite).filter((x): x is number => x !== null);
    const v10 = games.map((g) => g.valorisation10ans);
    return {
      strategie,
      parties: n,
      tauxFaillite: part((g) => g.faillite !== null),
      tauxFaillitePremiereAnnee: part((g) => g.faillite !== null && g.faillite < ONE_YEAR),
      medianFaillite: faillites.length === 0 ? null : median(faillites),
      tauxPremierOr: part((g) => g.premierOr !== null),
      medianPremierOr: golds.length === 0 ? null : median(golds),
      medianValorisation5ans: median(games.map((g) => g.valorisation5ans)),
      medianValorisation10ans: median(v10),
      quartilesValorisation10ans: [quantile(v10, 0.25), quantile(v10, 0.75)],
      medianValorisationFinale: median(games.map((g) => g.valorisationFinale)),
      palierMedian: median(games.map((g) => g.palier)),
    };
  });
}

/**
 * Cibles de l'équilibrage (GDD, section 12 et roadmap, phase 9). Elles portent sur les stratégies
 * « sérieuses » : le bot aléatoire n'est qu'une référence plancher.
 */
export const CIBLES = {
  /** Part maximale de parties en faillite avant la fin de la première année. */
  faillitePremiereAnneeMax: 0.02,
  /** Fenêtre du premier disque d'or (médiane, en semaines) : entre la 2e et la 4e année. */
  premierOrFenetre: [104, 208] as const,
  /**
   * Une stratégie est dominante si elle l'emporte à 10 ans (meilleure valorisation, graine par graine,
   * parmi les stratégies sérieuses) dans plus de cette part des parties. La médiane des valorisations
   * ne suffit pas : les résultats d'un tycoon ont une queue très lourde, un écart de médiane se
   * produit sans qu'aucune stratégie ne gagne systématiquement.
   */
  partVictoiresMax: 0.55,
  /** Un genre est dominant s'il l'emporte dans plus de cette part des parties. */
  genreDominantMax: 0.4,
} as const;

export const STRATEGIES_SERIEUSES: readonly BotStrategy[] = BOT_STRATEGIES.filter(
  (s) => s !== 'aleatoire',
);

export interface Verdict {
  libelle: string;
  atteinte: boolean;
  mesure: string;
}

export interface Analyse {
  resume: StrategySummary[];
  gagnante: BotStrategy | null;
  /** Rapport entre la valorisation médiane de la gagnante et celle de la deuxième (10 ans), à titre indicatif. */
  ecartGagnante: number;
  /** Part des graines gagnées à 10 ans par chaque stratégie sérieuse. */
  victoires: { strategie: BotStrategy; part: number }[];
  genres: { genre: string; parties: number; part: number }[];
  verdicts: Verdict[];
}

const pct = (x: number): string => `${(x * 100).toFixed(1)} %`;
const semaineAnnee = (s: number): string => `semaine ${Math.round(s)} (an ${(s / 52).toFixed(1)})`;

/** Lit les résultats : stratégie gagnante, genres dominants et verdict sur chaque cible. */
export function analyser(results: readonly GameResult[]): Analyse {
  const resume = summarize(results);
  const serieux = resume.filter((s) => STRATEGIES_SERIEUSES.includes(s.strategie));
  const classees = [...resume].sort(
    (a, b) => b.medianValorisation10ans - a.medianValorisation10ans,
  );
  const gagnante = classees[0] ?? null;
  const deuxieme = classees[1];
  const ecart =
    gagnante && deuxieme && deuxieme.medianValorisation10ans > 0
      ? gagnante.medianValorisation10ans / deuxieme.medianValorisation10ans
      : gagnante && gagnante.medianValorisation10ans > 0
        ? Infinity
        : 1;

  // Victoires graine par graine, entre stratégies sérieuses (les graines où tout le monde est à zéro ne comptent pas).
  const parGraine = new Map<string, GameResult[]>();
  for (const r of results)
    if (STRATEGIES_SERIEUSES.includes(r.strategie))
      parGraine.set(r.graine, [...(parGraine.get(r.graine) ?? []), r]);
  const gagnees = new Map<BotStrategy, number>();
  let departagees = 0;
  for (const manches of parGraine.values()) {
    const best = [...manches].sort(
      (x, y) => y.valorisation10ans - x.valorisation10ans || x.strategie.localeCompare(y.strategie),
    )[0];
    if (!best || best.valorisation10ans <= 0) continue;
    departagees += 1;
    gagnees.set(best.strategie, (gagnees.get(best.strategie) ?? 0) + 1);
  }
  const victoires = STRATEGIES_SERIEUSES.map((strategie) => ({
    strategie,
    part: departagees === 0 ? 0 : (gagnees.get(strategie) ?? 0) / departagees,
  }));
  const meilleureVictoire = [...victoires].sort((a, b) => b.part - a.part)[0];

  const parGenre = new Map<string, number>();
  for (const r of results)
    if (r.genreDominant) parGenre.set(r.genreDominant, (parGenre.get(r.genreDominant) ?? 0) + 1);
  const genres = [...parGenre.entries()]
    .map(([genre, parties]) => ({
      genre,
      parties,
      part: results.length === 0 ? 0 : parties / results.length,
    }))
    .sort((a, b) => b.parties - a.parties || a.genre.localeCompare(b.genre));

  const faillitesAn1 =
    serieux.length === 0 ? 0 : Math.max(...serieux.map((s) => s.tauxFaillitePremiereAnnee));
  const ors = serieux.map((s) => s.medianPremierOr).filter((x): x is number => x !== null);
  const [orMin, orMax] = CIBLES.premierOrFenetre;
  const orMedian = ors.length === 0 ? null : median(ors);
  const genreTete = genres[0];

  const verdicts: Verdict[] = [
    {
      libelle: `Faillite la première année sous ${pct(CIBLES.faillitePremiereAnneeMax)} (stratégies sérieuses)`,
      atteinte: faillitesAn1 < CIBLES.faillitePremiereAnneeMax,
      mesure: `pire stratégie : ${pct(faillitesAn1)}`,
    },
    {
      libelle: `Premier disque d’or entre la 2e et la 4e année (médiane des stratégies sérieuses)`,
      atteinte: orMedian !== null && orMedian >= orMin && orMedian <= orMax,
      mesure: orMedian === null ? 'jamais atteint' : semaineAnnee(orMedian),
    },
    {
      libelle: `Aucune stratégie dominante (aucune ne gagne plus de ${pct(CIBLES.partVictoiresMax)} des graines à 10 ans)`,
      atteinte: !meilleureVictoire || meilleureVictoire.part <= CIBLES.partVictoiresMax,
      mesure: meilleureVictoire
        ? `${meilleureVictoire.strategie} gagne ${pct(meilleureVictoire.part)} des graines (×${Number.isFinite(ecart) ? ecart.toFixed(2) : '∞'} en médiane pour ${gagnante?.strategie ?? 'aucune'})`
        : 'aucune partie départagée',
    },
    {
      libelle: `Aucun genre dominant (moins de ${pct(CIBLES.genreDominantMax)} des parties)`,
      atteinte: !genreTete || genreTete.part < CIBLES.genreDominantMax,
      mesure: genreTete ? `${genreTete.genre} : ${pct(genreTete.part)}` : 'aucun genre',
    },
  ];
  return {
    resume,
    gagnante: gagnante?.strategie ?? null,
    ecartGagnante: ecart,
    victoires,
    genres,
    verdicts,
  };
}

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Rapport Markdown complet : faillites, premier disque d'or, valorisations, genres, stratégie gagnante, cibles. */
export function renderReport(results: readonly GameResult[], options: SimOptions): string {
  const a = analyser(results);
  const palierNom = (rang: number): string => TIERS[Math.round(rang)]?.id ?? '?';
  const lines = [
    '# Rapport d’équilibrage',
    '',
    `${options.games} parties par stratégie, ${options.weeks} semaines, graines « ${options.seedPrefix}-n ».`,
    '',
    '## Faillites',
    '',
    '| Stratégie | Faillites | Dont 1re année | Semaine médiane |',
    '| --- | --- | --- | --- |',
    ...a.resume.map(
      (s) =>
        `| ${s.strategie} | ${pct(s.tauxFaillite)} | ${pct(s.tauxFaillitePremiereAnnee)} | ${s.medianFaillite === null ? '—' : Math.round(s.medianFaillite)} |`,
    ),
    '',
    '## Premier disque d’or',
    '',
    '| Stratégie | Parties avec un disque d’or | Semaine médiane |',
    '| --- | --- | --- |',
    ...a.resume.map(
      (s) =>
        `| ${s.strategie} | ${pct(s.tauxPremierOr)} | ${s.medianPremierOr === null ? 'jamais' : semaineAnnee(s.medianPremierOr)} |`,
    ),
    '',
    '## Valorisation du label (médiane)',
    '',
    '| Stratégie | À 5 ans | À 10 ans | Quartiles à 10 ans | Palier médian |',
    '| --- | --- | --- | --- | --- |',
    ...a.resume.map(
      (s) =>
        `| ${s.strategie} | ${eur(s.medianValorisation5ans)} | ${eur(s.medianValorisation10ans)} | ${eur(s.quartilesValorisation10ans[0])} à ${eur(s.quartilesValorisation10ans[1])} | ${palierNom(s.palierMedian)} |`,
    ),
    '',
    '## Genres dominants',
    '',
    ...a.genres.map((g) => `- ${g.genre} : ${g.parties} parties (${pct(g.part)})`),
    '',
    `## Stratégie gagnante : ${a.gagnante ?? 'aucune'}`,
    '',
    `Plus forte valorisation médiane à 10 ans, devant la suivante de ×${Number.isFinite(a.ecartGagnante) ? a.ecartGagnante.toFixed(2) : '∞'}.`,
    '',
    'Victoires graine par graine entre stratégies sérieuses (10 ans) : ' +
      a.victoires.map((v) => `${v.strategie} ${pct(v.part)}`).join(', ') +
      '.',
    '',
    '## Cibles',
    '',
    '| Cible | Atteinte | Mesure |',
    '| --- | --- | --- |',
    ...a.verdicts.map((v) => `| ${v.libelle} | ${v.atteinte ? '✔' : '✘'} | ${v.mesure} |`),
    '',
    'Les stratégies sérieuses sont prudent, agressif et spécialiste ; le bot aléatoire sert de plancher. Ce rapport repère les déséquilibres, il ne fixe pas les réglages.',
    '',
  ];
  return lines.join('\n');
}
