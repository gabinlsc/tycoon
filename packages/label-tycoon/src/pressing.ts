import { type ActionHandler, cents, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { CERTIFICATIONS, FORMATS, PRESSING, type PhysicalFormat } from './balance';
import { buildingLevel } from './buildings';
import { labelShare } from './contracts';
import { canAfford, earn, spend } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export interface Commande {
  id: number;
  projetId: number;
  format: PhysicalFormat;
  quantite: number;
  vendu: number;
  /** Semaine d'arrivée en stock. */
  arrivee: number;
  liquide: boolean;
}

/** Coût unitaire d'un format selon le niveau du bâtiment de pressage. */
export const unitCost = (state: LabelState, format: PhysicalFormat): number =>
  Math.round(
    FORMATS[format].cout * (1 - PRESSING.costDiscountPerLevel * buildingLevel(state, 'pressage')),
  );

/** Délai de fabrication en semaines (au moins 1). */
export const pressingWeeks = (state: LabelState, format: PhysicalFormat): number =>
  Math.max(
    1,
    FORMATS[format].semaines - PRESSING.weeksSavedPerLevel * buildingLevel(state, 'pressage'),
  );

/** Exemplaires en stock d'une commande arrivée. */
export const stockOf = (c: Commande, tick: number): number =>
  tick >= c.arrivee && !c.liquide ? c.quantite - c.vendu : 0;

export interface PressAction extends Action {
  readonly type: 'presser';
  readonly projetId: number;
  readonly format: PhysicalFormat;
  readonly quantite: number;
}

export const press: ActionHandler<LabelState, PressAction, LabelSignal> = {
  validate(state, action) {
    if (buildingLevel(state, 'pressage') < 1) return reject('pas-de-pressage');
    if (!(action.format in FORMATS)) return reject('format-inconnu');
    const projet = state.projets.find((p) => p.id === action.projetId);
    if (!projet || projet.statut !== 'sortie') return reject('projet-introuvable');
    if (
      !Number.isInteger(action.quantite) ||
      action.quantite < PRESSING.min ||
      action.quantite > PRESSING.max
    )
      return reject('quantite-invalide', { min: PRESSING.min, max: PRESSING.max });
    const cost = cents(unitCost(state, action.format) * action.quantite);
    return canAfford(state, cost) ? null : reject('fonds-insuffisants', { besoin: cost });
  },
  apply(state, action, ctx) {
    spend(state, 'production', cents(unitCost(state, action.format) * action.quantite));
    state.commandes.push({
      id: state.nextId,
      projetId: action.projetId,
      format: action.format,
      quantite: action.quantite,
      vendu: 0,
      arrivee: ctx.tick + pressingWeeks(state, action.format),
      liquide: false,
    });
    state.nextId += 1;
  },
};

/** Ventes physiques de la semaine et liquidation des invendus. */
export function physicalWeek(state: LabelState, tick: number): void {
  for (const c of state.commandes) {
    if (c.liquide || tick < c.arrivee) continue;
    const projet = state.projets.find((p) => p.id === c.projetId);
    if (!projet) continue;
    const format = FORMATS[c.format];
    const equivalent = projet.derniers / CERTIFICATIONS.streamsPerSale;
    const demand = Math.floor(equivalent * PRESSING.physicalShare * format.demande * 100);
    const sold = Math.min(demand, c.quantite - c.vendu);
    if (sold > 0) {
      c.vendu += sold;
      const gross = cents(sold * format.prix);
      const contract = state.contrats.find((k) => k.artisteId === projet.artisteId);
      earn(state, 'physique', contract ? labelShare(contract.clauses, gross) : gross);
    }
    if (tick - c.arrivee >= PRESSING.liquidateAfter) {
      const left = c.quantite - c.vendu;
      if (left > 0)
        earn(state, 'physique', cents(Math.round(left * format.prix * PRESSING.liquidationPrice)));
      c.vendu = c.quantite;
      c.liquide = true;
    }
  }
}
