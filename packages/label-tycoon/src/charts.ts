import type { Phase, Rng } from '@tycoon/core';
import { CERTIFICATIONS, CHARTS } from './balance';
import type { CertificationLevel } from './balance/tiers';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export type ChartId = 'singles' | 'albums';

export interface ChartEntry {
  /** Streams de la semaine. */
  streams: number;
  /** Identifiant du projet du joueur, ou `null` pour le bruit de marché. */
  projetId: number | null;
}

/** Historique d'une sortie du joueur dans les classements. */
export interface ChartHistory {
  chart: ChartId;
  entree: number;
  meilleure: number;
  semaines: number;
  /** Position cette semaine, `null` si hors classement. */
  position: number | null;
}

export interface ChartsState {
  singles: ChartEntry[];
  albums: ChartEntry[];
  historique: Record<string, ChartHistory>;
}

export const emptyCharts = (): ChartsState => ({ singles: [], albums: [], historique: {} });

/** Classement qui accueille un type de sortie. */
export const chartOf = (type: string): ChartId =>
  CHARTS.singleTypes.includes(type) ? 'singles' : 'albums';

/** Entrées de bruit de marché : une décroissance géométrique bruitée. */
export function marketNoise(rng: Rng, chart: ChartId): ChartEntry[] {
  let level = CHARTS.noiseTop[chart];
  const out: ChartEntry[] = [];
  for (let i = 0; i < CHARTS.size; i += 1) {
    out.push({
      streams: Math.max(1, Math.round(level * (1 + rng.gaussian(0, CHARTS.noiseSd)))),
      projetId: null,
    });
    level *= CHARTS.noiseDecay;
  }
  return out;
}

/** Phase « classements » : fusionne sorties du joueur et bruit, garde les 50 premiers, met l'historique à jour. */
export const chartsPhase: Phase<LabelState, LabelSignal> = {
  name: 'classements',
  run(state, ctx) {
    certify(state, ctx.emit);
    const rng = ctx.rng('marche');
    const charts = state.classements;
    for (const chart of ['singles', 'albums'] as const) {
      const entries = marketNoise(rng, chart);
      for (const p of state.projets) {
        if (p.statut === 'sortie' && p.derniers > 0 && chartOf(p.type) === chart)
          entries.push({ streams: p.derniers, projetId: p.id });
      }
      entries.sort((a, b) => b.streams - a.streams || (a.projetId ?? 0) - (b.projetId ?? 0));
      charts[chart] = entries.slice(0, CHARTS.size);
      for (const h of Object.values(charts.historique)) if (h.chart === chart) h.position = null;
      charts[chart].forEach((entry, index) => {
        if (entry.projetId === null) return;
        const key = String(entry.projetId);
        const position = index + 1;
        const existing = charts.historique[key];
        if (!existing) {
          charts.historique[key] = {
            chart,
            entree: ctx.tick,
            meilleure: position,
            semaines: 1,
            position,
          };
          ctx.emit({ kind: 'entree-classement', payload: { projetId: entry.projetId, position } });
        } else {
          existing.position = position;
          existing.meilleure = Math.min(existing.meilleure, position);
          existing.semaines += 1;
        }
      });
    }
  },
};

const LEVELS: readonly CertificationLevel[] = ['or', 'platine', 'diamant'];

/** Ventes équivalentes d'une sortie : streams cumulés convertis. */
export const equivalentSales = (streams: number): number =>
  Math.floor(streams / CERTIFICATIONS.streamsPerSale);

/** Seuil de ventes équivalentes pour un niveau et un type de sortie. */
export function certificationThreshold(level: CertificationLevel, type: string): number {
  const base = CERTIFICATIONS.thresholds[level] * CERTIFICATIONS.eraFactor;
  return Math.round(chartOf(type) === 'albums' ? base * CERTIFICATIONS.albumFactor : base);
}

/** Meilleur niveau atteint par une sortie, ou `null`. */
export function certificationFor(streams: number, type: string): CertificationLevel | null {
  const sales = equivalentSales(streams);
  let best: CertificationLevel | null = null;
  for (const level of LEVELS) if (sales >= certificationThreshold(level, type)) best = level;
  return best;
}

/** Plus haute certification parmi les sorties du joueur. */
export function bestCertification(state: LabelState): CertificationLevel | null {
  let best = -1;
  for (const p of state.projets) {
    const rank = p.certification ? LEVELS.indexOf(p.certification) : -1;
    if (rank > best) best = rank;
  }
  return best < 0 ? null : (LEVELS[best] ?? null);
}

/** Décerne les certifications méritées : réputation gagnée et signal pour chaque nouveau niveau. */
export function certify(state: LabelState, emit: (s: LabelSignal) => void): void {
  for (const p of state.projets) {
    if (p.statut !== 'sortie') continue;
    const level = certificationFor(p.streams, p.type);
    if (!level) continue;
    const from = p.certification ? LEVELS.indexOf(p.certification) : -1;
    const to = LEVELS.indexOf(level);
    for (let i = from + 1; i <= to; i += 1) {
      const gained = LEVELS[i];
      if (!gained) continue;
      state.label.reputation = Math.min(
        100,
        state.label.reputation + CERTIFICATIONS.reputationGain[gained],
      );
      emit({ kind: 'certification', payload: { projetId: p.id, niveau: gained } });
    }
    p.certification = level;
  }
}
