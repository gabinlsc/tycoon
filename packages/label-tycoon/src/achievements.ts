import { type Phase, cents } from '@tycoon/core';
import { ACHIEVEMENT_THRESHOLDS, type AchievementFamily, OBJECTIVES } from './balance';
import { earn } from './finance';
import type { LabelSignal } from './pipeline';
import { tierRank } from './tiers';
import type { LabelState } from './state';
import { labelScore } from './valuation';
import { buildingLevel } from './buildings';

/** Compteurs cumulés par type de signal, nourris à chaque tick. */
export type Stats = Record<string, number>;

export interface Succes {
  id: string;
  famille: AchievementFamily;
  seuil: number;
}

/** Les 60 succès de la V1, un par seuil de chaque famille. */
export const SUCCES: readonly Succes[] = (
  Object.keys(ACHIEVEMENT_THRESHOLDS) as AchievementFamily[]
).flatMap((famille) =>
  ACHIEVEMENT_THRESHOLDS[famille].map((seuil) => ({ id: `${famille}:${seuil}`, famille, seuil })),
);

const stat = (state: LabelState, kind: string): number => state.stats[kind] ?? 0;

/** Valeur courante d'une famille, comparée au seuil (pour `classement`, plus petit = mieux). */
export function familyValue(state: LabelState, famille: AchievementFamily, tick: number): number {
  switch (famille) {
    case 'signatures':
      return stat(state, 'artiste-signe');
    case 'sorties':
      return stat(state, 'sortie');
    case 'concerts':
      return stat(state, 'concert');
    case 'certifications':
      return stat(state, 'certification');
    case 'prix':
      return stat(state, 'prix-remporte');
    case 'nominations':
      return stat(state, 'nomination');
    case 'viral':
      return stat(state, 'viral');
    case 'festivals':
      return stat(state, 'festival');
    case 'debauchages':
      return stat(state, 'debauchage');
    case 'evenements':
      return stat(state, 'evenement') + stat(state, 'decision-tranchee');
    case 'anciennete':
      return tick;
    case 'tresorerie':
      return state.label.tresorerie;
    case 'valorisation':
      return labelScore(state, tick);
    case 'palier':
      return tierRank(state.label.tier);
    case 'credibilite':
      return Math.max(0, ...Object.values(state.label.credibilite));
    case 'classement':
      return Math.min(
        Infinity,
        ...Object.values(state.classements.historique).map((h) => h.meilleure),
      );
    case 'equipe':
      return state.personnel.length;
    case 'studio':
      return buildingLevel(state, 'studio');
    case 'retours':
      return stat(state, 'retour-en-grace') + stat(state, 'statut-culte');
    case 'enchere':
      return stat(state, 'enchere');
  }
}

export const isReached = (famille: AchievementFamily, value: number, seuil: number): boolean =>
  famille === 'classement' ? value <= seuil : value >= seuil;

/** Succès débloqués d'après l'état, sans ceux déjà obtenus. */
export function newlyUnlocked(state: LabelState, tick: number): Succes[] {
  const values = new Map<AchievementFamily, number>();
  return SUCCES.filter((s) => {
    if (state.succes.includes(s.id)) return false;
    if (!values.has(s.famille)) values.set(s.famille, familyValue(state, s.famille, tick));
    return isReached(s.famille, values.get(s.famille) ?? 0, s.seuil);
  });
}

// --- Objectifs dynamiques ---

export type ObjectiveKind =
  'signer' | 'sortir' | 'concert' | 'certification' | 'classement' | 'tresorerie';

export interface Objectif {
  id: number;
  kind: ObjectiveKind;
  /** Compteur à atteindre (en plus du point de départ), ou montant de trésorerie à dépasser. */
  cible: number;
  base: number;
}

const COUNTERS: Record<Exclude<ObjectiveKind, 'tresorerie' | 'classement'>, string> = {
  signer: 'artiste-signe',
  sortir: 'sortie',
  concert: 'concert',
  certification: 'certification',
};

export function objectiveProgress(state: LabelState, o: Objectif): number {
  if (o.kind === 'tresorerie') return state.label.tresorerie;
  if (o.kind === 'classement') return stat(state, 'entree-classement');
  return stat(state, COUNTERS[o.kind]);
}

export const objectiveDone = (state: LabelState, o: Objectif): boolean =>
  objectiveProgress(state, o) >= (o.kind === 'tresorerie' ? o.cible : o.base + o.cible);

/** Choisit un nouvel objectif adapté à la situation : jamais deux du même type, cible liée à l'avancement. */
export function proposeObjective(state: LabelState, pick: (n: number) => number): Objectif {
  const taken = new Set(state.objectifs.map((o) => o.kind));
  const pool: ObjectiveKind[] = [
    'signer',
    'sortir',
    'concert',
    'certification',
    'classement',
    'tresorerie',
  ].filter((k) => !taken.has(k as ObjectiveKind)) as ObjectiveKind[];
  const kinds = pool.length > 0 ? pool : (['sortir'] as ObjectiveKind[]);
  const kind = kinds[pick(kinds.length)] ?? 'sortir';
  const base =
    kind === 'tresorerie'
      ? 0
      : kind === 'classement'
        ? stat(state, 'entree-classement')
        : stat(state, COUNTERS[kind]);
  const cible =
    kind === 'tresorerie'
      ? Math.max(100_000, Math.round(state.label.tresorerie * 1.5))
      : kind === 'signer'
        ? 1
        : kind === 'certification' || kind === 'classement'
          ? 1
          : 2;
  const id = state.nextId;
  state.nextId += 1;
  return { id, kind, cible, base };
}

export interface Record_ {
  clef: string;
  valeur: number;
  semaine: number;
}

/** Records du label (Panthéon) : ils ne font que monter. */
export function updateRecords(state: LabelState, tick: number): string[] {
  const broken: string[] = [];
  const candidates: [string, number][] = [
    ['meilleure-sortie', Math.max(0, ...state.projets.map((p) => p.streams))],
    [
      'plus-gros-fandom',
      Math.max(0, ...state.artistes.filter((a) => a.employeur === 'joueur').map((a) => a.fanbase)),
    ],
    ['tresorerie-max', state.label.tresorerie],
    [
      'plus-longue-presence',
      Math.max(0, ...Object.values(state.classements.historique).map((h) => h.semaines)),
    ],
  ];
  for (const [clef, valeur] of candidates) {
    const existing = state.records.find((r) => r.clef === clef);
    if (!existing) state.records.push({ clef, valeur, semaine: tick });
    else if (valeur > existing.valeur) {
      existing.valeur = valeur;
      existing.semaine = tick;
      broken.push(clef);
    }
  }
  return broken;
}

/**
 * Compte les signaux du tick, débloque les succès, valide les objectifs (récompense) et met à jour
 * les records. À appeler une fois par tick, après les autres phases.
 */
export const achievementsPhase: Phase<LabelState, LabelSignal> = {
  name: 'paliers',
  run(state, ctx) {
    for (const s of ctx.signalsThisTick?.() ?? [])
      state.stats[s.kind] = (state.stats[s.kind] ?? 0) + 1;
    for (const s of newlyUnlocked(state, ctx.tick)) {
      state.succes.push(s.id);
      ctx.emit({ kind: 'succes', payload: { id: s.id } });
    }
    const done = state.objectifs.filter((o) => objectiveDone(state, o));
    if (done.length > 0) {
      state.objectifs = state.objectifs.filter((o) => !done.includes(o));
      for (const o of done) {
        earn(state, 'autres', cents(OBJECTIVES.rewards[o.kind]));
        state.label.reputation = Math.min(100, state.label.reputation + OBJECTIVES.reputation);
        ctx.emit({ kind: 'objectif-atteint', payload: { objectif: o.kind } });
      }
    }
    const rng = ctx.rng('objectifs');
    while (state.objectifs.length < OBJECTIVES.active)
      state.objectifs.push(proposeObjective(state, (n) => rng.int(0, n - 1)));
    updateRecords(state, ctx.tick);
  },
};
