import type { Signal, TickContext } from '../sim';

/**
 * Moteur d'événements générique.
 *
 * Un événement est une **donnée typée** : un identifiant, une catégorie, un poids, des conditions
 * et des effets. Les textes affichés n'y figurent pas : l'interface les retrouve à partir de
 * l'identifiant et des variables (`vars`), pour garder toutes les chaînes centralisées.
 */

/** Variables d'un événement (noms, montants…), de la donnée simple pour rester sérialisable. */
export type Vars = Readonly<Record<string, string | number>>;

/**
 * Une ligne de conséquence, sans texte : `{ kind: 'tresorerie', params: { delta: -50000 } }`.
 * L'interface en fait une phrase. Elles sont conservées dans l'historique pour afficher clairement
 * « ce qui a changé » après un événement.
 */
export interface Consequence {
  kind: string;
  params?: Vars;
}

export type EventContext = TickContext<Signal>;

export interface EventDef<G> {
  readonly id: string;
  readonly category: string;
  /** Poids de tirage. Une fonction permet de l'adapter à l'état (0 = non éligible). */
  readonly weight: number | ((data: G, tick: number) => number);
  /** Nombre de semaines avant que cet événement puisse se reproduire. */
  readonly cooldown?: number;
  /** Se produit au plus une fois par partie. */
  readonly once?: boolean;
  /** Pas avant cette semaine (indice de semaine, 0 = première). */
  readonly minTick?: number;
  /** Condition de déclenchement, évaluée à chaque tirage. */
  readonly when?: (data: G, tick: number) => boolean;
  /**
   * Choisit les cibles et les variables (quel artiste, quel montant…) avec le générateur du jeu.
   * Renvoie `null` pour annuler (aucune cible éligible) : un autre événement sera alors tiré.
   * Ne doit pas modifier `data`.
   */
  readonly prepare?: (data: G, ctx: EventContext) => Vars | null;
  /** Effets immédiats. Renvoie les lignes de conséquence à afficher. */
  readonly apply?: (data: G, ctx: EventContext, vars: Vars) => readonly Consequence[] | undefined;
}

/** Trace d'un événement survenu, conservée dans l'état (nombre borné). */
export interface FiredEvent {
  instanceId: number;
  eventId: string;
  tick: number;
  vars: Vars;
  consequences: readonly Consequence[];
}

/** État du moteur d'événements, à inclure dans les données du jeu. Entièrement sérialisable. */
export interface EventsState {
  /** Pour chaque événement, première semaine où il pourra se reproduire. */
  nextAllowed: Record<string, number>;
  /** Nombre de survenues par événement. */
  count: Record<string, number>;
  history: FiredEvent[];
  nextInstanceId: number;
}

export const emptyEventsState = (): EventsState => ({
  nextAllowed: {},
  count: {},
  history: [],
  nextInstanceId: 1,
});
