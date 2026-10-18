import { type ActionHandler, type Phase, type Rng, cents, clamp, reject } from '@tycoon/core';
import type { Action } from '@tycoon/core';
import { fairAdvance, rosterCap, rosterSize } from './contracts';
import { CADRE_STYLES, GROUPE, RIVAL_INTERACTIONS, UNLOCKS, type CadreStyle } from './balance';
import { canAfford, earn, spend } from './finance';
import { genreKeys } from './market';
import { generateRealName } from './naming';
import type { LabelSignal } from './pipeline';
import { type LabelState, newId } from './state';
import { tierAtLeast } from './tiers';

/**
 * Dirigeant : il dirige un sous-label. Son niveau n'est connu qu'à peu près à l'embauche (la fourchette
 * se resserre avec les semaines de service) et son intégrité reste cachée un bon moment.
 */
export interface Dirigeant {
  id: number;
  nom: string;
  niveau: number;
  style: CadreStyle;
  /** Intégrité (0-100), cachée. */
  integrite: number;
  salaire: number;
  /** Décalage fixe de la fourchette annoncée sur le niveau (tiré à la création). */
  decalage: number;
  /** Vrai une fois embauché ; sinon c'est un candidat. */
  embauche: boolean;
  /** Semaine d'embauche, ou `null`. */
  depuis: number | null;
  /** Vrai après un détournement : l'intégrité devient connue. */
  demasque: boolean;
}

export interface SousLabel {
  id: number;
  nom: string;
  genre: string;
  cadreId: number | null;
  /** Enveloppe investie chaque semaine (centimes). */
  enveloppe: number;
  cree: number;
  investi: number;
  rapporte: number;
  /** Résultat net des dernières semaines (centimes), du plus ancien au plus récent. */
  recents: number[];
}

const RECENTS = 12;

export const salaireCadre = (niveau: number): number =>
  GROUPE.salaryFloor + niveau * GROUPE.salaryPerLevel;

/** Nombre maximal de sous-labels au palier actuel. */
export const sousLabelsMax = (state: LabelState): number =>
  GROUPE.maxSubLabels[state.label.tier] ?? 0;

export const cadreDe = (state: LabelState, id: number | null): Dirigeant | undefined =>
  id === null ? undefined : state.cadres.find((c) => c.id === id && c.embauche);

/** Génère un candidat cadre. */
export function genererCadre(state: LabelState, rng: Rng): Dirigeant {
  const nom = generateRealName(rng);
  const niveau = rng.int(GROUPE.level.min, GROUPE.level.max);
  return {
    id: newId(state),
    nom: `${nom.prenom} ${nom.nom}`,
    niveau,
    style: rng.pick(CADRE_STYLES),
    integrite: rng.int(GROUPE.integrity.min, GROUPE.integrity.max),
    salaire: salaireCadre(niveau),
    decalage: rng.int(-GROUPE.fogWidth, GROUPE.fogWidth),
    embauche: false,
    depuis: null,
    demasque: false,
  };
}

/** Fourchette connue du niveau d'un cadre : elle se resserre avec la durée de service. */
export function fourchetteNiveau(c: Dirigeant, tick: number): [number, number] {
  const service = c.depuis === null ? 0 : Math.max(0, tick - c.depuis);
  const largeur = Math.max(0, Math.round(GROUPE.fogWidth - service * GROUPE.fogPerWeek));
  const centre = c.niveau + Math.round((c.decalage * largeur) / GROUPE.fogWidth);
  return [clamp(centre - largeur, 0, 100), clamp(centre + largeur, 0, 100)];
}

/** Fiabilité visible d'un cadre : cachée tant qu'il n'a pas assez servi ou été démasqué. */
export const integriteConnue = (c: Dirigeant, tick: number): number | null =>
  c.demasque || (c.depuis !== null && tick - c.depuis >= GROUPE.integrityKnownAfter)
    ? c.integrite
    : null;

/** Rendement espéré d'un euro d'enveloppe (sans hasard), pour l'explication affichée au joueur. */
export function rendementEspere(state: LabelState, s: SousLabel): number {
  const cadre = cadreDe(state, s.cadreId);
  const popularite = state.marche.genres[s.genre]?.popularite ?? 50;
  const base =
    GROUPE.returnBase +
    (cadre ? (GROUPE.returnPerLevel * cadre.niveau) / 100 + GROUPE.styleBias[cadre.style] : 0) +
    (GROUPE.returnPerPopularity * (popularite - 50)) / 100;
  const adj = cadre ? base : base * GROUPE.noExecutiveFactor;
  const capacite = GROUPE.capacityBase * (1 + (cadre?.niveau ?? 0) * GROUPE.capacityPerLevel);
  const saturation = s.enveloppe > capacite ? Math.sqrt(capacite / s.enveloppe) : 1;
  return adj * saturation;
}

export interface CreateSubLabelAction extends Action {
  readonly type: 'creer-sous-label';
  readonly genre: string;
  readonly nom: string;
}
export interface AppointExecutiveAction extends Action {
  readonly type: 'nommer-cadre';
  readonly sousLabelId: number;
  readonly cadreId: number;
}
export interface SetEnvelopeAction extends Action {
  readonly type: 'regler-enveloppe';
  readonly sousLabelId: number;
  readonly montant: number;
}
export interface CloseSubLabelAction extends Action {
  readonly type: 'fermer-sous-label';
  readonly sousLabelId: number;
}
export interface BuyRivalAction extends Action {
  readonly type: 'racheter-rival';
  readonly rivalId: number;
}

const sousLabel = (state: LabelState, id: number) => state.sousLabels.find((s) => s.id === id);

export const createSubLabel: ActionHandler<LabelState, CreateSubLabelAction, LabelSignal> = {
  validate(state, action) {
    if (!tierAtLeast(state, UNLOCKS['sous-labels'])) return reject('palier-insuffisant');
    const nom = action.nom.trim();
    if (nom === '' || [...nom].length > 32) return reject('nom-invalide');
    if (!genreKeys(state.marche).includes(action.genre)) return reject('genre-inconnu');
    if (state.sousLabels.some((s) => s.genre === action.genre)) return reject('genre-deja-couvert');
    if (state.sousLabels.length >= sousLabelsMax(state))
      return reject('trop-de-sous-labels', { max: sousLabelsMax(state) });
    return canAfford(state, GROUPE.creationCost)
      ? null
      : reject('fonds-insuffisants', { besoin: GROUPE.creationCost });
  },
  apply(state, action, ctx) {
    spend(state, 'filiales', GROUPE.creationCost);
    state.sousLabels.push({
      id: newId(state),
      nom: action.nom.trim(),
      genre: action.genre,
      cadreId: null,
      enveloppe: 0,
      cree: ctx.tick,
      investi: 0,
      rapporte: 0,
      recents: [],
    });
    ctx.emit({ kind: 'sous-label-cree', payload: { genre: action.genre } });
  },
};

export const appointExecutive: ActionHandler<LabelState, AppointExecutiveAction, LabelSignal> = {
  validate(state, action) {
    if (!sousLabel(state, action.sousLabelId)) return reject('sous-label-introuvable');
    const c = state.cadres.find((x) => x.id === action.cadreId);
    return c && !c.embauche ? null : reject('cadre-introuvable');
  },
  apply(state, action, ctx) {
    const s = sousLabel(state, action.sousLabelId);
    const c = state.cadres.find((x) => x.id === action.cadreId);
    if (!s || !c) return;
    // L'ancien cadre quitte l'entreprise.
    state.cadres = state.cadres.filter((x) => x.id !== s.cadreId);
    c.embauche = true;
    c.depuis = ctx.tick;
    s.cadreId = c.id;
  },
};

export const setEnvelope: ActionHandler<LabelState, SetEnvelopeAction, LabelSignal> = {
  validate(state, action) {
    if (!sousLabel(state, action.sousLabelId)) return reject('sous-label-introuvable');
    return Number.isInteger(action.montant) &&
      action.montant >= 0 &&
      action.montant <= GROUPE.envelopeMax
      ? null
      : reject('montant-invalide', { max: GROUPE.envelopeMax });
  },
  apply(state, action) {
    const s = sousLabel(state, action.sousLabelId);
    if (s) s.enveloppe = action.montant;
  },
};

export const closeSubLabel: ActionHandler<LabelState, CloseSubLabelAction, LabelSignal> = {
  validate: (state, action) =>
    sousLabel(state, action.sousLabelId) ? null : reject('sous-label-introuvable'),
  apply(state, action) {
    const s = sousLabel(state, action.sousLabelId);
    if (!s) return;
    state.cadres = state.cadres.filter((c) => c.id !== s.cadreId);
    state.sousLabels = state.sousLabels.filter((x) => x.id !== s.id);
  },
};

/** Valorisation d'un rival : trésorerie plus trois fois l'avance juste de chacun de ses artistes. */
export function valorisationRival(state: LabelState, rivalId: number): number {
  const rival = state.rivaux.find((r) => r.id === rivalId);
  if (!rival) return 0;
  const roster = state.artistes.filter((a) => a.employeur === `rival:${rivalId}`);
  return rival.tresorerie + roster.reduce((sum, a) => sum + fairAdvance(a) * 3, 0);
}

export const prixRachatRival = (state: LabelState, rivalId: number): number =>
  Math.round(valorisationRival(state, rivalId) * GROUPE.buyoutMultiple);

export const buyRival: ActionHandler<LabelState, BuyRivalAction, LabelSignal> = {
  validate(state, action) {
    if (!tierAtLeast(state, UNLOCKS['rachat-rival'])) return reject('palier-insuffisant');
    if (!state.rivaux.some((r) => r.id === action.rivalId)) return reject('rival-introuvable');
    const prix = prixRachatRival(state, action.rivalId);
    return canAfford(state, cents(prix)) ? null : reject('fonds-insuffisants', { besoin: prix });
  },
  apply(state, action, ctx) {
    const rival = state.rivaux.find((r) => r.id === action.rivalId);
    if (!rival) return;
    spend(state, 'avances', cents(prixRachatRival(state, rival.id)));
    // Les artistes du rival rejoignent le groupe dans la limite du plafond, les autres redeviennent libres.
    const roster = state.artistes.filter((a) => a.employeur === `rival:${rival.id}`);
    let reprise = 0;
    for (const artist of roster) {
      if (rosterSize(state) < rosterCap(state)) {
        artist.employeur = 'joueur';
        reprise += 1;
        state.contrats.push({
          id: newId(state),
          artisteId: artist.id,
          clauses: {
            avance: cents(0),
            royaltiesArtisteBps: RIVAL_INTERACTIONS.buyoutContract.royaltiesBps,
            dureeAnnees: RIVAL_INTERACTIONS.buyoutContract.years,
            exclusivite: false,
            part360Bps: 0,
            clauseRachat: cents(0),
          },
          signeLe: ctx.tick,
          echeance: ctx.tick + RIVAL_INTERACTIONS.buyoutContract.years * 52,
          recette360: 0,
        });
      } else artist.employeur = 'libre';
    }
    state.rivaux = state.rivaux.filter((r) => r.id !== rival.id);
    state.remplacements.push(ctx.tick + RIVAL_INTERACTIONS.replacementDelay);
    state.label.reputation = Math.min(100, state.label.reputation + 1);
    ctx.emit({ kind: 'rival-rachete', payload: { rivalId: rival.id, artistes: reprise } });
  },
};

/** Phase hebdomadaire du groupe : salaires des cadres, enveloppes, rendements, détournements, vivier de cadres. */
export const groupePhase: Phase<LabelState, LabelSignal> = {
  name: 'tournees',
  run(state, ctx) {
    if (!tierAtLeast(state, UNLOCKS['sous-labels'])) return;
    const rng = ctx.rng('personnel');
    for (const c of state.cadres) if (c.embauche) spend(state, 'salaires', cents(c.salaire));

    for (const s of state.sousLabels) {
      const cadre = cadreDe(state, s.cadreId);
      let net = 0;
      if (s.enveloppe > 0 && canAfford(state, cents(s.enveloppe))) {
        const enjeu = s.enveloppe;
        spend(state, 'filiales', cents(enjeu));
        const sd = cadre ? GROUPE.noiseSd[cadre.style] : 0.1;
        const rendement = Math.max(0, rendementEspere(state, s) + rng.gaussian(0, sd));
        const retour = Math.round(enjeu * rendement);
        earn(state, 'filiales', cents(retour));
        s.investi += enjeu;
        s.rapporte += retour;
        net = retour - enjeu;
        // Un cadre peu intègre peut détourner une partie des fonds : il est alors démasqué et renvoyé.
        if (cadre && cadre.integrite < GROUPE.embezzleBelow && rng.chance(GROUPE.embezzleChance)) {
          const vol = Math.min(
            enjeu * GROUPE.embezzleMultiple,
            Math.max(0, state.label.tresorerie),
          );
          if (vol > 0) spend(state, 'filiales', cents(Math.round(vol)));
          cadre.demasque = true;
          state.cadres = state.cadres.filter((c) => c.id !== cadre.id);
          s.cadreId = null;
          net -= Math.round(vol);
          ctx.emit({
            kind: 'detournement',
            payload: { sousLabelId: s.id, montant: Math.round(vol) },
            interrupt: true,
          } as LabelSignal);
        }
      }
      s.recents.push(net);
      if (s.recents.length > RECENTS) s.recents.shift();
    }

    // Vivier de cadres : renouvelé régulièrement.
    if (ctx.tick % GROUPE.refreshEvery === 0) {
      const candidats = state.cadres.filter((c) => !c.embauche);
      if (candidats.length >= GROUPE.poolSize) {
        const ancien = candidats[0];
        if (ancien) state.cadres = state.cadres.filter((c) => c.id !== ancien.id);
      }
      while (state.cadres.filter((c) => !c.embauche).length < GROUPE.poolSize)
        state.cadres.push(genererCadre(state, rng));
    }
  },
};
