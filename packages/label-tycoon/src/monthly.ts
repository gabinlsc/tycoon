import { type Phase, calendarOf, dominantTerms } from '@tycoon/core';
import { hitPotential } from './formulas/streams';
import { trendMultiplier } from './market';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

/** Une ligne du rapport : ce qui s'est passé, et les causes principales en clair. */
export interface LigneRapport {
  code: string;
  artisteId: number | null;
  /** Termes qui expliquent le résultat, du plus important au moins important. */
  causes: string[];
}

export interface RapportMensuel {
  /** Semaine de clôture du mois. */
  semaine: number;
  net: number;
  revenus: number;
  depenses: number;
  tresorerie: number;
  /** Variation de trésorerie depuis le rapport précédent. */
  variation: number;
  /** Poste de revenu principal du mois, s'il y en a un. */
  premierRevenu: string | null;
  reussites: LigneRapport[];
  echecs: LigneRapport[];
}

const SUCCESS = [
  'certification',
  'prix-remporte',
  'entree-classement',
  'viral',
  'retour-en-grace',
  'artiste-signe',
];
const FAILURE = [
  'burnout',
  'debauchage',
  'alerte-faillite',
  'proces',
  'pret-impaye',
  'objectif-investisseur-manque',
  'controle-fiscal',
];

/** Causes d'un succès de sortie : les termes dominants du potentiel de hit (qualité, tendance, hype). */
export function causesOfRelease(state: LabelState, projetId: number): string[] {
  const p = state.projets.find((x) => x.id === projetId);
  const artist = p && state.artistes.find((a) => a.id === p.artisteId);
  if (!p || !artist) return [];
  const trend = trendMultiplier(state.marche.genres[artist.genre]?.popularite ?? 50);
  const explained = hitPotential(p.qualite ?? 0, trend, artist.hype, 1);
  return dominantTerms(explained, 2).map((t) => t.key);
}

/** Construit le rapport d'un mois à partir des comptes et du Fil de la période. */
export function buildMonthlyReport(state: LabelState, tick: number): RapportMensuel {
  const month = state.finances.mois[state.finances.mois.length - 1];
  const previous = state.rapportsMensuels[state.rapportsMensuels.length - 1];
  const start = month?.debut ?? tick - 3;
  const actus = state.fil.filter((a) => a.semaine >= start && a.semaine <= tick);
  const toLine = (kind: string, artisteId: number | null): LigneRapport => ({
    code: kind,
    artisteId,
    causes: causesForKind(state, kind, artisteId),
  });
  const reussites = actus
    .filter((a) => SUCCESS.includes(a.kind))
    .map((a) => toLine(a.kind, a.artisteId));
  const echecs = actus
    .filter((a) => FAILURE.includes(a.kind))
    .map((a) => toLine(a.kind, a.artisteId));
  const revenus = month?.revenus ?? {};
  const top = Object.entries(revenus).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return {
    semaine: tick,
    net: month?.net ?? 0,
    revenus: month?.totalRevenus ?? 0,
    depenses: month?.totalDepenses ?? 0,
    tresorerie: state.label.tresorerie,
    variation: state.label.tresorerie - (previous?.tresorerie ?? state.label.tresorerie),
    premierRevenu: top && top[1] > 0 ? top[0] : null,
    reussites: reussites.slice(0, 8),
    echecs: echecs.slice(0, 8),
  };
}

function causesForKind(state: LabelState, kind: string, artisteId: number | null): string[] {
  if (artisteId === null) return [];
  if (kind === 'entree-classement' || kind === 'certification' || kind === 'viral') {
    const projet = [...state.projets]
      .reverse()
      .find((p) => p.artisteId === artisteId && p.statut === 'sortie');
    return projet ? causesOfRelease(state, projet.id) : [];
  }
  const artist = state.artistes.find((a) => a.id === artisteId);
  if (!artist) return [];
  if (kind === 'burnout') return artist.fatigue >= 80 ? ['fatigue'] : ['tournee'];
  if (kind === 'debauchage') return artist.loyaute < 40 ? ['loyaute'] : ['contrat'];
  return [];
}

/** Phase de fin de mois : clôt le rapport mensuel (calendrier 4-4-5). */
export const monthlyPhase: Phase<LabelState, LabelSignal> = {
  name: 'fil',
  run(state, ctx) {
    if (!calendarOf(ctx.tick).isMonthEnd) return;
    state.rapportsMensuels.push(buildMonthlyReport(state, ctx.tick));
    if (state.rapportsMensuels.length > 60) state.rapportsMensuels.shift();
    ctx.emit({ kind: 'rapport-mensuel', payload: {} });
  },
};
