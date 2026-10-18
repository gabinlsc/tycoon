import {
  Rng,
  type Seed,
  type Session,
  createEventEngine,
  createGame,
  emptyEventsState,
  money,
} from '@tycoon/core';
import { type LabelAction, renameLabel } from './actions';
import { DIFFICULTY_BOUNDS, DIFFICULTY_PRESETS, EVENTS, SANDBOX_CASH, START } from './balance';
import type { DifficultyPreset, DifficultySettings, GameConfig, GameMode } from './config';
import { type LabelSignal, buildPipeline } from './pipeline';
import { artistsPhase } from './dynamics';
import { initialFinance } from './finance';
import { LABEL_EVENTS } from './content/events';
import { GENRE_IDS } from './content/genres';
import { initialCredibility, initialMarket, marketPhase } from './market';
import { breakContract, releaseArtist, renegotiate } from './contract-end';
import { chartsPhase, emptyCharts } from './charts';
import { monthlyPhase } from './monthly';
import { filPhase } from './fil';
import { ceremonyWeek } from './ceremonies';
import { tiersPhase } from './tiers';
import { mentor } from './relations';
import { chooseTax, initialTax } from './tax';
import { sellContract } from './bankruptcy';
import { answerInvestor } from './investors';
import { ledgerPhase } from './ledger-phase';
import { borrow, repay } from './loans';
import { answerSync } from './sync';
import { applyFestival } from './festivals';
import { launchTour } from './tours';
import { organiseConcert } from './concerts';
import { livePhase } from './live-phase';
import { press } from './pressing';
import { build, initialBuildings } from './buildings';
import { configureDelegation } from './delegation';
import { fire, hire, staffPhase } from './staff';
import { marketStudy } from './forecast';
import { answerBuyout, buyRivalArtist } from './rival-interactions';
import { rivalsPhase } from './rival-ai';
import { auction, generateRivals } from './auction';
import { sign } from './contracts';
import { launchProject, productionPhase, releaseProject, streamsPhase } from './production';
import { propose } from './negotiation';
import { dropProspect, fireScout, hireScout, scout, studioTrial } from './scouting';
import { generateWorld } from './world';
import type { LabelState } from './state';

/** Un flux aléatoire par système : ajouter un tirage dans l'un ne décale pas les autres. */
export const LABEL_STREAMS = [
  'marche',
  'reperage',
  'contrats',
  'production',
  'sorties',
  'evenements',
  'rivaux',
  'noms',
  'finances',
  'personnel',
  'tournees',
  'carrieres',
] as const;

export type LabelSession = Session<LabelState, LabelAction>;

/** Moteur d'événements du jeu. Le contenu (les événements eux-mêmes) s'ajoute dans `content/`. */
export const eventEngine = createEventEngine<LabelState>({
  events: LABEL_EVENTS,
  getState: (state) => state.events,
  stream: 'evenements',
  chance: EVENTS.chancePerWeek,
  maxPerTick: EVENTS.maxPerWeek,
  maxPending: EVENTS.maxPending,
  maxChainDepth: EVENTS.maxChainDepth,
  historyLimit: EVENTS.historyLimit,
  phaseNames: { due: 'echeances-evenements', draw: 'tirage-evenements' },
});

export const labelGame = createGame<LabelState, LabelAction, LabelSignal>({
  streams: LABEL_STREAMS,
  phases: buildPipeline({
    'echeances-evenements': eventEngine.duePhase,
    personnel: staffPhase,
    artistes: artistsPhase,
    marche: marketPhase,
    rivaux: rivalsPhase,
    production: productionPhase,
    streams: streamsPhase,
    classements: chartsPhase,
    tournees: livePhase,
    finances: ledgerPhase,
    fil: {
      name: 'fil',
      run(state, ctx) {
        filPhase.run(state, ctx);
        monthlyPhase.run(state, ctx);
      },
    },
    paliers: {
      name: 'paliers',
      run(state, ctx) {
        tiersPhase.run(state, ctx);
        ceremonyWeek(
          state,
          ctx.tick,
          ctx.rng('evenements'),
          (id, vars) => {
            eventEngine.fire(state, ctx, id, vars);
          },
          ctx.emit,
        );
      },
    },
    'tirage-evenements': eventEngine.phase,
  }),
  actions: {
    ...eventEngine.actionHandlers,
    'renommer-label': renameLabel,
    reperer: scout,
    signer: sign,
    'accepter-rachat': answerBuyout,
    'refuser-rachat': answerBuyout,
    'racheter-artiste': buyRivalArtist,
    parrainer: mentor,
    'choisir-fiscalite': chooseTax,
    'vendre-contrat': sellContract,
    'accepter-investisseur': answerInvestor,
    'refuser-investisseur': answerInvestor,
    emprunter: borrow,
    'rembourser-pret': repay,
    'accepter-synchro': answerSync,
    'refuser-synchro': answerSync,
    'candidater-festival': applyFestival,
    'lancer-tournee': launchTour,
    'organiser-concert': organiseConcert,
    presser: press,
    construire: build,
    'configurer-delegation': configureDelegation,
    embaucher: hire,
    licencier: fire,
    'etude-marche': marketStudy,
    'lancer-projet': launchProject,
    'sortir-projet': releaseProject,
    renegocier: renegotiate,
    'rompre-contrat': breakContract,
    'liberer-artiste': releaseArtist,
    encherir: auction,
    proposer: propose,
    'recruter-denicheur': hireScout,
    'renvoyer-denicheur': fireScout,
    'abandonner-suivi': dropProspect,
    'essai-studio': studioTrial,
  },
});

export function defaultConfig(
  preset: DifficultyPreset = 'normal',
  mode: GameMode = 'carriere',
): GameConfig {
  return { mode, difficulty: { ...DIFFICULTY_PRESETS[preset] } };
}

/** Message d'erreur si des réglages sortent des bornes, sinon `null`. */
export function validateConfig(config: GameConfig): string | null {
  for (const key of Object.keys(DIFFICULTY_BOUNDS) as Array<keyof DifficultySettings>) {
    const value = config.difficulty[key];
    const { min, max } = DIFFICULTY_BOUNDS[key];
    if (!Number.isFinite(value) || value < min || value > max) {
      return `Réglage « ${key} » hors bornes (${min} à ${max}) : ${String(value)}`;
    }
  }
  return null;
}

/** État initial d'une partie : réglages, monde déduit de la graine, aucun tirage de la simulation. */
export function initialState(seed: Seed, config: GameConfig): LabelState {
  const problem = validateConfig(config);
  if (problem) throw new RangeError(problem);
  const cash = config.sandbox
    ? SANDBOX_CASH
    : money.applyRate(START.cash, config.difficulty.startingCash);
  return {
    config: structuredConfig(config),
    label: {
      nom: START.defaultLabelName,
      tier: 'home-studio',
      tresorerie: cash,
      reputation: START.reputation,
      credibilite: initialCredibility(),
    },
    events: emptyEventsState(),
    marche: initialMarket(),
    finances: initialFinance(),
    villes: generateWorld(seed).villes,
    artistes: [],
    suivis: [],
    denicheurs: [],
    contrats: [],
    rivaux: generateRivals(
      Rng.fromSeed(`${seed}:rivaux`),
      GENRE_IDS,
      config.difficulty.rivalCashBonus,
    ),
    negociations: [],
    projets: [],
    sortiesRivales: [],
    classements: emptyCharts(),
    sousGenres: [],
    previsions: [],
    personnel: [],
    candidats: [],
    delegation: {},
    rapports: [],
    batiments: initialBuildings(),
    commandes: [],
    concerts: [],
    tournees: [],
    festivals: [],
    offresSynchro: [],
    prets: [],
    credit: { impayes: 0, rembourses: 0 },
    offresInvest: [],
    investisseurs: [],
    faillite: { semaines: 0, terminee: false },
    fiscalite: initialTax(),
    relations: [],
    mentorats: [],
    offresRachat: [],
    remplacements: [],
    ceremonie: null,
    fil: [],
    filMemoire: {},
    rapportsMensuels: [],
    nextId: 1,
  };
}

/** Copie des réglages sans référence partagée avec l'appelant. */
function structuredConfig(config: GameConfig): GameConfig {
  const copy: GameConfig = { mode: config.mode, difficulty: { ...config.difficulty } };
  if (config.scenarioId !== undefined) copy.scenarioId = config.scenarioId;
  if (config.sandbox !== undefined) copy.sandbox = config.sandbox;
  return copy;
}

/** Nouvelle partie. Même graine et mêmes réglages : même partie, au bit près. */
export function newGame(seed: Seed, config: GameConfig = defaultConfig()): LabelSession {
  return labelGame.newSession(seed, initialState(seed, config));
}
