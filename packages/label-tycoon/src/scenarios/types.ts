import type { Cents, Rng } from '@tycoon/core';
import type { CertificationLevel, TierId } from '../balance';
import type { DifficultySettings } from '../config';
import type { LabelState } from '../state';

/** Une condition de victoire, exprimée en données (donc lisible, testable et affichable). */
export type Condition =
  | { type: 'tresorerie'; min: Cents }
  | { type: 'valorisation'; min: Cents }
  | { type: 'palier'; palier: TierId }
  | { type: 'certification'; niveau: CertificationLevel }
  | { type: 'classement'; rang: number }
  | { type: 'credibilite'; genre: string; min: number }
  | { type: 'sorties'; min: number }
  | { type: 'signatures'; min: number }
  | { type: 'retours'; min: number }
  | { type: 'equipe'; min: number }
  /** L'artiste désigné par le scénario (`cible`) a retrouvé hype et public. */
  | { type: 'artiste-cible'; hype: number; fans: number }
  /** Valeur de l'effectif maximal : vrai tant que le roster ne dépasse pas ce nombre. */
  | { type: 'roster-max'; max: number }
  /** Tenir jusqu'à la limite de temps sans faire faillite. */
  | { type: 'survie' };

export interface ScenarioDef {
  id: string;
  titre: string;
  description: string;
  /** Graine fixe : tous les joueurs partent du même monde. */
  graine: string;
  /** Durée en semaines : à cette échéance, le scénario est perdu s'il n'est pas réussi. */
  limiteSemaines: number;
  /** Réglages de difficulté propres au scénario (sinon le niveau normal). */
  difficulte?: Partial<DifficultySettings>;
  /** Toutes ces conditions doivent être réunies pour gagner. */
  objectifs: readonly Condition[];
  /** Règles du scénario : si l'une d'elles est brisée, c'est perdu. */
  regles?: readonly Condition[];
  /** Conditions initiales : modifie l'état de départ (trésorerie, artistes, équipe…). */
  depart?: (state: LabelState, rng: Rng) => void;
}

export type StatutScenario = 'en-cours' | 'reussi' | 'echec';

/** État du scénario dans la partie (sérialisable : seul l'identifiant renvoie à la définition). */
export interface ScenarioState {
  id: string;
  limite: number;
  statut: StatutScenario;
  /** Semaine de fin, une fois le scénario terminé. */
  fin: number | null;
  score: number | null;
  /** Artiste mis en avant par le scénario (légende à relancer…), ou `null`. */
  cible: number | null;
  /** Raison d'un échec : `faillite`, `temps` ou `regle` (une règle du scénario a été brisée). */
  raison: 'faillite' | 'temps' | 'regle' | null;
}
