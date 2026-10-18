import { type ActionHandler, type Phase, Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { generateArtist, takenStageNames } from './artists';
import {
  ACADEMIE,
  FONDATION,
  GENERATIONS,
  INFLUENCE,
  MUSEE,
  RIVAL_INTERACTIONS,
  UNLOCKS,
} from './balance';
import { rosterCap, rosterSize } from './contracts';
import { legendesDuGenre } from './generations';
import { canAfford, earn, spend } from './finance';
import { genreKeys } from './market';
import type { LabelSignal } from './pipeline';
import { type LabelState, newId } from './state';
import { tierAtLeast } from './tiers';

export interface Academie {
  niveau: number;
  genre: string;
  /** Budget hebdomadaire (centimes). */
  budget: number;
  /** Semaine de la prochaine promotion. */
  prochaine: number;
  diplomes: number;
}

export interface RegleActive {
  regle: 'remuneration';
  /** Dernière semaine d'effet (incluse). */
  fin: number;
}

/** État de l'institution : fondation, académie, musée, influence et règles actives. */
export interface InstitutionState {
  don: number;
  donne: number;
  influence: number;
  academie: Academie | null;
  musee: number;
  regles: RegleActive[];
}

export const initialInstitution = (): InstitutionState => ({
  don: 0,
  donne: 0,
  influence: 0,
  academie: null,
  musee: 0,
  regles: [],
});

export const debloque = (state: LabelState): boolean => tierAtLeast(state, UNLOCKS.fondation);

/** Majoration des revenus de streaming obtenue par l'influence (règle « rémunération »). */
export function bonusRemuneration(state: LabelState, tick: number): number {
  const active = state.institution.regles.some((r) => r.regle === 'remuneration' && r.fin >= tick);
  return active ? 1 + INFLUENCE.rules.remuneration.bonus : 1;
}

export interface SetDonationAction extends Action {
  readonly type: 'regler-fondation';
  readonly don: number;
}
export interface UpgradeAcademyAction extends Action {
  readonly type: 'ameliorer-academie';
}
export interface SetAcademyAction extends Action {
  readonly type: 'regler-academie';
  readonly genre: string;
  readonly budget: number;
}
export interface UpgradeMuseumAction extends Action {
  readonly type: 'ameliorer-musee';
}
export interface InfluenceAction extends Action {
  readonly type: 'influencer';
  readonly regle: 'remuneration' | 'vivier';
}

export const setDonation: ActionHandler<LabelState, SetDonationAction, LabelSignal> = {
  validate(state, action) {
    if (!debloque(state)) return reject('palier-insuffisant');
    return Number.isInteger(action.don) && action.don >= 0 && action.don <= FONDATION.donMax
      ? null
      : reject('montant-invalide', { max: FONDATION.donMax });
  },
  apply(state, action) {
    state.institution.don = action.don;
  },
};

export const upgradeAcademy: ActionHandler<LabelState, UpgradeAcademyAction, LabelSignal> = {
  validate(state) {
    if (!debloque(state)) return reject('palier-insuffisant');
    const niveau = state.institution.academie?.niveau ?? 0;
    if (niveau >= ACADEMIE.max) return reject('niveau-maximal');
    const cout = ACADEMIE.cost[niveau] ?? ACADEMIE.cost[ACADEMIE.max - 1] ?? 0;
    return canAfford(state, cents(cout)) ? null : reject('fonds-insuffisants', { besoin: cout });
  },
  apply(state, _action, ctx) {
    const niveau = state.institution.academie?.niveau ?? 0;
    spend(state, 'institution', cents(ACADEMIE.cost[niveau] ?? 0));
    const a = state.institution.academie;
    if (a) a.niveau = niveau + 1;
    else
      state.institution.academie = {
        niveau: 1,
        genre: genreKeys(state.marche)[0] ?? 'rap',
        budget: 0,
        prochaine: ctx.tick + ACADEMIE.cycle,
        diplomes: 0,
      };
  },
};

export const setAcademy: ActionHandler<LabelState, SetAcademyAction, LabelSignal> = {
  validate(state, action) {
    if (!state.institution.academie) return reject('pas-d-academie');
    if (!genreKeys(state.marche).includes(action.genre)) return reject('genre-inconnu');
    return Number.isInteger(action.budget) &&
      action.budget >= 0 &&
      action.budget <= ACADEMIE.budgetMax
      ? null
      : reject('montant-invalide', { max: ACADEMIE.budgetMax });
  },
  apply(state, action) {
    const a = state.institution.academie;
    if (!a) return;
    a.genre = action.genre;
    a.budget = action.budget;
  },
};

export const upgradeMuseum: ActionHandler<LabelState, UpgradeMuseumAction, LabelSignal> = {
  validate(state) {
    if (!debloque(state)) return reject('palier-insuffisant');
    if (state.institution.musee >= MUSEE.max) return reject('niveau-maximal');
    const cout = MUSEE.cost[state.institution.musee] ?? 0;
    return canAfford(state, cents(cout)) ? null : reject('fonds-insuffisants', { besoin: cout });
  },
  apply(state) {
    spend(state, 'institution', cents(MUSEE.cost[state.institution.musee] ?? 0));
    state.institution.musee += 1;
  },
};

export const influence: ActionHandler<LabelState, InfluenceAction, LabelSignal> = {
  validate(state, action) {
    if (!debloque(state)) return reject('palier-insuffisant');
    const regle = INFLUENCE.rules[action.regle] as { cost: number } | undefined;
    if (!regle) return reject('regle-inconnue');
    return state.institution.influence >= regle.cost
      ? null
      : reject('influence-insuffisante', { besoin: regle.cost });
  },
  apply(state, action, ctx) {
    const inst = state.institution;
    inst.influence -= INFLUENCE.rules[action.regle].cost;
    if (action.regle === 'remuneration') {
      inst.regles = inst.regles.filter((r) => r.regle !== 'remuneration');
      inst.regles.push({
        regle: 'remuneration',
        fin: ctx.tick + INFLUENCE.rules.remuneration.weeks,
      });
    } else {
      const rng = ctx.rng('noms');
      const genres = genreKeys(state.marche);
      for (let i = 0; i < INFLUENCE.rules.vivier.talents; i += 1) {
        const a = generateArtist(
          rng,
          {
            id: newId(state),
            market: state.marche,
            cities: state.villes,
            takenNames: takenStageNames(state.artistes),
          },
          { level: rng.chance(0.3) ? 'confirme' : 'espoir', genre: rng.pick(genres) },
        );
        state.artistes.push(a);
      }
    }
    ctx.emit({ kind: 'influence-exercee', payload: { regle: action.regle } });
  },
};

/** Revenu annuel du musée (centimes) : niveau × base, plus un supplément par certification. */
export function revenuMusee(state: LabelState): number {
  if (state.institution.musee === 0) return 0;
  const certifs = state.projets.filter((p) => p.certification !== null).length;
  return Math.round(
    state.institution.musee * (MUSEE.revenueYear + certifs * MUSEE.perCertification),
  );
}

/** Phase hebdomadaire de l'institution : dons, influence, académie, musée, règles. */
export const institutionPhase: Phase<LabelState, LabelSignal> = {
  name: 'tournees',
  run(state, ctx) {
    if (!debloque(state)) return;
    const inst = state.institution;
    let gain = INFLUENCE.weekly + inst.musee * MUSEE.influencePerLevel;

    if (inst.don > 0 && canAfford(state, cents(inst.don))) {
      spend(state, 'institution', cents(inst.don));
      inst.donne += inst.don;
      gain += (inst.don / 100 / 1_000_000) * FONDATION.influencePerMillion;
    }
    inst.influence = clamp(inst.influence + gain, 0, INFLUENCE.max);

    const a = inst.academie;
    if (a && a.budget > 0 && canAfford(state, cents(a.budget)))
      spend(state, 'institution', cents(a.budget));
    if (a && ctx.tick >= a.prochaine) {
      a.prochaine = ctx.tick + ACADEMIE.cycle;
      const finance = a.budget >= ACADEMIE.budgetFloor && canAfford(state, cents(0));
      if (finance && rosterSize(state) < rosterCap(state)) diplomer(state, ctx, a);
    }

    inst.regles = inst.regles.filter((r) => r.fin >= ctx.tick);

    if (inst.musee > 0 && ctx.tick % 52 === MUSEE.week) {
      const revenu = revenuMusee(state);
      earn(state, 'autres', cents(revenu));
      ctx.emit({ kind: 'musee-recettes', payload: { revenu } });
    }
  },
};

function diplomer(
  state: LabelState,
  ctx: Parameters<typeof institutionPhase.run>[1],
  academie: Academie,
): void {
  const rng: Rng = ctx.rng('carrieres');
  const confirme = rng.chance(ACADEMIE.confirmedPerLevel * academie.niveau);
  const artiste = generateArtist(
    rng,
    {
      id: newId(state),
      market: state.marche,
      cities: state.villes,
      takenNames: takenStageNames(state.artistes),
    },
    { level: confirme ? 'confirme' : 'espoir', genre: academie.genre },
  );
  artiste.loyaute = Math.max(artiste.loyaute, ACADEMIE.minLoyalty);
  // Les légendes du genre transmettent leur métier aux diplômés.
  artiste.potentiel = Math.min(
    100,
    artiste.potentiel + legendesDuGenre(state, artiste.genre) * GENERATIONS.academyBonusPerLegend,
  );
  artiste.employeur = 'joueur';
  state.artistes.push(artiste);
  state.contrats.push({
    id: newId(state),
    artisteId: artiste.id,
    clauses: {
      avance: cents(0),
      royaltiesArtisteBps: RIVAL_INTERACTIONS.buyoutContract.royaltiesBps,
      dureeAnnees: ACADEMIE.contractYears,
      exclusivite: true,
      part360Bps: 0,
      clauseRachat: cents(0),
    },
    signeLe: ctx.tick,
    echeance: ctx.tick + ACADEMIE.contractYears * 52,
    recette360: 0,
  });
  academie.diplomes += 1;
  ctx.emit({ kind: 'artiste-signe', payload: { artisteId: artiste.id } });
  ctx.emit({ kind: 'diplome-academie', payload: { artisteId: artiste.id } });
}
