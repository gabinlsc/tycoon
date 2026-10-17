import type { Phase, Signal } from '@tycoon/core';
import type { LabelState } from './state';

/**
 * Ordre d'un tick (une semaine), tel que décrit dans le GDD (section 4). Chaque système enregistre
 * sa phase sous l'un de ces noms ; `buildPipeline` les range dans cet ordre quel que soit l'ordre
 * dans lequel elles sont déclarées. L'ordre est une règle du jeu : le modifier change les résultats.
 */
export const PHASE_ORDER = [
  'echeances-evenements', // 1. effets différés, décisions expirées, suites programmées
  'marche', // 2. tendances de genre, sous-genres, ères
  'rivaux', // 3. décisions des rivaux
  'production', // 4. avancement des projets, retards, livraisons
  'sorties', // 5. sorties de la semaine (joueur, rivaux, bruit de marché)
  'streams', // 6. streams, viralité, fanbase, hype
  'classements', // 7. classements et certifications
  'tournees', // 8. concerts, tournées, merch, physique, synchro
  'artistes', // 9. compétences, moral, fatigue, carrière
  'personnel', // 10. moral, progression, départs, décisions déléguées
  'finances', // 11. revenus, dépenses, intérêts, entretien, faillite
  'tirage-evenements', // 12. tirage des événements
  'paliers', // 13. palier du label, objectifs, succès
  'fil', // 14. actus du fil et notifications
] as const;

export type PhaseName = (typeof PHASE_ORDER)[number];

export type LabelSignal = Signal;
export type LabelPhase = Phase<LabelState, LabelSignal>;

/**
 * Assemble les phases enregistrées dans l'ordre du jeu.
 * @throws RangeError si une phase porte un nom inconnu ou différent de sa clé.
 */
export function buildPipeline(registry: Partial<Record<PhaseName, LabelPhase>>): LabelPhase[] {
  const known = new Set<string>(PHASE_ORDER);
  for (const [key, phase] of Object.entries(registry)) {
    if (!known.has(key)) throw new RangeError(`Phase inconnue du pipeline : ${key}`);
    if (phase && phase.name !== key) {
      throw new RangeError(`La phase enregistrée sous « ${key} » s'appelle « ${phase.name} »`);
    }
  }
  return PHASE_ORDER.flatMap((name) => {
    const phase = registry[name];
    return phase ? [phase] : [];
  });
}
