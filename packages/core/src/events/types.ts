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
  /** Effets immédiats, au moment où l'événement survient. Renvoie les lignes de conséquence à afficher. */
  readonly apply?: (data: G, ctx: EventContext, vars: Vars) => readonly Consequence[] | undefined;
  /**
   * Choix proposés au joueur. S'il y en a, l'événement devient une **décision** : elle reste en
   * attente jusqu'à la réponse du joueur ou jusqu'à son échéance.
   */
  readonly choices?: readonly ChoiceDef<G>[];
  /** Semaines laissées pour répondre (4 par défaut). */
  readonly deadline?: number;
  /** Choix appliqué automatiquement à l'échéance. Obligatoire s'il y a des choix. */
  readonly defaultChoice?: string;
}

/** Effet à retardement : lancé `afterWeeks` semaines après le choix, par clé de registre. */
export interface DelayedEffect {
  readonly afterWeeks: number;
  /** Clé d'un effet déclaré dans `delayedEffects` du moteur (l'état ne stocke que des clés). */
  readonly effect: string;
}

export interface ChoiceDef<G> {
  readonly id: string;
  /** Disponibilité du choix (par exemple : assez de trésorerie). Absent = toujours disponible. */
  readonly when?: (data: G, vars: Vars, tick: number) => boolean;
  readonly apply?: (data: G, ctx: EventContext, vars: Vars) => readonly Consequence[] | undefined;
  readonly delayed?: readonly DelayedEffect[];
}

export type DelayedEffectFn<G> = (
  data: G,
  ctx: EventContext,
  vars: Vars,
) => readonly Consequence[] | undefined;

/** Décision en attente de réponse. */
export interface PendingEvent {
  instanceId: number;
  eventId: string;
  createdTick: number;
  /** Première semaine où le choix par défaut s'applique si le joueur n'a pas répondu. */
  deadlineTick: number;
  vars: Vars;
}

/** Effet différé programmé, en attente de son échéance. */
export interface ScheduledEffect {
  dueTick: number;
  effect: string;
  vars: Vars;
  instanceId: number;
  eventId: string;
}

/** Ce qui s'est passé quand une décision a été tranchée. */
export interface Outcome {
  choiceId: string;
  tick: number;
  /** Vrai si le choix a été appliqué par défaut faute de réponse. */
  auto: boolean;
  consequences: readonly Consequence[];
}

export interface DelayedResult {
  tick: number;
  effect: string;
  consequences: readonly Consequence[];
}

/** Trace d'un événement survenu, conservée dans l'état (nombre borné). */
export interface FiredEvent {
  instanceId: number;
  eventId: string;
  tick: number;
  vars: Vars;
  consequences: readonly Consequence[];
  /** Présent une fois la décision tranchée. */
  outcome?: Outcome;
  /** Conséquences différées déjà survenues. */
  delayedResults?: DelayedResult[];
}

/** État du moteur d'événements, à inclure dans les données du jeu. Entièrement sérialisable. */
export interface EventsState {
  /** Pour chaque événement, première semaine où il pourra se reproduire. */
  nextAllowed: Record<string, number>;
  /** Nombre de survenues par événement. */
  count: Record<string, number>;
  history: FiredEvent[];
  nextInstanceId: number;
  pending: PendingEvent[];
  scheduled: ScheduledEffect[];
}

export const emptyEventsState = (): EventsState => ({
  nextAllowed: {},
  count: {},
  history: [],
  nextInstanceId: 1,
  pending: [],
  scheduled: [],
});
