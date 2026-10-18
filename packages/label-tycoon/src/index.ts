export { type LabelAction, type RenameLabelAction, renameLabel } from './actions';
export * from './balance';
export type { DifficultyPreset, DifficultySettings, GameConfig, GameMode } from './config';
export {
  LABEL_STREAMS,
  type LabelSession,
  defaultConfig,
  eventEngine,
  initialState,
  labelGame,
  newGame,
  validateConfig,
} from './game';
export {
  type LabelPhase,
  type LabelSignal,
  PHASE_ORDER,
  type PhaseName,
  buildPipeline,
} from './pipeline';
export { type LabelData, type LabelState, newId } from './state';
export { type Strings, describeRejection, fr, strings, termLabel } from './strings';
export {
  type Origin,
  type RealName,
  type StageStyle,
  generateCityName,
  generateLabelName,
  generateRealName,
  generateStageName,
  isExcluded,
  normalizeForCompare,
  pickOrigin,
  pickStyle,
  uniqueName,
} from './naming';
export {
  type BaseGenreId,
  GENRES,
  GENRE_IDS,
  type GenreDef,
  type GenreFamily,
  type VocalAxis,
} from './content/genres';
export {
  type GenreMarket,
  type MarketState,
  genreKeys,
  initialCredibility,
  type SousGenre,
  claimSubgenre,
  cyclicPopularity,
  subgenrePopularity,
  initialMarket,
  marketPhase,
  trendMultiplier,
} from './market';
export {
  type Artist,
  type CareerPhase,
  type GenerationContext,
  type GenerationOptions,
  careerPhaseFor,
  generateArtist,
  notoriety,
  takenStageNames,
} from './artists';
export { TRAITS, TRAIT_IDS, type TraitDef, type TraitId } from './content/traits';
export { type World, generateWorld } from './world';
export {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  REVENUE_CATEGORIES,
  type RevenueCategory,
} from './content/finance';
export {
  type FinanceState,
  type Ledger,
  type Report,
  aggregate,
  annualRevenue,
  canAfford,
  closeWeek,
  earn,
  financePhase,
  initialFinance,
  spend,
} from './finance';
export { artisticTalent } from './formulas';
export { type ArtistDelta, adjustArtist, artistsPhase, driftArtist } from './dynamics';
export {
  type ProgressionContext,
  progressionMultiplier,
  stepSkills,
  updatePhase,
  weeklyDecline,
  yearlyDeclineRoll,
} from './career';
export {
  HIDDEN_ATTRIBUTES,
  type Denicheur,
  type DropProspectAction,
  type FireScoutAction,
  type HireScoutAction,
  type Prospect,
  type Range,
  type ScoutAction,
  type ScoutedAttribute,
  type TrialAction,
  VISIBLE_ATTRIBUTES,
  findScout,
  knownRange,
  payScouts,
  rangeWidth,
  rivalsPoach,
  scoutLevelOf,
  scoutTalents,
} from './scouting';
export {
  type Clauses,
  type Contrat,
  type SignAction,
  type Utility,
  type UtilityTerm,
  clausesValid,
  fairAdvance,
  labelShare,
  utilityOf,
} from './contracts';
export {
  type Negociation,
  type ProposeAction,
  type Reaction,
  counterOffer,
  evaluateOffer,
  gaugeOf,
} from './negotiation';
export { type AuctionAction, type Rival, generateRivals, rivalBid } from './auction';
export {
  type BreakAction,
  type ReleaseAction,
  type RenegotiateAction,
  contractsWeek,
} from './contract-end';
export {
  type Producer,
  type QualityInputs,
  baseQuality,
  estimateQuality,
  producerFit,
  trackQuality,
} from './formulas/quality';
export {
  type LaunchAction,
  type Projet,
  type ProjectStatus,
  type ReleaseAction as ReleaseProjectAction,
  mixingQuality,
  productionPhase,
  projectCost,
} from './production';
export {
  cumulativeStreams,
  decayRate,
  firstWeekStreams,
  hitPotential,
  marketingFactor,
  weeklyStreams,
} from './formulas/streams';
export { streamsPhase } from './production';
export { fansGained, viralStep } from './viral';
export { type SortieRivale, announcedReleases, collisionFactor, rivalsPhase } from './calendar';
export {
  type ChartEntry,
  type ChartHistory,
  type ChartId,
  type ChartsState,
  chartOf,
  chartsPhase,
  marketNoise,
} from './charts';
export {
  bestCertification,
  certificationFor,
  certificationThreshold,
  certify,
  equivalentSales,
} from './charts';
