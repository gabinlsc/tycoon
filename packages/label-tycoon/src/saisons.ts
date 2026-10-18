import type { LabelState } from './state';

/** Saisons de contenu (GDD, 14.5) : des périodes qui apportent leurs propres événements. */
export type SaisonId = 'festivals' | 'fetes' | 'rentree' | 'turbulences' | 'technologies';

export interface Saison {
  nom: string;
  description: string;
  /** Vrai quand la saison est en cours à cette semaine. */
  active: (d: LabelState, tick: number) => boolean;
}

const semaineDeLAnnee = (tick: number): number => tick % 52;

export const SAISONS: Readonly<Record<SaisonId, Saison>> = {
  festivals: {
    nom: 'Saison des festivals',
    description: 'L’été : scènes en plein air, cachets, foules et imprévus.',
    active: (_d, t) => semaineDeLAnnee(t) >= 20 && semaineDeLAnnee(t) <= 34,
  },
  rentree: {
    nom: 'Rentrée musicale',
    description: 'L’automne : sorties en rafale, salons professionnels, nouvelles signatures.',
    active: (_d, t) => semaineDeLAnnee(t) >= 35 && semaineDeLAnnee(t) <= 43,
  },
  fetes: {
    nom: 'Fêtes de fin d’année',
    description: 'L’hiver : coffrets, compilations, voeux et ventes de cadeaux.',
    active: (_d, t) => semaineDeLAnnee(t) >= 44,
  },
  turbulences: {
    nom: 'Turbulences économiques',
    description:
      'Après chaque changement d’ère, le marché traverse un an de turbulences : budgets serrés, rachats, faillites.',
    active: (d, t) => d.eres.programme.some((e, i) => i > 0 && t >= e.debut && t < e.debut + 52),
  },
  technologies: {
    nom: 'Révolution technologique',
    description:
      'Quand une ère bouscule l’industrie (plateforme dominante, vague virale), de nouveaux outils, fictifs, arrivent.',
    active: (d) => d.eres.courante === 'plateforme' || d.eres.courante === 'virale',
  },
};

export const SAISON_IDS = Object.keys(SAISONS) as SaisonId[];

export const saisonActive = (id: SaisonId, d: LabelState, tick: number): boolean =>
  SAISONS[id].active(d, tick);

/** Saisons en cours à cette semaine. */
export const saisonsActives = (d: LabelState, tick: number): SaisonId[] =>
  SAISON_IDS.filter((id) => saisonActive(id, d, tick));
