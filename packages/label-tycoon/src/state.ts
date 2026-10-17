import type { Cents, EventsState } from '@tycoon/core';
import type { TierId } from './balance';
import type { Artist } from './artists';
import type { FinanceState } from './finance';
import type { Contrat } from './contracts';
import type { Denicheur, Prospect } from './scouting';
import type { GameConfig } from './config';
import type { MarketState } from './market';

/** Le label du joueur. */
export interface LabelData {
  nom: string;
  tier: TierId;
  /** Trésorerie en centimes (entier). Peut être négative : c'est la faillite qui menace. */
  tresorerie: Cents;
  /** Réputation (0-100). */
  reputation: number;
  /** Crédibilité du label dans chaque genre (0-100), par identifiant de genre. */
  credibilite: Record<string, number>;
}

/**
 * État complet d'une partie. Entièrement sérialisable (JSON simple), sans fonction ni classe :
 * c'est ce qui permet le hash, la sauvegarde et le rejeu. Les collections (artistes, sorties,
 * contrats…) s'ajoutent ici au fil des fonctionnalités.
 */
export interface LabelState {
  config: GameConfig;
  label: LabelData;
  events: EventsState;
  marche: MarketState;
  finances: FinanceState;
  /** Villes fictives du monde, fixées au départ. */
  villes: string[];
  /** Tous les artistes du monde : libres, signés par le joueur ou par un rival (voir `employeur`). */
  artistes: Artist[];
  /** Talents que le joueur suit (repérage) : il n'en connaît que des fourchettes. */
  suivis: Prospect[];
  /** Dénicheurs employés : ils améliorent la précision des fourchettes et orientent le repérage. */
  denicheurs: Denicheur[];
  /** Contrats en cours : au plus un par artiste. */
  contrats: Contrat[];
  /** Prochain identifiant libre, partagé par toutes les entités (artistes, sorties, contrats…). */
  nextId: number;
}

/** Attribue un identifiant unique et fait avancer le compteur. */
export function newId(state: LabelState): number {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}
