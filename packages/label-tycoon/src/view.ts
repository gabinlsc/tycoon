import { calendarOf } from '@tycoon/core';
import { notoriety } from './artists';
import { fr } from './strings/fr';
import { describeEvent } from './strings';
import type { LabelState } from './state';
import { labelScore, valuation } from './valuation';
import { VISIBLE_ATTRIBUTES, knownRange } from './scouting';
import { bestCertification } from './charts';
import { objectiveProgress } from './achievements';

/**
 * Vue du jeu pour l'interface : un instantané sérialisable et plat, calculé à partir de l'état.
 * L'interface ne lit jamais l'état brut (elle ne voit donc pas les attributs cachés des talents).
 */
export interface VueArtiste {
  id: number;
  nom: string;
  genre: string;
  /** Nom affichable du genre (sous-genres fictifs compris). */
  genreNom: string;
  phaseNom: string;
  age: number;
  phase: string;
  employeur: string;
  notoriete: number;
  fans: number;
  hype: number;
  moral: number;
  fatigue: number;
  /** Compétences visibles (artistes signés ou libres : valeur réelle seulement pour le roster du joueur). */
  competences: Record<string, number>;
  /** Contrat en cours : échéance et part de royalties de l'artiste (points de base), ou `null`. */
  contrat: { echeance: number; royaltiesBps: number } | null;
  /** Vrai si un projet est en production pour cet artiste. */
  enProduction: boolean;
}

export interface VueSuivi {
  id: number;
  nom: string;
  genre: string;
  source: string;
  observations: number;
  essai: boolean;
  /** Fourchettes des attributs connus. */
  fourchettes: Record<string, readonly [number, number]>;
}

export interface VueDecision {
  instanceId: number;
  eventId: string;
  titre: string;
  texte: string;
  echeance: number;
  choix: { id: string; libelle: string; disponible: boolean }[];
  parDefaut: string;
}

export interface VueActu {
  id: number;
  semaine: number;
  titre: string;
  texte: string;
  importance: 1 | 2 | 3;
  kind: string;
}

export interface VueEcheance {
  type: 'projet' | 'contrat';
  artisteId: number;
  nom: string;
  semaine: number;
}

export interface VueJeu {
  semaine: number;
  date: { annee: number; mois: number; semaineDuMois: number };
  label: { nom: string; palier: string; reputation: number };
  finances: {
    tresorerie: number;
    valorisation: number;
    /** Termes de la valorisation (clé, contribution en centimes), pour l’infobulle. */
    termesValorisation: { cle: string; contribution: number }[];
    semainesNegatives: number;
    faillite: boolean;
  };
  certification: string | null;
  roster: VueArtiste[];
  suivis: VueSuivi[];
  projets: {
    id: number;
    artisteId: number;
    type: string;
    statut: string;
    fin: number;
    qualite: number | null;
  }[];
  decisions: VueDecision[];
  fil: VueActu[];
  objectifs: { id: number; kind: string; cible: number; base: number; progression: number }[];
  /** Trésorerie de fin de semaine sur les dernières semaines (centimes), de la plus ancienne à la plus récente. */
  historiqueTresorerie: number[];
  /** Prochaines échéances : projets qui se terminent, contrats qui arrivent à terme. */
  echeances: VueEcheance[];
  /** Dernier rapport mensuel, s'il existe. */
  rapport: {
    semaine: number;
    net: number;
    variation: number;
    reussites: number;
    echecs: number;
  } | null;
  succes: number;
}

const FIL_VISIBLE = 40;
const HISTORIQUE = 26;
const NB_ECHEANCES = 6;

export function nomGenre(state: LabelState, id: string): string {
  const base = (fr.genres as Record<string, string | undefined>)[id];
  return base ?? state.sousGenres.find((s) => s.id === id)?.nom ?? id;
}

function contratDe(state: LabelState, artisteId: number): VueArtiste['contrat'] {
  const c = state.contrats.find((k) => k.artisteId === artisteId);
  return c ? { echeance: c.echeance, royaltiesBps: c.clauses.royaltiesArtisteBps } : null;
}

const nomDe = (state: LabelState, id: number): string =>
  state.artistes.find((a) => a.id === id)?.nomScene ?? 'Artiste';

function echeances(state: LabelState, tick: number): VueEcheance[] {
  const list: VueEcheance[] = [];
  for (const p of state.projets)
    if (p.statut === 'production')
      list.push({
        type: 'projet',
        artisteId: p.artisteId,
        nom: nomDe(state, p.artisteId),
        semaine: p.fin,
      });
  for (const c of state.contrats)
    list.push({
      type: 'contrat',
      artisteId: c.artisteId,
      nom: nomDe(state, c.artisteId),
      semaine: c.echeance,
    });
  return list
    .filter((e) => e.semaine >= tick)
    .sort((a, b) => a.semaine - b.semaine || a.artisteId - b.artisteId)
    .slice(0, NB_ECHEANCES);
}

function lastReport(state: LabelState): VueJeu['rapport'] {
  const r = state.rapportsMensuels[state.rapportsMensuels.length - 1];
  return r
    ? {
        semaine: r.semaine,
        net: r.net,
        variation: r.variation,
        reussites: r.reussites.length,
        echecs: r.echecs.length,
      }
    : null;
}

/** Instantané de la partie à la semaine `tick`. */
/** Aides fournies par le moteur d'événements (disponibilité des choix, choix par défaut). */
export interface ViewHooks {
  available(instanceId: number): readonly string[];
  defaultChoice(eventId: string): string;
}

export function buildView(state: LabelState, tick: number, hooks?: ViewHooks): VueJeu {
  const date = calendarOf(tick);
  const roster = state.artistes
    .filter((a) => a.employeur === 'joueur')
    .map<VueArtiste>((a) => ({
      id: a.id,
      nom: a.nomScene,
      genre: a.genre,
      genreNom: nomGenre(state, a.genre),
      phaseNom: fr.phasesDeCarriere[a.phase],
      age: a.age,
      phase: a.phase,
      employeur: a.employeur,
      notoriete: Math.round(notoriety(a.fanbase)),
      fans: a.fanbase,
      hype: Math.round(a.hype),
      moral: Math.round(a.moral),
      fatigue: Math.round(a.fatigue),
      competences: {
        plume: a.plume,
        flow: a.flow,
        voix: a.voix,
        charisme: a.charisme,
        scene: a.scene,
      },
      contrat: contratDe(state, a.id),
      enProduction: state.projets.some((p) => p.artisteId === a.id && p.statut === 'production'),
    }));
  const suivis = state.suivis.flatMap<VueSuivi>((p) => {
    const a = state.artistes.find((x) => x.id === p.artisteId);
    if (!a) return [];
    const fourchettes: Record<string, readonly [number, number]> = {};
    for (const attr of VISIBLE_ATTRIBUTES) {
      const r = knownRange(p, a, attr);
      if (r) fourchettes[attr] = r;
    }
    return [
      {
        id: a.id,
        nom: a.nomScene,
        genre: a.genre,
        source: p.source,
        observations: p.observations,
        essai: p.essai,
        fourchettes,
      },
    ];
  });
  const decisions = state.events.pending.flatMap<VueDecision>((pending) => {
    const text = describeEvent(pending.eventId, pending.vars);
    if (!text) return [];
    return [
      {
        instanceId: pending.instanceId,
        eventId: pending.eventId,
        titre: text.titre,
        texte: text.texte,
        echeance: pending.deadlineTick,
        choix: Object.entries(text.choix).map(([id, libelle]) => ({
          id,
          libelle,
          disponible: hooks ? hooks.available(pending.instanceId).includes(id) : true,
        })),
        parDefaut: hooks?.defaultChoice(pending.eventId) ?? '',
      },
    ];
  });
  return {
    semaine: tick,
    date: { annee: date.year + 1, mois: date.month, semaineDuMois: date.weekOfMonth },
    label: {
      nom: state.label.nom,
      palier: fr.tiers[state.label.tier],
      reputation: Math.round(state.label.reputation),
    },
    finances: {
      tresorerie: state.label.tresorerie,
      valorisation: labelScore(state, tick),
      termesValorisation: valuation(state, tick).terms.map((t) => ({
        cle: t.key,
        contribution: t.contribution,
      })),
      semainesNegatives: state.faillite.semaines,
      faillite: state.faillite.terminee,
    },
    certification: bestCertification(state),
    roster,
    suivis,
    projets: state.projets.map((p) => ({
      id: p.id,
      artisteId: p.artisteId,
      type: p.type,
      statut: p.statut,
      fin: p.fin,
      qualite: p.statut === 'production' ? null : p.qualite,
    })),
    decisions,
    fil: state.fil
      .slice(-FIL_VISIBLE)
      .reverse()
      .map((a) => ({
        id: a.id,
        semaine: a.semaine,
        titre: a.titre,
        texte: a.texte,
        importance: a.importance,
        kind: a.kind,
      })),
    objectifs: state.objectifs.map((o) => ({
      id: o.id,
      kind: o.kind,
      cible: o.cible,
      base: o.base,
      progression: objectiveProgress(state, o),
    })),
    historiqueTresorerie: state.finances.semaines.slice(-HISTORIQUE).map((r) => r.tresorerieFin),
    echeances: echeances(state, tick),
    rapport: lastReport(state),
    succes: state.succes.length,
  };
}
