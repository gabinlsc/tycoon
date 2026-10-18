import { type ActionHandler, type Phase, type Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import {
  STAFF,
  STAFF_ROLES,
  STAFF_TRAITS,
  UNLOCKS,
  type StaffRole,
  type StaffTrait,
} from './balance';
import { buildingsWeek, teamCapacity } from './buildings';
import { delegatedScouting } from './delegation';
import { spend } from './finance';
import { generateRealName } from './naming';
import type { LabelSignal } from './pipeline';
import { type LabelState, newId } from './state';
import { tierAtLeast } from './tiers';

export interface Membre {
  id: number;
  nom: string;
  role: StaffRole;
  niveau: number;
  /** Genre de spécialité (producteur, dénicheur…), ou `null`. */
  specialite: string | null;
  salaire: number;
  moral: number;
  trait: StaffTrait;
  experience: number;
}

/** Salaire hebdomadaire correspondant à un niveau. */
export const salaryFor = (level: number): number =>
  STAFF.salaryFloor + level * STAFF.salaryPerLevel;

/** Génère un candidat au marché de l'emploi. */
export function generateCandidate(state: LabelState, rng: Rng): Membre {
  const role = rng.pick(STAFF_ROLES);
  const niveau = rng.int(STAFF.level.min, STAFF.level.max);
  const name = generateRealName(rng);
  const genres = Object.keys(state.marche.genres).sort();
  return {
    id: newId(state),
    nom: `${name.prenom} ${name.nom}`,
    role,
    niveau,
    specialite: role === 'producteur' || role === 'ingenieur' ? rng.pick(genres) : null,
    salaire: salaryFor(niveau),
    moral: STAFF.moralTarget,
    trait: rng.pick(STAFF_TRAITS),
    experience: 0,
  };
}

/** Meilleur niveau de l'équipe dans un rôle (0 sans membre). */
export const roleLevel = (state: LabelState, role: StaffRole): number =>
  state.personnel.filter((m) => m.role === role).reduce((best, m) => Math.max(best, m.niveau), 0);

export interface HireAction extends Action {
  readonly type: 'embaucher';
  readonly membreId: number;
}
export interface FireAction extends Action {
  readonly type: 'licencier';
  readonly membreId: number;
}

export const hire: ActionHandler<LabelState, HireAction, LabelSignal> = {
  validate(state, action) {
    const candidate = state.candidats.find((c) => c.id === action.membreId);
    if (!candidate) return reject('candidat-introuvable');
    if (
      candidate.role === 'directeur-financier' &&
      !tierAtLeast(state, UNLOCKS['directeur-financier'])
    )
      return reject('palier-insuffisant');
    return state.personnel.length >= teamCapacity(state)
      ? reject('equipe-pleine', { max: teamCapacity(state) })
      : null;
  },
  apply(state, action) {
    const candidate = state.candidats.find((c) => c.id === action.membreId);
    if (!candidate) return;
    state.candidats = state.candidats.filter((c) => c.id !== action.membreId);
    state.personnel.push(candidate);
  },
};

export const fire: ActionHandler<LabelState, FireAction, LabelSignal> = {
  validate: (state, action) =>
    state.personnel.some((m) => m.id === action.membreId) ? null : reject('membre-introuvable'),
  apply(state, action) {
    state.personnel = state.personnel.filter((m) => m.id !== action.membreId);
  },
};

/** Phase « personnel » : salaires, moral, expérience, départs, renouvellement des candidats. */
export const staffPhase: Phase<LabelState, LabelSignal> = {
  name: 'personnel',
  run(state, ctx) {
    const rng = ctx.rng('personnel');
    const kept: Membre[] = [];
    for (const m of state.personnel) {
      spend(state, 'salaires', cents(m.salaire));
      m.moral = clamp(m.moral + (STAFF.moralTarget - m.moral) * STAFF.moralDrift, 0, 100);
      m.experience += STAFF.expPerWeek * STAFF.traitProgress[m.trait];
      if (m.experience >= STAFF.expPerLevel && m.niveau < 100) {
        m.experience -= STAFF.expPerLevel;
        m.niveau += 1;
        m.salaire = salaryFor(m.niveau);
      }
      if (
        m.trait === 'ambitieux' &&
        m.moral < STAFF.ambitiousLeaveMoral &&
        rng.chance(STAFF.ambitiousLeaveChance)
      ) {
        ctx.emit({ kind: 'depart-membre', payload: { membreId: m.id } });
        continue;
      }
      kept.push(m);
    }
    state.personnel = kept;
    buildingsWeek(state, ctx.tick, ctx.emit);
    delegatedScouting(state, ctx.rng('reperage'), ctx.tick, ctx.emit);
    if (ctx.tick % STAFF.refreshEvery === 0) {
      if (state.candidats.length >= STAFF.poolSize) state.candidats.shift();
      while (state.candidats.length < STAFF.poolSize)
        state.candidats.push(generateCandidate(state, rng));
    }
  },
};
