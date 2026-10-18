import type { Consequence, EventContext, EventDef, Vars } from '@tycoon/core';
import { cents, clamp } from '@tycoon/core';
import type { Artist } from '../../artists';
import { earn, spend } from '../../finance';
import type { Projet } from '../../production';
import type { LabelState } from '../../state';

export type LabelEvent = EventDef<LabelState>;

/** Artistes du joueur. */
export const roster = (d: LabelState): Artist[] =>
  d.artistes.filter((a) => a.employeur === 'joueur');

/** Artiste désigné par les variables d'un événement. */
export const target = (d: LabelState, vars: Vars): Artist | undefined =>
  d.artistes.find((a) => a.id === Number(vars['artisteId']));

/** Variables standard d'un événement sur un artiste. */
export const about = (a: Artist, extra: Vars = {}): Vars => ({
  artisteId: a.id,
  nom: a.nomScene,
  ...extra,
});

/** Tire un artiste du roster respectant un filtre, ou `null`. */
export function pickArtist(
  d: LabelState,
  ctx: EventContext,
  filter: (a: Artist) => boolean = () => true,
  stream = 'evenements',
): Artist | null {
  const list = roster(d).filter(filter);
  return list.length === 0 ? null : ctx.rng(stream).pick(list);
}

// --- Effets : chacun modifie l'état et renvoie sa ligne de conséquence ---

export function moral(a: Artist, delta: number): Consequence {
  a.moral = clamp(a.moral + delta, 0, 100);
  return { kind: 'moral', params: { artisteId: a.id, delta } };
}
export function hype(a: Artist, delta: number): Consequence {
  a.hype = clamp(a.hype + delta, 0, 100);
  return { kind: 'hype', params: { artisteId: a.id, delta } };
}
export function fans(a: Artist, delta: number): Consequence {
  a.fanbase = Math.max(0, a.fanbase + delta);
  return { kind: 'fans', params: { artisteId: a.id, delta } };
}
export function affinity(a: Artist, delta: number): Consequence {
  a.affinite = clamp(a.affinite + delta, -100, 100);
  return { kind: 'affinite', params: { artisteId: a.id, delta } };
}
export function loyalty(a: Artist, delta: number): Consequence {
  a.loyaute = clamp(a.loyaute + delta, 0, 100);
  return { kind: 'loyaute', params: { artisteId: a.id, delta } };
}
export function fatigue(a: Artist, delta: number): Consequence {
  a.fatigue = clamp(a.fatigue + delta, 0, 100);
  return { kind: 'fatigue', params: { artisteId: a.id, delta } };
}
export function rest(a: Artist, weeks: number): Consequence {
  a.repos = Math.max(a.repos, weeks);
  return { kind: 'repos', params: { artisteId: a.id, semaines: weeks } };
}
export function skill(
  a: Artist,
  key: 'plume' | 'flow' | 'voix' | 'charisme' | 'scene',
  delta: number,
): Consequence {
  a[key] = clamp(a[key] + delta, 0, 100);
  return { kind: 'competence', params: { artisteId: a.id, competence: key, delta } };
}
export function reputation(d: LabelState, delta: number): Consequence {
  d.label.reputation = clamp(d.label.reputation + delta, 0, 100);
  return { kind: 'reputation', params: { delta } };
}
/** Gain (positif) ou dépense (négatif) de trésorerie, en centimes. */
export function cash(d: LabelState, delta: number): Consequence {
  if (delta >= 0) earn(d, 'autres', cents(delta));
  else spend(d, 'autres', cents(-delta));
  return { kind: 'tresorerie', params: { delta } };
}

// --- Projets de production ---

/** Projet désigné par les variables d'un événement. */
export const project = (d: LabelState, vars: Vars): Projet | undefined =>
  d.projets.find((p) => p.id === Number(vars['projetId']));

/** Tire un projet respectant un filtre, ou `null`. */
export function pickProject(
  d: LabelState,
  ctx: EventContext,
  filter: (p: Projet) => boolean,
): Projet | null {
  const list = d.projets.filter(filter);
  return list.length === 0 ? null : ctx.rng('evenements').pick(list);
}

/** Variables standard d'un événement sur un projet (et son artiste). */
export function aboutProject(d: LabelState, p: Projet, extra: Vars = {}): Vars {
  const artist = d.artistes.find((a) => a.id === p.artisteId);
  return { projetId: p.id, artisteId: p.artisteId, nom: artist?.nomScene ?? '', ...extra };
}

export function delay(p: Projet, weeks: number): Consequence {
  p.fin += weeks;
  return { kind: 'retard', params: { projetId: p.id, semaines: weeks } };
}
export function quality(p: Projet, delta: number): Consequence {
  if (p.qualite !== null) p.qualite = clamp(p.qualite + delta, 0, 100);
  return { kind: 'qualite', params: { projetId: p.id, delta } };
}

/** Atténue un effet négatif selon le niveau de l'attaché de presse (jusqu'à moitié moins fort). */
export function mitigated(d: LabelState, delta: number): number {
  if (delta >= 0) return delta;
  const level = d.personnel
    .filter((m) => m.role === 'attache')
    .reduce((best, m) => Math.max(best, m.niveau), 0);
  return Math.round(delta * (1 - (0.5 * level) / 100));
}
