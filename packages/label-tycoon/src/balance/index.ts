/**
 * Point d'entrée de l'équilibrage. Une seule source de vérité : tout nombre qui pèse sur le jeu
 * est défini dans ce dossier, jamais dans le code des règles.
 */
export { DIFFICULTY_BOUNDS, DIFFICULTY_PRESETS, EVENT_RATE_BOUNDS } from './difficulty';
export { EVENTS } from './events';
export { CREDIBILITY, INTEL, MARKET, START_CREDIBILITY, SUBGENRES, TRENDS } from './market';
export { LABEL_NAME_MAX, SANDBOX_CASH, START } from './start';
export {
  type CertificationLevel,
  ROSTER_CAP,
  TIERS,
  UNLOCKS,
  type TierId,
  type TierRule,
} from './tiers';
export {
  DYNAMIC_START,
  EGO_PER_NOTORIETY_10,
  HIDDEN,
  LEVELS,
  LEVEL_WEIGHTS,
  type LevelProfile,
  NOTORIETY_MAX_FANS,
  PEAK_AGE,
  PEAK_AGE_BOUNDS,
  PEAK_AGE_SD,
  SECONDARY_GENRE,
  STREET_CRED_MEAN,
  STREET_CRED_SD,
  TRAIT_COUNT_WEIGHTS,
  type TalentLevel,
} from './artists';
export { CONTRACTS, CONTRACT_END, NEGOTIATION } from './contracts';
export { WORLD } from './world';
export { BANKRUPTCY, FINANCE, INVESTORS, LOANS, TAX, VALUATION, type TaxStrategy } from './finance';
export { DYNAMICS, RELATIONS } from './dynamics';
export { COMEBACK, CULT, DECLINE, PROGRESSION } from './career';
export {
  RIVAL_SCOUTING,
  SCOUTING,
  SCOUTS,
  SOURCES,
  type ScoutSource,
  type SourceProfile,
} from './scouting';
export {
  PERSONALITIES,
  PERSONALITY_IDS,
  RIVALS,
  RIVAL_AI,
  RIVAL_INTERACTIONS,
  RIVAL_RELEASES,
  type PersonalityProfile,
  type RivalPersonality,
  type RivalStyle,
} from './rivals';
export { QUALITY } from './quality';
export {
  CLIPS,
  PRODUCTION,
  RELEASE_TYPES,
  type ClipSize,
  type ReleaseProfile,
  type ReleaseType,
} from './production';
export { STREAMS, VIRALITY } from './streams';
export { CEREMONY, CERTIFICATIONS, CHARTS } from './charts';
export { ACHIEVEMENT_THRESHOLDS, OBJECTIVES, type AchievementFamily } from './achievements';
export {
  DELEGATION,
  STAFF,
  STAFF_ROLES,
  STAFF_TRAITS,
  type StaffRole,
  type StaffTrait,
} from './staff';
export {
  BUILDINGS,
  BUILDING_EFFECTS,
  BUILDING_IDS,
  type BuildingId,
  type BuildingRule,
} from './buildings';
export { FORMATS, PRESSING, type PhysicalFormat } from './pressing';
export {
  CONCERTS,
  FESTIVALS,
  SYNC,
  type SyncKind,
  TOUR,
  VENUES,
  VENUE_IDS,
  type Venue,
  type VenueId,
} from './concerts';
export { CADRE_STYLES, GROUPE, type CadreStyle } from './groupe';
