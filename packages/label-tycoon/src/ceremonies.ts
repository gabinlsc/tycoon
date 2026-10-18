import { type Rng, ln, powInt } from '@tycoon/core';
import { notoriety } from './artists';
import { CEREMONY } from './balance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

export type CeremonyCategory = 'single' | 'album' | 'artiste' | 'revelation';
export const CEREMONY_CATEGORIES: readonly CeremonyCategory[] = [
  'single',
  'album',
  'artiste',
  'revelation',
];

export interface Candidat {
  /** Référence : `projet:ID`, `artiste:ID` ou `bruit:N`. */
  ref: string;
  joueur: boolean;
  artisteId: number | null;
  score: number;
}

export interface CategorieCeremonie {
  categorie: CeremonyCategory;
  candidats: Candidat[];
  gagnant: string | null;
}

export interface Ceremonie {
  annee: number;
  categories: CategorieCeremonie[];
  /** Vrai si le label du joueur a été désigné label de l'année. */
  labelDeLAnnee: boolean;
}

export type FireEvent = (eventId: string, vars: Record<string, string | number>) => void;

const projectScore = (quality: number, streams: number): number =>
  quality * 0.7 + Math.min(CEREMONY.streamsBonusCap, ln(1 + streams) * 2);

/** Calcule les nommés de chaque catégorie : sorties et artistes du joueur parmi des fictifs. */
export function buildNominations(state: LabelState, year: number, rng: Rng): Ceremonie {
  const lowerBound = year * 52 - 52;
  const categories: CategorieCeremonie[] = CEREMONY_CATEGORIES.map((categorie) => {
    const mine: Candidat[] = [];
    if (categorie === 'single' || categorie === 'album') {
      for (const p of state.projets) {
        if (
          p.statut !== 'sortie' ||
          p.sortieLe === null ||
          p.sortieLe < lowerBound ||
          p.qualite === null
        )
          continue;
        if ((p.type === 'single') !== (categorie === 'single')) continue;
        mine.push({
          ref: `projet:${p.id}`,
          joueur: true,
          artisteId: p.artisteId,
          score: projectScore(p.qualite, p.streams),
        });
      }
    } else {
      for (const a of state.artistes.filter((x) => x.employeur === 'joueur')) {
        if (categorie === 'revelation' && a.phase !== 'emergent' && a.phase !== 'montee') continue;
        mine.push({
          ref: `artiste:${a.id}`,
          joueur: true,
          artisteId: a.id,
          score: notoriety(a.fanbase) * 0.6 + a.hype * 0.4,
        });
      }
    }
    const noise: Candidat[] = Array.from({ length: CEREMONY.noiseNominees }, (_, i) => ({
      ref: `bruit:${i}`,
      joueur: false,
      artisteId: null,
      score: rng.range(CEREMONY.noiseScore.min, CEREMONY.noiseScore.max),
    }));
    const candidats = [...mine, ...noise]
      .sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref))
      .slice(0, CEREMONY.nominees);
    return { categorie, candidats, gagnant: null };
  });
  return { annee: year, categories, labelDeLAnnee: false };
}

/** Tire le gagnant d'une catégorie, pondéré par le score. */
export function drawWinner(category: CategorieCeremonie, rng: Rng): string | null {
  if (category.candidats.length === 0) return null;
  return rng.pickWeighted(category.candidats, (c) =>
    powInt(Math.max(0.01, c.score), CEREMONY.winnerPower),
  ).ref;
}

/** Nominations en milieu d'année, remise des prix quelques semaines plus tard. */
export function ceremonyWeek(
  state: LabelState,
  tick: number,
  rng: Rng,
  fire: FireEvent,
  emit: (s: LabelSignal) => void,
): void {
  const year = Math.floor(tick / 52);
  const week = tick % 52;
  if (week === CEREMONY.nominationWeek) {
    state.ceremonie = buildNominations(state, year, rng);
    let announced = 0;
    for (const cat of state.ceremonie.categories) {
      for (const c of cat.candidats.filter((x) => x.joueur)) {
        emit({ kind: 'nomination', payload: { categorie: cat.categorie, ref: c.ref } });
        const artist = state.artistes.find((a) => a.id === c.artisteId);
        if (artist && announced < 3) {
          announced += 1;
          fire('nomination-recue', {
            artisteId: artist.id,
            nom: artist.nomScene,
            categorie: cat.categorie,
          });
        }
      }
    }
    return;
  }
  const ceremony = state.ceremonie;
  if (week !== CEREMONY.awardWeek || !ceremony || ceremony.annee !== year) return;
  let attended = false;
  for (const cat of ceremony.categories) {
    cat.gagnant = drawWinner(cat, rng);
    for (const c of cat.candidats.filter((x) => x.joueur)) {
      const artist = state.artistes.find((a) => a.id === c.artisteId);
      if (!artist) continue;
      const vars = { artisteId: artist.id, nom: artist.nomScene, categorie: cat.categorie };
      if (c.ref === cat.gagnant) {
        artist.hype = Math.min(100, artist.hype + CEREMONY.winnerHype);
        state.label.reputation = Math.min(100, state.label.reputation + CEREMONY.winnerReputation);
        state.label.credibilite[artist.genre] = Math.min(
          100,
          (state.label.credibilite[artist.genre] ?? 0) + CEREMONY.winnerCredibility,
        );
        emit({
          kind: 'prix-remporte',
          payload: { categorie: cat.categorie, artisteId: artist.id },
        });
        fire('prix-remporte', vars);
        fire('discours-gagnant', vars);
      } else {
        fire('prix-perdu', vars);
      }
      if (!attended) {
        attended = true;
        fire(artist.ego >= CEREMONY.boycottEgo ? 'boycott' : 'tapis-rouge', vars);
        fire('after-party', vars);
      }
    }
  }
  if (rng.chance(state.label.reputation / CEREMONY.labelOfYearDivisor)) {
    ceremony.labelDeLAnnee = true;
    state.label.reputation = Math.min(100, state.label.reputation + CEREMONY.labelOfYearReputation);
    emit({ kind: 'label-de-l-annee', payload: {} });
    fire('label-de-l-annee', {});
  }
}
