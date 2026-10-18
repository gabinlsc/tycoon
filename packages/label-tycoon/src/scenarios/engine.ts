import { type Phase, Rng, cents } from '@tycoon/core';
import { generateArtist, takenStageNames } from '../artists';
import { familyValue } from '../achievements';
import type { TalentLevel } from '../balance/artists';
import { bestCertification } from '../charts';
import { type Clauses, concludeSigning } from '../contracts';
import type { LabelSignal } from '../pipeline';
import { type LabelState, newId } from '../state';
import { tierRank } from '../tiers';
import { labelScore } from '../valuation';
import { SCENARIOS } from './catalogue';
import type { Condition, ScenarioDef, ScenarioState } from './types';

const CERT_RANK = { or: 1, platine: 2, diamant: 3 } as const;

export const findScenario = (id: string): ScenarioDef | undefined => SCENARIOS[id];

/** Vrai quand la condition est réunie à la semaine `tick`. */
export function conditionMet(state: LabelState, tick: number, c: Condition, limite = 0): boolean {
  switch (c.type) {
    case 'tresorerie':
      return state.label.tresorerie >= c.min;
    case 'valorisation':
      return labelScore(state, tick) >= c.min;
    case 'palier':
      return tierRank(state.label.tier) >= tierRank(c.palier);
    case 'certification': {
      const best = bestCertification(state);
      return best !== null && CERT_RANK[best] >= CERT_RANK[c.niveau];
    }
    case 'classement':
      return familyValue(state, 'classement', tick) <= c.rang;
    case 'credibilite':
      return (state.label.credibilite[c.genre] ?? 0) >= c.min;
    case 'sorties':
      return familyValue(state, 'sorties', tick) >= c.min;
    case 'signatures':
      return familyValue(state, 'signatures', tick) >= c.min;
    case 'retours':
      return familyValue(state, 'retours', tick) >= c.min;
    case 'equipe':
      return state.personnel.length >= c.min;
    case 'survie':
      // `tick` est la semaine qui vient d'être jouée : la semaine `limite - 1` est la dernière.
      return tick + 1 >= limite && !state.faillite.terminee;
  }
}

/** Score d'un scénario réussi : base, bonus de rapidité et valorisation finale (en milliers d'euros). */
export function scenarioScore(state: LabelState, tick: number, limite: number): number {
  const rapidite = Math.max(0, limite - tick) * 10;
  const valeur = Math.max(0, Math.round(labelScore(state, tick) / 100 / 1000));
  return 1000 + rapidite + valeur;
}

/**
 * Évalue le scénario en cours : victoire dès que toutes les conditions sont réunies, défaite par
 * faillite ou à l'échéance. Une fois terminé, le statut ne change plus (la partie peut continuer).
 */
export const scenarioPhase: Phase<LabelState, LabelSignal> = {
  name: 'paliers',
  run(state, ctx) {
    const s = state.scenario;
    if (!s || s.statut !== 'en-cours') return;
    const def = findScenario(s.id);
    if (!def) return;
    if (state.faillite.terminee) {
      Object.assign(s, { statut: 'echec', fin: ctx.tick, raison: 'faillite' });
      ctx.emit({ kind: 'scenario-echec', payload: { id: s.id }, interrupt: true } as LabelSignal);
      return;
    }
    if (def.objectifs.every((c) => conditionMet(state, ctx.tick, c, s.limite))) {
      Object.assign(s, {
        statut: 'reussi',
        fin: ctx.tick,
        score: scenarioScore(state, ctx.tick, s.limite),
      });
      ctx.emit({ kind: 'scenario-reussi', payload: { id: s.id }, interrupt: true } as LabelSignal);
      return;
    }
    if (ctx.tick + 1 >= s.limite) {
      Object.assign(s, { statut: 'echec', fin: ctx.tick, raison: 'temps' });
      ctx.emit({ kind: 'scenario-echec', payload: { id: s.id }, interrupt: true } as LabelSignal);
    }
  },
};

/** État initial du suivi de scénario. */
export const initialScenario = (def: ScenarioDef): ScenarioState => ({
  id: def.id,
  limite: def.limiteSemaines,
  statut: 'en-cours',
  fin: null,
  score: null,
  raison: null,
});

const CLAUSES_DEPART: Clauses = {
  avance: cents(0),
  royaltiesArtisteBps: 2500,
  dureeAnnees: 3,
  exclusivite: true,
  part360Bps: 0,
  clauseRachat: cents(0),
};

/**
 * Aide pour les conditions initiales : crée un artiste et le signe pour le joueur, sans avance. Tout
 * le hasard vient du `Rng` fourni, donc la même graine donne le même artiste.
 */
export function signerArtisteDeDepart(
  state: LabelState,
  rng: Rng,
  options: { level: TalentLevel; genre?: string; dureeAnnees?: number },
): number {
  const artist = generateArtist(
    rng,
    {
      id: newId(state),
      market: state.marche,
      cities: state.villes,
      takenNames: takenStageNames(state.artistes),
    },
    options.genre ? { level: options.level, genre: options.genre } : { level: options.level },
  );
  state.artistes.push(artist);
  concludeSigning(
    state,
    artist.id,
    { ...CLAUSES_DEPART, dureeAnnees: options.dureeAnnees ?? CLAUSES_DEPART.dureeAnnees },
    0,
    () => undefined,
  );
  return artist.id;
}

/** Applique un scénario à une partie qui vient d'être créée. */
export function applyScenario(state: LabelState, def: ScenarioDef, seed: string): void {
  state.scenario = initialScenario(def);
  def.depart?.(state, Rng.fromSeed(`${seed}:scenario:${def.id}`));
}
