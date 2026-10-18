import { calendarOf } from '@tycoon/core';
import { notoriety } from './artists';
import { fr } from './strings/fr';
import { describeEvent } from './strings';
import type { LabelState } from './state';
import { labelScore } from './valuation';
import { VISIBLE_ATTRIBUTES, knownRange } from './scouting';
import { bestCertification } from './charts';

/**
 * Vue du jeu pour l'interface : un instantané sérialisable et plat, calculé à partir de l'état.
 * L'interface ne lit jamais l'état brut (elle ne voit donc pas les attributs cachés des talents).
 */
export interface VueArtiste {
  id: number;
  nom: string;
  genre: string;
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

export interface VueJeu {
  semaine: number;
  date: { annee: number; mois: number; semaineDuMois: number };
  label: { nom: string; palier: string; reputation: number };
  finances: {
    tresorerie: number;
    valorisation: number;
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
  objectifs: { id: number; kind: string; cible: number; base: number }[];
  succes: number;
}

const FIL_VISIBLE = 40;

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
    })),
    succes: state.succes.length,
  };
}
