/**
 * Point d'entrée de l'équilibrage. Une seule source de vérité : tout nombre qui pèse sur le jeu
 * est défini dans ce dossier, jamais dans le code des règles.
 */
export { DIFFICULTY_BOUNDS, DIFFICULTY_PRESETS } from './difficulty';
export { EVENTS } from './events';
export { MARKET, START_CREDIBILITY } from './market';
export { LABEL_NAME_MAX, SANDBOX_CASH, START } from './start';
export { type CertificationLevel, TIERS, type TierId, type TierRule } from './tiers';
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
export { WORLD } from './world';
export { FINANCE } from './finance';
export { DYNAMICS } from './dynamics';
export { COMEBACK, CULT, DECLINE, PROGRESSION } from './career';
export {
  RIVAL_SCOUTING,
  SCOUTING,
  SCOUTS,
  SOURCES,
  type ScoutSource,
  type SourceProfile,
} from './scouting';
