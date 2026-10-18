import { type JournalEntry, ReplayError } from '@tycoon/core';
import type { LabelAction } from './actions';
import { DEFI_SEMAINES, configDefi, scoreDefi } from './defi';
import { graineDuDefi, identifiantDefiValide } from './defi-date';
import { initialState, labelGame, type LabelSession } from './game';

/** Version du contrat d'échange avec le serveur de défis. */
export const VERSION_CONTRAT_DEFI = 1;

/** Plafond d'actions acceptées dans un journal : une partie normale en compte quelques centaines. */
export const JOURNAL_MAX = 5000;

/**
 * Ce que le client envoie au serveur : le journal des actions acceptées, avec la semaine où chacune
 * a été jouée, et le score qu'il annonce. Le serveur ne croit jamais le score : il rejoue.
 */
export interface SoumissionDefi {
  version: typeof VERSION_CONTRAT_DEFI;
  /** Date du défi (AAAA-MM-JJ, UTC) : elle détermine la graine et les réglages. */
  date: string;
  /** Semaines jouées (le défi en compte 52). */
  semaines: number;
  /** Score annoncé par le client, en euros. */
  scoreAnnonce: number;
  /** Pseudo affiché dans le classement du jour (facultatif). */
  pseudo?: string;
  journal: JournalEntry<LabelAction>[];
}

export type CodeRefus =
  | 'format'
  | 'version'
  | 'date'
  | 'semaines'
  | 'journal-trop-long'
  | 'journal-invalide'
  | 'action-refusee'
  | 'score-different';

/** Réponse du serveur : le score recalculé par rejeu, ou la raison du refus. */
export type ReponseValidation =
  | { statut: 'valide'; date: string; semaines: number; score: number }
  | { statut: 'refuse'; code: CodeRefus; message: string; scoreRecalcule?: number };

const refus = (code: CodeRefus, message: string, scoreRecalcule?: number): ReponseValidation =>
  scoreRecalcule === undefined
    ? { statut: 'refuse', code, message }
    : { statut: 'refuse', code, message, scoreRecalcule };

const estObjet = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Journal d'une partie de défi terminée, prêt à être envoyé. `null` si la partie n'est pas un défi fini. */
export function soumissionDe(session: LabelSession, pseudo?: string): SoumissionDefi | null {
  const { tick, data } = session.engine;
  if (data.config.mode !== 'defi' || !data.config.defiDate || tick < DEFI_SEMAINES) return null;
  return {
    version: VERSION_CONTRAT_DEFI,
    date: data.config.defiDate,
    semaines: DEFI_SEMAINES,
    scoreAnnonce: scoreDefi(data, tick),
    ...(pseudo ? { pseudo } : {}),
    journal: session.journal.map((e) => ({ tick: e.tick, action: e.action })),
  };
}

/**
 * Validation côté serveur : contrôle la forme, rejoue la partie depuis la graine du jour avec le
 * journal, et compare le score recalculé au score annoncé. Ne lève jamais d'exception.
 */
export function validerSoumission(brut: unknown): ReponseValidation {
  if (!estObjet(brut)) return refus('format', 'La soumission doit être un objet JSON.');
  if (brut['version'] !== VERSION_CONTRAT_DEFI)
    return refus('version', `Version du contrat non prise en charge : ${String(brut['version'])}.`);
  const { date, semaines, scoreAnnonce, journal } = brut;
  if (typeof date !== 'string' || !identifiantDefiValide(date))
    return refus('date', 'Identifiant de défi invalide (AAAA-MM-JJ ou AAAA-Snn attendu).');
  if (semaines !== DEFI_SEMAINES)
    return refus('semaines', `Un défi compte exactement ${DEFI_SEMAINES} semaines.`);
  if (typeof scoreAnnonce !== 'number' || !Number.isFinite(scoreAnnonce))
    return refus('format', 'Le score annoncé doit être un nombre.');
  if (!Array.isArray(journal)) return refus('format', 'Le journal doit être une liste.');
  if (journal.length > JOURNAL_MAX)
    return refus('journal-trop-long', `Journal trop long (${JOURNAL_MAX} actions au maximum).`);
  for (const [i, entree] of journal.entries()) {
    const ok =
      estObjet(entree) &&
      Number.isInteger(entree['tick']) &&
      (entree['tick'] as number) >= 0 &&
      estObjet(entree['action']) &&
      typeof entree['action']['type'] === 'string';
    if (!ok) return refus('journal-invalide', `L'entrée ${i} du journal est mal formée.`);
  }
  const entrees = journal as JournalEntry<LabelAction>[];
  const graine = graineDuDefi(date);
  try {
    const session = labelGame.replay(
      graine,
      initialState(graine, configDefi(date)),
      entrees,
      DEFI_SEMAINES,
    );
    const score = scoreDefi(session.engine.data, session.engine.tick);
    if (score !== scoreAnnonce)
      return refus(
        'score-different',
        `Le rejeu donne ${score} € et non ${scoreAnnonce} € : score refusé.`,
        score,
      );
    return { statut: 'valide', date, semaines: DEFI_SEMAINES, score };
  } catch (e) {
    if (e instanceof ReplayError)
      return refus('action-refusee', `Rejeu impossible : ${e.message}.`);
    return refus('journal-invalide', 'Le journal n’a pas pu être rejoué.');
  }
}
