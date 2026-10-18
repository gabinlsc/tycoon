import { dateValide, graineDuDefi } from './defi-date';
import { defaultConfig, newGame, type LabelSession } from './game';
import type { GameConfig } from './config';
import type { LabelState } from './state';
import { labelScore } from './valuation';

/** Durée du défi du jour, en semaines de jeu. */
export const DEFI_SEMAINES = 52;

/** Réglages du défi : difficulté normale, la même pour tous, sinon les scores ne se comparent pas. */
export function configDefi(date: string): GameConfig {
  if (!dateValide(date)) throw new RangeError(`Date de défi invalide : ${date}`);
  return { ...defaultConfig('normal', 'defi'), defiDate: date };
}

/** Nouvelle partie du défi : la graine ne se choisit pas, elle découle de la date. */
export function nouveauDefi(date: string): LabelSession {
  return newGame(graineDuDefi(date), configDefi(date));
}

/** Vrai quand les 52 semaines sont jouées (le défi s'arrête là). */
export const defiTermine = (state: LabelState, tick: number): boolean =>
  state.config.mode === 'defi' && tick >= DEFI_SEMAINES;

/** Score du défi : valorisation finale du label en euros (0 en cas de faillite). */
export function scoreDefi(state: LabelState, tick: number): number {
  if (state.faillite.terminee) return 0;
  return Math.max(0, Math.round(labelScore(state, tick) / 100));
}

export interface ResultatDefi {
  date: string;
  score: number;
  semaines: number;
  faillite: boolean;
  /** Meilleur classement atteint par une sortie (0 = aucune), et disques décrochés. */
  certifications: number;
}

/** Résultat d'une partie de défi, jouée ou en cours. */
export function resultatDefi(state: LabelState, tick: number): ResultatDefi | null {
  if (state.config.mode !== 'defi' || !state.config.defiDate) return null;
  return {
    date: state.config.defiDate,
    score: scoreDefi(state, tick),
    semaines: Math.min(tick, DEFI_SEMAINES),
    faillite: state.faillite.terminee,
    certifications: state.projets.filter((p) => p.certification !== null).length,
  };
}

/** Texte court à partager : une ligne de titre, le score, quelques repères. Aucune donnée personnelle. */
export function texteResultat(r: ResultatDefi): string {
  const score = r.score.toLocaleString('fr-FR');
  const issue = r.faillite
    ? `Faillite à la semaine ${r.semaines}`
    : `${r.semaines}/${DEFI_SEMAINES} semaines`;
  const disques = r.certifications > 0 ? ` · ${r.certifications} certification(s)` : '';
  return `Label Tycoon · Défi du ${r.date}\nScore : ${score} €\n${issue}${disques}`;
}
