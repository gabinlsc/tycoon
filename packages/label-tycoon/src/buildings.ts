import { type ActionHandler, cents, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { BUILDINGS, BUILDING_EFFECTS, BUILDING_IDS, PRODUCTION, type BuildingId } from './balance';
import { tierAtLeast } from './tiers';
import { canAfford, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

/** Niveaux possédés et travaux en cours. */
export interface BatimentsState {
  niveaux: Record<BuildingId, number>;
  travaux: { batiment: BuildingId; niveau: number; fin: number }[];
}

export function initialBuildings(): BatimentsState {
  return {
    niveaux: Object.fromEntries(BUILDING_IDS.map((id) => [id, BUILDINGS[id].start])) as Record<
      BuildingId,
      number
    >,
    travaux: [],
  };
}

export const buildingLevel = (state: LabelState, id: BuildingId): number =>
  state.batiments.niveaux[id];

/** Niveau de studio utilisable dans une sortie (0-100). */
export const studioCap = (state: LabelState): number =>
  buildingLevel(state, 'studio') * BUILDING_EFFECTS.studioCapPerLevel;

/** Projets de production simultanés possibles. */
export const productionCapacity = (state: LabelState): number =>
  PRODUCTION.capacity +
  (buildingLevel(state, 'studio') - 1) * BUILDING_EFFECTS.studioCapacityPerLevel;

/** Effectif maximal de l'équipe. */
export const teamCapacity = (state: LabelState): number =>
  BUILDING_EFFECTS.teamBase + buildingLevel(state, 'bureaux') * BUILDING_EFFECTS.teamPerOffice;

export interface BuildAction extends Action {
  readonly type: 'construire';
  readonly batiment: BuildingId;
}

export const build: ActionHandler<LabelState, BuildAction, LabelSignal> = {
  validate(state, action) {
    const rule = BUILDINGS[action.batiment] as (typeof BUILDINGS)[BuildingId] | undefined;
    if (!rule) return reject('batiment-inconnu');
    if (state.batiments.travaux.some((t) => t.batiment === action.batiment))
      return reject('travaux-en-cours');
    const next = buildingLevel(state, action.batiment) + 1;
    if (next > rule.maxLevel) return reject('niveau-maximal');
    if (!tierAtLeast(state, rule.tier)) return reject('palier-insuffisant');
    const cost = rule.cost[next - 1] ?? cents(0);
    return canAfford(state, cost) ? null : reject('fonds-insuffisants', { besoin: cost });
  },
  apply(state, action, ctx) {
    const rule = BUILDINGS[action.batiment];
    const niveau = buildingLevel(state, action.batiment) + 1;
    spend(state, 'entretien', rule.cost[niveau - 1] ?? cents(0));
    state.batiments.travaux.push({ batiment: action.batiment, niveau, fin: ctx.tick + rule.weeks });
  },
};

/** Chaque semaine : achève les travaux terminés et prélève l'entretien des niveaux possédés. */
export function buildingsWeek(
  state: LabelState,
  tick: number,
  emit: (s: LabelSignal) => void,
): void {
  const pending: BatimentsState['travaux'] = [];
  for (const t of state.batiments.travaux) {
    if (tick >= t.fin) {
      state.batiments.niveaux[t.batiment] = t.niveau;
      emit({ kind: 'batiment-termine', payload: { batiment: t.batiment, niveau: t.niveau } });
    } else pending.push(t);
  }
  state.batiments.travaux = pending;
  for (const id of BUILDING_IDS) {
    const levels = state.batiments.niveaux[id];
    const paid = levels - BUILDINGS[id].start;
    if (paid > 0) spend(state, 'entretien', cents(BUILDINGS[id].upkeep * paid));
  }
}

/** Fatigue récupérée en plus chaque semaine grâce à la salle de répétition. */
export const rehearsalRecovery = (state: LabelState): number =>
  buildingLevel(state, 'repetition') * BUILDING_EFFECTS.rehearsalFatigue;
