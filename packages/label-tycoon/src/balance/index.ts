/**
 * Point d'entrée de l'équilibrage. Une seule source de vérité : tout nombre qui pèse sur le jeu
 * est défini dans ce dossier, jamais dans le code des règles.
 */
export { DIFFICULTY_BOUNDS, DIFFICULTY_PRESETS } from './difficulty';
export { EVENTS } from './events';
export { MARKET, START_CREDIBILITY } from './market';
export { LABEL_NAME_MAX, SANDBOX_CASH, START } from './start';
export { type CertificationLevel, TIERS, type TierId, type TierRule } from './tiers';
