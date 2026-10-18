import { type ActionHandler, type Rng, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { DELEGATION, type ScoutSource, SCOUTING, SOURCES } from './balance';
import { canAfford, spend } from './finance';
import type { LabelSignal } from './pipeline';
import { scoutTalents } from './scouting';
import type { LabelState } from './state';
import { analystLevel } from './forecast';

export type DelegationDomain = 'reperage';

/** Cadre fixé par le joueur : le personnel agit dedans, jamais au-delà. */
export interface Cadre {
  actif: boolean;
  /** Budget maximal dépensé par décision. */
  budgetMax: number;
  /** Genres autorisés (vide = tous). */
  genres: string[];
  /** Sous ce niveau de trésorerie, plus aucune décision n'est prise. */
  seuilAlerte: number;
}

export interface Rapport {
  semaine: number;
  domaine: DelegationDomain;
  /** Source choisie, ou `null` si rien n'a été décidé. */
  decision: string | null;
  cout: number;
  /** Talents ajoutés au suivi (hors cadre = écartés). */
  retenus: number;
  ecartes: number;
}

export const defaultCadre = (): Cadre => ({
  actif: false,
  budgetMax: 0,
  genres: [],
  seuilAlerte: 0,
});

export interface ConfigureAction extends Action {
  readonly type: 'configurer-delegation';
  readonly domaine: DelegationDomain;
  readonly cadre: Cadre;
}

export const configureDelegation: ActionHandler<LabelState, ConfigureAction, LabelSignal> = {
  validate(_state, action) {
    if (action.domaine !== 'reperage') return reject('domaine-inconnu');
    const c = action.cadre;
    if (!Number.isInteger(c.budgetMax) || c.budgetMax < 0 || !Number.isInteger(c.seuilAlerte))
      return reject('cadre-invalide');
    return null;
  },
  apply(state, action) {
    state.delegation[action.domaine] = { ...action.cadre, genres: [...action.cadre.genres] };
  },
};

/** Source choisie par le dénicheur : sa qualité dépend de son niveau. */
export function chooseSource(level: number, budget: number): ScoutSource | null {
  const order: ScoutSource[] =
    level >= DELEGATION.goodLevel
      ? ['plateforme', 'battle', 'open-mic', 'candidature']
      : ['open-mic', 'candidature'];
  return order.find((s) => SOURCES[s].cost <= budget) ?? null;
}

/** Décision déléguée de repérage, prise toutes les `every` semaines dans le cadre fixé. */
export function delegatedScouting(
  state: LabelState,
  rng: Rng,
  tick: number,
  emit: (s: LabelSignal) => void,
): void {
  const cadre = state.delegation.reperage;
  if (!cadre?.actif || tick % DELEGATION.every !== 0) return;
  const level = analystLevel(state);
  if (state.denicheurs.length === 0) return;
  const rapport: Rapport = {
    semaine: tick,
    domaine: 'reperage',
    decision: null,
    cout: 0,
    retenus: 0,
    ecartes: 0,
  };
  const blocked =
    state.label.tresorerie < cadre.seuilAlerte || state.suivis.length + 4 > SCOUTING.maxFollowed;
  const source = blocked ? null : chooseSource(level, cadre.budgetMax);
  if (source && canAfford(state, SOURCES[source].cost)) {
    spend(state, 'reperage', SOURCES[source].cost);
    const before = state.suivis.length;
    const found = scoutTalents(state, rng, source, tick, state.denicheurs[0] ?? null);
    if (cadre.genres.length > 0) {
      const allowed = new Set(cadre.genres);
      const rejected = new Set(found.filter((a) => !allowed.has(a.genre)).map((a) => a.id));
      state.suivis = state.suivis.filter((p) => !rejected.has(p.artisteId));
    }
    rapport.decision = source;
    rapport.cout = SOURCES[source].cost;
    rapport.retenus = state.suivis.length - before;
    rapport.ecartes = found.length - rapport.retenus;
  } else if (blocked) {
    emit({ kind: 'delegation-bloquee', payload: { domaine: 'reperage' } });
  }
  state.rapports.push(rapport);
  state.rapports = state.rapports.slice(-DELEGATION.keepReports);
}
