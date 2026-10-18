import { type ActionHandler, type Cents, cents, clamp, money, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { type Artist, notoriety } from './artists';
import { CONTRACTS, CREDIBILITY, ROSTER_CAP } from './balance';
import { PLAFOND_ECURIE_REDUITE, contrainteActive } from './defi-hebdo';
import { claimSubgenre } from './market';
import { canAfford, spend } from './finance';
import type { LabelSignal } from './pipeline';
import { type LabelState, newId } from './state';

/** Clauses d'un contrat d'artiste. */
export interface Clauses {
  /** Avance versée à la signature. */
  avance: Cents;
  /** Part des royalties reversée à l'artiste (points de base). */
  royaltiesArtisteBps: number;
  /** Durée en années. */
  dureeAnnees: number;
  /** Exclusivité : l'artiste ne peut sortir de musique ailleurs. */
  exclusivite: boolean;
  /** Part du label sur concerts, merch et synchro (points de base, 0 = contrat classique). */
  part360Bps: number;
  /** Prix de rachat anticipé du contrat par l'artiste (0 = pas de clause). */
  clauseRachat: Cents;
}

export interface Contrat {
  id: number;
  artisteId: number;
  clauses: Clauses;
  /** Semaine de signature. */
  signeLe: number;
  /** Semaine d'échéance. */
  echeance: number;
  /** Revenus supplémentaires (centimes) apportés au label par la clause 360 depuis la signature. */
  recette360: number;
}

export interface UtilityTerm {
  id: string;
  valeur: number;
}
export interface Utility {
  total: number;
  termes: UtilityTerm[];
}

/**
 * Prestige du label aux yeux d'un artiste : sa réputation, plus un peu de sa crédibilité dans le genre
 * de l'artiste. C'est cette valeur que le modèle d'utilité compare à la notoriété de l'artiste.
 */
export const prestigeFor = (state: LabelState, artist: Artist): number =>
  state.label.reputation +
  CREDIBILITY.prestigeWeight * (state.label.credibilite[artist.genre] ?? 0);

/** Artistes actuellement sous contrat avec le joueur. */
export const rosterSize = (state: LabelState): number =>
  state.artistes.filter((a) => a.employeur === 'joueur').length;

/** Plafond d'artistes sous contrat pour le palier actuel du label. */
export const rosterCap = (state: LabelState): number =>
  contrainteActive(state)?.id === 'roster-reduit'
    ? Math.min(PLAFOND_ECURIE_REDUITE, ROSTER_CAP[state.label.tier])
    : ROSTER_CAP[state.label.tier];

/** Vrai quand le label ne peut plus signer personne (le bac à sable n'a pas de limite). */
export const rosterFull = (state: LabelState): boolean =>
  !state.config.sandbox && rosterSize(state) >= rosterCap(state);

/** Avance « juste » pour cet artiste : ce qu'il juge normal de recevoir à la signature. */
export function fairAdvance(artist: Artist): Cents {
  return cents(CONTRACTS.advanceFloor + Math.round(artist.fanbase * CONTRACTS.advancePerFan));
}

/**
 * Modèle d'utilité de l'artiste : somme de termes lisibles (avance, royalties, prestige du label,
 * affinité, exclusivité, 360, durée, rachat). Au-dessus du seuil, il accepte.
 */
export function utilityOf(artist: Artist, clauses: Clauses, reputation: number): Utility {
  const w = CONTRACTS.weights;
  const fair = fairAdvance(artist);
  const ego = artist.ego / 100;
  const loyal = artist.loyaute / 100;
  const termes: UtilityTerm[] = [
    { id: 'avance', valeur: w.avance * clamp((clauses.avance - fair) / fair, -1, 2) },
    {
      id: 'royalties',
      valeur:
        w.royalties *
        ((clauses.royaltiesArtisteBps - CONTRACTS.fairRoyaltiesBps) / 10_000) *
        (1 + ego),
    },
    { id: 'prestige', valeur: w.prestige * (reputation - notoriety(artist.fanbase)) },
    { id: 'affinite', valeur: w.affinite * artist.affinite },
    { id: 'exclusivite', valeur: clauses.exclusivite ? -w.exclusivite * (0.5 + ego) : 0 },
    {
      id: 'clause360',
      valeur: ((-w.clause360 * clauses.part360Bps) / 10_000) * (0.5 + artist.ethique / 100),
    },
    { id: 'duree', valeur: -w.duree * (clauses.dureeAnnees - 2) * (1.5 - loyal) },
    { id: 'rachat', valeur: clauses.clauseRachat > 0 ? w.rachat * (0.5 + ego) : 0 },
  ];
  return { total: termes.reduce((s, t) => s + t.valeur, 0), termes };
}

export function clausesValid(c: Clauses): boolean {
  const { royaltiesBps, durationYears, share360Bps } = CONTRACTS;
  return (
    Number.isInteger(c.avance) &&
    c.avance >= 0 &&
    Number.isInteger(c.clauseRachat) &&
    c.clauseRachat >= 0 &&
    c.royaltiesArtisteBps >= royaltiesBps.min &&
    c.royaltiesArtisteBps <= royaltiesBps.max &&
    c.dureeAnnees >= durationYears.min &&
    c.dureeAnnees <= durationYears.max &&
    c.part360Bps >= share360Bps.min &&
    c.part360Bps <= share360Bps.max
  );
}

export interface SignAction extends Action {
  readonly type: 'signer';
  readonly artisteId: number;
  readonly clauses: Clauses;
}

export const sign: ActionHandler<LabelState, SignAction, LabelSignal> = {
  validate(state, action) {
    const artist = state.artistes.find((a) => a.id === action.artisteId);
    if (!artist) return reject('artiste-introuvable');
    if (artist.employeur !== 'libre') return reject('artiste-indisponible');
    if (rosterFull(state)) return reject('roster-plein', { max: rosterCap(state) });
    if (!clausesValid(action.clauses)) return reject('clauses-invalides');
    if (!canAfford(state, action.clauses.avance))
      return reject('fonds-insuffisants', { besoin: action.clauses.avance });
    const { total } = utilityOf(artist, action.clauses, prestigeFor(state, artist));
    if (total < CONTRACTS.acceptThreshold) return reject('offre-refusee');
    return null;
  },
  apply(state, action, ctx) {
    concludeSigning(state, action.artisteId, action.clauses, ctx.tick, ctx.emit);
  },
};

/** Conclut la signature : avance débitée, artiste lié au label, contrat créé, négociation close. */
export function concludeSigning(
  state: LabelState,
  artisteId: number,
  clauses: Clauses,
  tick: number,
  emit: (signal: { kind: string; payload: Record<string, unknown> }) => void,
): void {
  const artist = state.artistes.find((a) => a.id === artisteId);
  if (!artist) return;
  spend(state, 'avances', clauses.avance);
  artist.employeur = 'joueur';
  state.suivis = state.suivis.filter((p) => p.artisteId !== artist.id);
  state.negociations = state.negociations.filter((n) => n.artisteId !== artist.id);
  state.contrats.push({
    id: newId(state),
    artisteId: artist.id,
    clauses: { ...clauses },
    signeLe: tick,
    echeance: tick + clauses.dureeAnnees * 52,
    recette360: 0,
  });
  if (claimSubgenre(state, artist.genre, 'joueur'))
    emit({ kind: 'premier-sous-genre', payload: { genre: artist.genre } });
  emit({ kind: 'artiste-signe', payload: { artisteId: artist.id } });
}

/** Part des royalties revenant au label pour un montant brut. */
export function labelShare(clauses: Clauses, gross: Cents): Cents {
  return cents(gross - money.applyBps(gross, clauses.royaltiesArtisteBps));
}

/** Source de revenu live soumise à la clause 360. */
export type Source360 = 'concerts' | 'merch' | 'synchro';

/**
 * Part du label sur un revenu live : sa part de base (commission) plus, si le contrat est 360, la
 * part négociée. L'apport de la clause 360 est cumulé dans le contrat (`recette360`).
 */
export function liveShare(
  state: LabelState,
  artisteId: number,
  gross: number,
  baseBps: number,
): number {
  const contract = state.contrats.find((k) => k.artisteId === artisteId);
  const extraBps = contract?.clauses.part360Bps ?? 0;
  const total = Math.min(10_000, baseBps + extraBps);
  if (contract && extraBps > 0)
    contract.recette360 += Math.round((gross * (total - baseBps)) / 10_000);
  return Math.round((gross * total) / 10_000);
}
