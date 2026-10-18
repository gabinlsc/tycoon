import { type ActionHandler, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { GENERATIONS, RELATIONS } from './balance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export type RelationKind = 'neutre' | 'rivalite' | 'amitie';

export interface Relation {
  /** Identifiants des deux artistes, `a` < `b`. */
  a: number;
  b: number;
  valeur: number;
  type: RelationKind;
}

export interface Mentorat {
  mentorId: number;
  protegeId: number;
  depuis: number;
}

/** Vrai pour un artiste retraité qui était chez le joueur : une légende du label. */
export const estLegende = (a: { employeur: string; retraite?: { chezJoueur: boolean } }): boolean =>
  a.employeur === 'retraite' && a.retraite?.chezJoueur === true;

export const kindOf = (value: number): RelationKind =>
  value <= RELATIONS.rivalryBelow
    ? 'rivalite'
    : value >= RELATIONS.friendshipAbove
      ? 'amitie'
      : 'neutre';

const pairKey = (x: number, y: number): [number, number] => (x < y ? [x, y] : [y, x]);

export function relationOf(state: LabelState, x: number, y: number): Relation | undefined {
  const [a, b] = pairKey(x, y);
  return state.relations.find((r) => r.a === a && r.b === b);
}

/** Fait évoluer les relations du roster (artistes du joueur) et leurs effets sur le moral. */
export function relationsWeek(
  state: LabelState,
  tick: number,
  emit: (s: LabelSignal) => void,
): void {
  const roster = state.artistes.filter((a) => a.employeur === 'joueur').sort((p, q) => p.id - q.id);
  // Index des relations existantes : une recherche linéaire par paire ferait grimper le coût au carré.
  const index = new Map<string, Relation>();
  for (const r of state.relations) index.set(`${r.a}:${r.b}`, r);
  for (let i = 0; i < roster.length; i += 1) {
    for (let j = i + 1; j < roster.length; j += 1) {
      const p = roster[i];
      const q = roster[j];
      if (!p || !q) continue;
      let rel = index.get(`${p.id}:${q.id}`);
      if (!rel) {
        rel = { a: p.id, b: q.id, valeur: 0, type: 'neutre' };
        state.relations.push(rel);
        index.set(`${p.id}:${q.id}`, rel);
      }
      const same = p.genre === q.genre;
      const ego = 1 + Math.max(p.ego, q.ego) / 100;
      const drift = same ? RELATIONS.sameGenreDrift * ego : RELATIONS.otherGenreDrift;
      rel.valeur = clamp(rel.valeur + drift, -100, 100);
      const previous = rel.type;
      rel.type = kindOf(rel.valeur);
      if (rel.type !== previous && rel.type !== 'neutre')
        emit({
          kind: rel.type === 'rivalite' ? 'rivalite' : 'amitie',
          payload: { a: p.id, b: q.id },
        });
      if (rel.type === 'amitie') {
        p.moral = clamp(p.moral + RELATIONS.friendMoral, 0, 100);
        q.moral = clamp(q.moral + RELATIONS.friendMoral, 0, 100);
      } else if (rel.type === 'rivalite') {
        const lesser = p.fanbase <= q.fanbase ? p : q;
        lesser.moral = clamp(lesser.moral + RELATIONS.rivalMoral, 0, 100);
      }
    }
  }
  mentorshipsWeek(state, tick, emit);
}

const SKILLS = ['plume', 'flow', 'voix', 'charisme', 'scene'] as const;

function mentorshipsWeek(state: LabelState, tick: number, emit: (s: LabelSignal) => void): void {
  const kept: Mentorat[] = [];
  for (const m of state.mentorats) {
    const mentor = state.artistes.find((a) => a.id === m.mentorId);
    const protege = state.artistes.find((a) => a.id === m.protegeId);
    const over =
      !mentor ||
      !protege ||
      !(mentor.employeur === 'joueur' || estLegende(mentor)) ||
      protege.employeur !== 'joueur' ||
      tick - m.depuis >= RELATIONS.mentorWeeks ||
      protege.phase === 'pic';
    if (over) {
      emit({ kind: 'mentorat-termine', payload: { mentorId: m.mentorId, protegeId: m.protegeId } });
      continue;
    }
    // Une légende du label transmet bien davantage qu'un mentor encore en activité.
    const facteur = estLegende(mentor) ? GENERATIONS.legendMentorFactor : 1;
    for (const skill of SKILLS)
      protege[skill] = Math.min(
        protege.potentiel,
        protege[skill] + RELATIONS.mentorSkillBonus * facteur,
      );
    if (!estLegende(mentor))
      mentor.loyaute = Math.min(100, mentor.loyaute + RELATIONS.mentorLoyaltyBonus);
    kept.push(m);
  }
  state.mentorats = kept;
}

export interface MentorAction extends Action {
  readonly type: 'parrainer';
  readonly mentorId: number;
  readonly protegeId: number;
}

export const mentor: ActionHandler<LabelState, MentorAction, LabelSignal> = {
  validate(state, action) {
    const m = state.artistes.find((a) => a.id === action.mentorId);
    const p = state.artistes.find((a) => a.id === action.protegeId);
    if (!m || !p) return reject('artiste-introuvable');
    if (p.employeur !== 'joueur' || !(m.employeur === 'joueur' || estLegende(m)))
      return reject('artiste-non-signe');
    if (m.id === p.id || m.genre !== p.genre) return reject('mentorat-invalide');
    if (!estLegende(m) && m.phase !== 'pic' && m.phase !== 'plateau')
      return reject('mentorat-invalide');
    if (p.phase !== 'emergent' && p.phase !== 'montee') return reject('mentorat-invalide');
    if (state.mentorats.some((x) => x.protegeId === p.id)) return reject('deja-parraine');
    return state.mentorats.length >= RELATIONS.maxMentorships
      ? reject('trop-de-mentorats', { max: RELATIONS.maxMentorships })
      : null;
  },
  apply(state, action, ctx) {
    state.mentorats.push({
      mentorId: action.mentorId,
      protegeId: action.protegeId,
      depuis: ctx.tick,
    });
  },
};
