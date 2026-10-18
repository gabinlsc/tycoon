import { type Rejection, type Seed, reject } from '@tycoon/core';
import type { LabelAction } from './actions';
import { estimateRelease } from './estimate';
import type { ClipSize, ReleaseType } from './balance';
import { type Clauses, clausesValid, prestigeFor, utilityOf } from './contracts';
import { type Reaction, evaluateOffer, gaugeOf } from './negotiation';
import type { GameConfig } from './config';
import { DEFI_SEMAINES, defiTermine } from './defi';
import { type SoumissionDefi, soumissionDe } from './defi-validation';
import { type LabelSession, completerEtat, eventEngine, labelGame, newGame } from './game';
import { describeRejection } from './strings';
import type { LabelSignal } from './pipeline';
import { type VueJeu, type ViewHooks, buildView } from './view';

/** Commandes envoyées au moteur (depuis l'interface, via le worker ou directement dans les tests). */
export type CommandeJeu =
  | { type: 'nouvelle-partie'; graine: Seed; config?: GameConfig }
  | { type: 'charger'; sauvegarde: string }
  | { type: 'sauvegarder' }
  | { type: 'avancer'; semaines: number; arretSurSignal?: boolean }
  | { type: 'action'; action: LabelAction }
  | { type: 'evaluer-offre'; artisteId: number; clauses: Clauses }
  | {
      type: 'estimer-sortie';
      artisteId: number;
      sortie: ReleaseType;
      clip: ClipSize;
      studio: number;
      producteur: number;
      mixage: number;
    }
  | { type: 'vue' }
  /** Prépare l'envoi du défi terminé au serveur (journal et score annoncé). */
  | { type: 'soumettre-defi'; pseudo?: string };

/** Signal simplifié pour l'interface. */
export interface SignalVue {
  kind: string;
  interrupt: boolean;
  payload: Readonly<Record<string, unknown>>;
}

export type ReponseJeu =
  | { type: 'vue'; vue: VueJeu; signaux: SignalVue[]; semainesJouees: number; interrompu: boolean }
  | { type: 'reaction'; reaction: Reaction; verdict: 'accepte' | 'contre' | 'insulte' }
  | {
      type: 'estimation';
      qualite: readonly [number, number];
      cout: number;
      semaines: number;
      studioMax: number;
      capacite: number;
      enCours: number;
    }
  | { type: 'refus'; code: string; message: string }
  | { type: 'sauvegarde'; sauvegarde: string }
  | { type: 'soumission'; soumission: SoumissionDefi }
  | { type: 'erreur'; message: string };

const defaultChoiceOf = (eventId: string): string =>
  eventEngine.byId.get(eventId)?.defaultChoice ?? '';

const toSignal = (s: LabelSignal): SignalVue => ({
  kind: s.kind,
  interrupt: s.interrupt === true,
  payload: s.payload ?? {},
});

/**
 * Pilote du moteur : applique les commandes à une session et renvoie la vue. Il ne dépend ni du DOM
 * ni d'un Worker : l'interface l'appelle à travers un worker, les tests l'appellent directement.
 */
export class LabelPilot {
  private session: LabelSession | null = null;

  handle(commande: CommandeJeu): ReponseJeu {
    try {
      return this.run(commande);
    } catch (e) {
      return { type: 'erreur', message: e instanceof Error ? e.message : String(e) };
    }
  }

  private view(
    signaux: readonly LabelSignal[] = [],
    semainesJouees = 0,
    interrompu = false,
  ): ReponseJeu {
    if (!this.session) return { type: 'erreur', message: 'Aucune partie en cours.' };
    const { tick, data } = this.session.engine;
    const hooks: ViewHooks = {
      available: (id) => eventEngine.availableChoices(data, tick, id),
      defaultChoice: defaultChoiceOf,
    };
    return {
      type: 'vue',
      vue: buildView(data, tick, hooks),
      signaux: signaux.map(toSignal),
      semainesJouees,
      interrompu,
    };
  }

  private refus(rejection: Rejection): ReponseJeu {
    return { type: 'refus', code: rejection.code, message: describeRejection(rejection) };
  }

  private run(commande: CommandeJeu): ReponseJeu {
    switch (commande.type) {
      case 'nouvelle-partie':
        this.session = newGame(commande.graine, commande.config);
        return this.view();
      case 'charger': {
        const parsed = JSON.parse(commande.sauvegarde) as LabelSession;
        if (typeof parsed?.engine?.tick !== 'number' || !parsed.engine.data) {
          return { type: 'erreur', message: 'Sauvegarde illisible.' };
        }
        completerEtat(parsed.engine.data);
        this.session = parsed;
        return this.view();
      }
      case 'sauvegarder':
        return this.session
          ? { type: 'sauvegarde', sauvegarde: JSON.stringify(this.session) }
          : { type: 'erreur', message: 'Aucune partie en cours.' };
      case 'vue':
        return this.view();
      case 'soumettre-defi': {
        if (!this.session) return { type: 'erreur', message: 'Aucune partie en cours.' };
        const soumission = soumissionDe(this.session, commande.pseudo);
        return soumission
          ? { type: 'soumission', soumission }
          : { type: 'erreur', message: 'Le défi n’est pas terminé.' };
      }
      case 'estimer-sortie': {
        if (!this.session) return { type: 'erreur', message: 'Aucune partie en cours.' };
        const state = this.session.engine.data;
        const artist = state.artistes.find((a) => a.id === commande.artisteId);
        if (!artist) return { type: 'erreur', message: 'Artiste introuvable.' };
        return { type: 'estimation', ...estimateRelease(state, artist, commande) };
      }
      case 'evaluer-offre': {
        if (!this.session) return { type: 'erreur', message: 'Aucune partie en cours.' };
        const state = this.session.engine.data;
        const artist = state.artistes.find((a) => a.id === commande.artisteId);
        if (!artist) return { type: 'erreur', message: 'Artiste introuvable.' };
        if (!clausesValid(commande.clauses))
          return {
            type: 'refus',
            code: 'clauses-invalides',
            message: describeRejection({ code: 'clauses-invalides' }),
          };
        const { total } = utilityOf(artist, commande.clauses, prestigeFor(state, artist));
        return {
          type: 'reaction',
          reaction: gaugeOf(total),
          verdict: evaluateOffer(artist, commande.clauses, prestigeFor(state, artist)),
        };
      }
      case 'avancer': {
        if (!this.session) return { type: 'erreur', message: 'Aucune partie en cours.' };
        if (this.session.engine.data.faillite.terminee) return this.view();
        const { tick, data } = this.session.engine;
        // Le défi du jour s'arrête à 52 semaines : on ne joue pas au-delà.
        const restant = data.config.mode === 'defi' ? DEFI_SEMAINES - tick : 52;
        if (restant <= 0) return this.view();
        const weeks = Math.max(1, Math.min(52, restant, Math.floor(commande.semaines)));
        const result = labelGame.advance(this.session, weeks, {
          stopOnInterrupt: commande.arretSurSignal ?? true,
        });
        this.session = result.session;
        return this.view(result.signals, result.ticksRun, result.interrupted);
      }
      case 'action': {
        if (!this.session) return { type: 'erreur', message: 'Aucune partie en cours.' };
        if (defiTermine(this.session.engine.data, this.session.engine.tick))
          return this.refus(reject('defi-termine'));
        const result = labelGame.dispatch(this.session, commande.action);
        if (!result.ok) return this.refus(result.rejection);
        this.session = result.session;
        return this.view(result.signals);
      }
    }
  }
}
