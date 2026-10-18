import { clamp, money } from '@tycoon/core';
import { openFestivals } from '../../festivals';
import { genreKeys, spawnSubgenre } from '../../market';
import type { LabelState } from '../../state';
import { type LabelEvent, cash, hype, roster } from './helpers';

const pickGenre = (
  d: LabelState,
  rng: { pick<T>(l: readonly T[]): T },
  pred: (id: string) => boolean = () => true,
): string | null => {
  const ids = genreKeys(d.marche).filter(pred);
  return ids.length === 0 ? null : rng.pick(ids);
};

const shift = (d: LabelState, genre: string, delta: number) => {
  const g = d.marche.genres[genre];
  if (g) g.base = clamp(g.base + delta, 5, 95);
  return { kind: 'genre', params: { genre, delta } };
};

/** Événements de marché : tendances, plateformes, saisons, sous-genres. */
export const MARKET_EVENTS: readonly LabelEvent[] = [
  {
    id: 'genre-en-hausse',
    category: 'marche',
    weight: 5,
    cooldown: 8,
    prepare: (d, ctx) => {
      const genre = pickGenre(d, ctx.rng('marche'));
      return genre ? { genre } : null;
    },
    apply: (d, _c, vars) => [shift(d, String(vars['genre']), 8)],
  },
  {
    id: 'genre-en-berne',
    category: 'marche',
    weight: 4,
    cooldown: 8,
    prepare: (d, ctx) => {
      const genre = pickGenre(d, ctx.rng('marche'), (id) => (d.marche.genres[id]?.base ?? 0) > 25);
      return genre ? { genre } : null;
    },
    apply: (d, _c, vars) => [shift(d, String(vars['genre']), -8)],
  },
  {
    id: 'changement-remuneration',
    category: 'marche',
    weight: 3,
    cooldown: 52,
    prepare: (_d, ctx) => ({ pct: ctx.rng('marche').chance(0.5) ? 10 : -10 }),
    apply: (d, _c, vars) => {
      d.marche.facteurStreaming = clamp(
        d.marche.facteurStreaming * (1 + Number(vars['pct']) / 100),
        0.6,
        1.5,
      );
      return [{ kind: 'remuneration-streaming', params: { pct: Number(vars['pct']) } }];
    },
  },
  {
    id: 'saison-des-festivals',
    category: 'marche',
    weight: 2,
    cooldown: 52,
    apply: (d, ctx) => {
      openFestivals(d, ctx.tick, ctx.rng('marche'), 2);
      return [{ kind: 'festivals-supplementaires', params: { nombre: 2 } }];
    },
  },
  {
    id: 'nouveau-sous-genre',
    category: 'marche',
    weight: (d) => (d.sousGenres.length < 3 ? 2 : 0),
    cooldown: 52,
    when: (d) => d.sousGenres.length < 3,
    apply: (d, ctx) => {
      const born = spawnSubgenre(d, ctx.rng('marche'), ctx.tick, true);
      return born ? [{ kind: 'sous-genre', params: {} }] : [];
    },
  },
  {
    id: 'crise-economique',
    category: 'marche',
    weight: 1,
    cooldown: 156,
    once: false,
    apply: (d) => {
      for (const id of genreKeys(d.marche)) shift(d, id, -3);
      d.marche.facteurStreaming = clamp(d.marche.facteurStreaming - 0.08, 0.6, 1.5);
      return [{ kind: 'crise', params: {} }];
    },
  },
  {
    id: 'phenomene-viral',
    category: 'marche',
    weight: 4,
    cooldown: 12,
    prepare: (d, ctx) => {
      const genre = pickGenre(d, ctx.rng('marche'));
      return genre ? { genre } : null;
    },
    apply: (d, _c, vars) => {
      const g = d.marche.genres[String(vars['genre'])];
      if (g) g.bruit = clamp(g.bruit + 12, -15, 15);
      return [{ kind: 'genre', params: { genre: String(vars['genre']), delta: 12 } }];
    },
  },
  {
    id: 'vague-de-nostalgie',
    category: 'marche',
    weight: 2,
    cooldown: 40,
    apply: (d) => [shift(d, 'variete', 10)],
  },
  {
    id: 'saturation-du-marche',
    category: 'marche',
    weight: (d) =>
      genreKeys(d.marche).some((id) => (d.marche.genres[id]?.popularite ?? 0) > 80) ? 4 : 0,
    cooldown: 20,
    when: (d) => genreKeys(d.marche).some((id) => (d.marche.genres[id]?.popularite ?? 0) > 80),
    prepare: (d) => {
      const genre = genreKeys(d.marche).find((id) => (d.marche.genres[id]?.popularite ?? 0) > 80);
      return genre ? { genre } : null;
    },
    apply: (d, _c, vars) => [shift(d, String(vars['genre']), -10)],
  },
  {
    id: 'algorithme-plateforme',
    category: 'marche',
    weight: 3,
    cooldown: 40,
    prepare: () => ({ budget: money.euros(3000) }),
    choices: [
      {
        id: 'investir',
        when: (d, vars) => d.label.tresorerie >= Number(vars['budget']) && roster(d).length > 0,
        apply: (d, _c, vars) => [
          cash(d, -Number(vars['budget'])),
          ...roster(d).map((a) => hype(a, 5)),
        ],
      },
      {
        id: 'ignorer',
        apply: (d) => {
          d.marche.facteurStreaming = clamp(d.marche.facteurStreaming - 0.03, 0.6, 1.5);
          return [{ kind: 'remuneration-streaming', params: { pct: -3 } }];
        },
      },
    ],
    defaultChoice: 'ignorer',
  },
  {
    id: 'buzz-ville',
    category: 'marche',
    weight: 3,
    cooldown: 20,
    prepare: (d, ctx) => {
      const genre = pickGenre(d, ctx.rng('marche'));
      return genre ? { genre, ville: ctx.rng('marche').pick(d.villes) } : null;
    },
    apply: (d, _c, vars) => [shift(d, String(vars['genre']), 5)],
  },
];
