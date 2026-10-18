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
export { type AuctionAction, type Rival, generateRival, generateRivals, rivalBid } from './auction';
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
export { type SortieRivale, announcedReleases, collisionFactor } from './calendar';
export { rivalIncome, rivalsPhase, rosterOf, signingUtility } from './rival-ai';
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
export {
  type Prevision,
  type StudyAction,
  analystLevel,
  expectedPopularity,
  forecastError,
} from './forecast';
export {
  type FireAction,
  type HireAction,
  type Membre,
  fire as fireStaff,
  generateCandidate,
  hire as hireStaff,
  roleLevel,
  salaryFor,
  staffPhase,
} from './staff';
export {
  type Cadre,
  type ConfigureAction,
  type DelegationDomain,
  type Rapport,
  chooseSource,
  defaultCadre,
  delegatedScouting,
} from './delegation';
export {
  type BatimentsState,
  type BuildAction,
  buildingLevel,
  buildingsWeek,
  initialBuildings,
  productionCapacity,
  rehearsalRecovery,
  studioCap,
  teamCapacity,
} from './buildings';
export {
  type Commande,
  type PressAction,
  physicalWeek,
  pressingWeeks,
  stockOf,
  unitCost,
} from './pressing';
export { livePhase } from './live-phase';
export { type Concert, type ConcertAction, concertsWeek, fillRate } from './concerts';
export { type TourAction, type Tournee, afterTourDate, launchTour, venueCost } from './tours';
export { type ApplyFestivalAction, type Festival, festivalOffer, festivalsWeek } from './festivals';
export { type OffreSynchro, type SyncAnswerAction, answerSync, syncOffersWeek } from './sync';
export { type Source360, liveShare } from './contracts';
export {
  type BorrowAction,
  type Credit,
  type Pret,
  type RepayAction,
  borrow,
  loanCap,
  loanRate,
  loansWeek,
  outstanding,
  repay,
} from './loans';
export { ledgerPhase } from './ledger-phase';
export {
  type InvestorAnswerAction,
  type Investisseur,
  type OffreInvestisseur,
  answerInvestor,
  investorOffersWeek,
  investorShareBps,
  investorsWeek,
} from './investors';
export {
  type Faillite,
  type SellContractAction,
  bankruptcyWeek,
  contractPrice,
  isBankrupt,
  sellContract,
  weeksLeft,
} from './bankruptcy';
export {
  type ChooseTaxAction,
  type Fiscalite,
  chooseTax,
  initialTax,
  taxDue,
  taxWeek,
} from './tax';
export {
  type Mentorat,
  type MentorAction,
  type Relation,
  type RelationKind,
  kindOf,
  mentor as mentorAction,
  relationOf,
  relationsWeek,
} from './relations';
export { nextTier, tierAtLeast, tierRank, tiersPhase } from './tiers';
export { contractsValue, discount, labelScore, releaseValue, valuation } from './valuation';
export {
  type BuyRivalArtistAction,
  type BuyoutAnswerAction,
  type OffreRachat,
  answerBuyout,
  buyRivalArtist,
  buyoutAsk,
  buyoutOffer,
  rivalInteractions,
} from './rival-interactions';
export {
  BOTS,
  BOT_STRATEGIES,
  type Bot,
  type BotContext,
  type BotRun,
  type BotStrategy,
  runBot,
} from './bots';
export {
  type GameResult,
  type SimOptions,
  type StrategySummary,
  renderReport,
  simulate,
  simulateGame,
  summarize,
} from './sim-balance';
export { EVENT_TEXTS, type EventText, describeEvent, fillTemplate } from './strings';
export { LABEL_EVENTS } from './content/events';
export { mitigated } from './content/events/helpers';
export { legalCost } from './content/events/helpers';
export {
  CEREMONY_CATEGORIES,
  type Candidat,
  type CategorieCeremonie,
  type Ceremonie,
  type CeremonyCategory,
  buildNominations,
  ceremonyWeek,
  drawWinner,
} from './ceremonies';
export { FIL_LIMIT, type Actu, composeActu, filPhase, filVars } from './fil';
export { FIL_TEMPLATES, type FilTemplate } from './strings';
export {
  type LigneRapport,
  type RapportMensuel,
  buildMonthlyReport,
  causesOfRelease,
  monthlyPhase,
} from './monthly';
