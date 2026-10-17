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
  /**
   * Suites de l'événement (chaînes). Pour un événement simple, programmées à sa survenue ; pour
   * une décision, ce sont celles du choix retenu (`ChoiceDef.followUps`) qui comptent.
   */
  readonly followUps?: readonly FollowUpDef[];
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
  /** Événements à programmer si ce choix est retenu. */
  readonly followUps?: readonly FollowUpDef[];
}

/**
 * Suite d'événement : « dans N semaines, avec une probabilité, tel événement ». C'est ce qui forme
 * une chaîne (le fan insulté devient une polémique qui devient une procédure).
 */
export interface FollowUpDef {
  readonly eventId: string;
  /** Semaines avant la suite (au moins 1). */
  readonly afterWeeks: number;
  /** Probabilité que la suite ait lieu, tirée au moment où elle est programmée (1 par défaut). */
  readonly chance?: number;
  /** Reprendre les variables de l'événement d'origine (nom de l'artiste, montant…). Vrai par défaut. */
  readonly inherit?: boolean;
}

/** Suite programmée, en attente de son échéance. */
export interface ScheduledFollowUp {
  dueTick: number;
  eventId: string;
  vars: Vars;
  parentInstanceId: number;
  /** Rang dans la chaîne : 1 pour la première suite, 2 pour la suivante… */
  step: number;
}

export type FlagValue = string | number | boolean;

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
  /** Rang de la décision dans une chaîne (0 si tirée au sort). */
  chainStep: number;
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
  /** Pour une suite d'événement : l'instance qui l'a provoquée. */
  parentInstanceId?: number;
  /** Rang dans la chaîne (absent pour un événement tiré au sort). */
  chainStep?: number;
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
  /** Suites d'événements programmées, triées par échéance. */
  followUps: ScheduledFollowUp[];
  /** Drapeaux d'histoire posés par les effets et lus par les conditions des événements. */
  flags: Record<string, FlagValue>;
}

export const emptyEventsState = (): EventsState => ({
  nextAllowed: {},
  count: {},
  history: [],
  nextInstanceId: 1,
  pending: [],
  scheduled: [],
  followUps: [],
  flags: {},
});

export const getFlag = (state: EventsState, key: string): FlagValue | undefined => state.flags[key];
export const hasFlag = (state: EventsState, key: string): boolean => state.flags[key] !== undefined;
export function setFlag(state: EventsState, key: string, value: FlagValue): void {
  state.flags[key] = value;
}
/** Ajoute à un drapeau numérique (0 s'il n'existe pas) et renvoie la nouvelle valeur. */
export function addToFlag(state: EventsState, key: string, delta: number): number {
  const current = state.flags[key];
  const next = (typeof current === 'number' ? current : 0) + delta;
  state.flags[key] = next;
  return next;
}

/** Programme une suite à la main (hors définition d'événement), en gardant la liste triée. */
export function scheduleFollowUp(state: EventsState, followUp: ScheduledFollowUp): void {
  state.followUps.push(followUp);
  state.followUps.sort((a, b) => a.dueTick - b.dueTick);
}
