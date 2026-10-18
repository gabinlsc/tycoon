import { money } from '@tycoon/core';
import { relationOf } from '../../relations';
import {
  type LabelEvent,
  about,
  affinity,
  cash,
  fatigue,
  fans,
  hype,
  loyalty,
  moral,
  pickArtist,
  reputation,
  rest,
  roster,
  skill,
  target,
} from './helpers';

/** Événements liés aux artistes : humeurs, santé, relations, départs et retours. */
export const ARTIST_EVENTS: readonly LabelEvent[] = [
  {
    id: 'caprice',
    category: 'artistes',
    weight: 3,
    cooldown: 20,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.ego >= 40);
      return a && about(a, { montant: money.euros(4000) });
    },
    choices: [
      {
        id: 'payer',
        when: (d, vars) => d.label.tresorerie >= Number(vars['montant']),
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [cash(d, -Number(vars['montant'])), moral(a, 10)] : [];
        },
      },
      {
        id: 'refuser',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [moral(a, -8), affinity(a, -5)] : [];
        },
      },
    ],
    defaultChoice: 'refuser',
  },
  {
    id: 'menace-burnout',
    category: 'artistes',
    weight: (d) => (roster(d).some((a) => a.fatigue >= 75) ? 6 : 0),
    cooldown: 12,
    when: (d) => roster(d).some((a) => a.fatigue >= 75),
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.fatigue >= 75);
      return a && about(a);
    },
    choices: [
      {
        id: 'repos',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [rest(a, 4), fatigue(a, -30), moral(a, 4)] : [];
        },
      },
      {
        id: 'forcer',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [moral(a, -15), loyalty(a, -6)] : [];
        },
      },
    ],
    defaultChoice: 'forcer',
  },
  {
    id: 'conflit-interne',
    category: 'artistes',
    weight: (d) => (d.relations.some((r) => r.type === 'rivalite') ? 4 : 0),
    cooldown: 26,
    when: (d) => d.relations.some((r) => r.type === 'rivalite'),
    prepare: (d, ctx) => {
      const rivalries = d.relations.filter((r) => r.type === 'rivalite');
      if (rivalries.length === 0) return null;
      const r = ctx.rng('evenements').pick(rivalries);
      const a = d.artistes.find((x) => x.id === r.a);
      const b = d.artistes.find((x) => x.id === r.b);
      return a && b ? { a: a.id, b: b.id, nom: a.nomScene, autre: b.nomScene } : null;
    },
    choices: [
      {
        id: 'mediation',
        when: (d) => d.label.tresorerie >= money.euros(2000),
        apply: (d, _c, vars) => {
          const rel = relationOf(d, Number(vars['a']), Number(vars['b']));
          if (rel) rel.valeur = Math.min(100, rel.valeur + 25);
          return [cash(d, -money.euros(2000)), { kind: 'relation', params: { delta: 25 } }];
        },
      },
      {
        id: 'ignorer',
        apply: (d, _c, vars) => {
          const rel = relationOf(d, Number(vars['a']), Number(vars['b']));
          if (rel) rel.valeur = Math.max(-100, rel.valeur - 10);
          const a = d.artistes.find((x) => x.id === Number(vars['a']));
          return [{ kind: 'relation', params: { delta: -10 } }, ...(a ? [moral(a, -4)] : [])];
        },
      },
    ],
    defaultChoice: 'ignorer',
  },
  {
    id: 'demande-augmentation',
    category: 'artistes',
    weight: (d) => (d.contrats.length > 0 ? 3 : 0),
    cooldown: 40,
    when: (d) => d.contrats.length > 0,
    prepare: (d, ctx) => {
      const a = pickArtist(
        d,
        ctx,
        (x) => d.contrats.some((c) => c.artisteId === x.id) && x.hype >= 20,
      );
      return a && about(a, { hausse: 500 });
    },
    choices: [
      {
        id: 'accepter',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          const c = d.contrats.find((k) => k.artisteId === Number(vars['artisteId']));
          if (c)
            c.clauses.royaltiesArtisteBps = Math.min(
              9000,
              c.clauses.royaltiesArtisteBps + Number(vars['hausse']),
            );
          return a ? [moral(a, 8), loyalty(a, 6)] : [];
        },
      },
      {
        id: 'refuser',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [moral(a, -6), loyalty(a, -8)] : [];
        },
      },
    ],
    defaultChoice: 'refuser',
  },
  {
    id: 'vol-idee',
    category: 'artistes',
    weight: (d) => (roster(d).length >= 2 ? 2 : 0),
    cooldown: 40,
    when: (d) => roster(d).length >= 2,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx);
      return a && about(a);
    },
    choices: [
      {
        id: 'defendre',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [hype(a, 6), reputation(d, -1)] : [];
        },
      },
      {
        id: 'calmer',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [moral(a, -3), reputation(d, 1)] : [];
        },
      },
    ],
    defaultChoice: 'calmer',
  },
  {
    id: 'retour-inattendu',
    category: 'artistes',
    weight: (d) => (roster(d).some((a) => a.phase === 'declin') ? 3 : 0),
    cooldown: 52,
    when: (d) => roster(d).some((a) => a.phase === 'declin' && a.retours < 2),
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.phase === 'declin' && x.retours < 2);
      return a && about(a);
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      if (!a) return [];
      a.phase = 'plateau';
      a.retours += 1;
      return [
        hype(a, 20),
        moral(a, 10),
        { kind: 'phase', params: { artisteId: a.id, phase: 'plateau' } },
      ];
    },
  },
  {
    id: 'inspiration',
    category: 'artistes',
    weight: 4,
    cooldown: 20,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx);
      return a && about(a);
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [skill(a, 'plume', 3), moral(a, 4)] : [];
    },
  },
  {
    id: 'blessure-voix',
    category: 'artistes',
    weight: 2,
    cooldown: 40,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.fatigue >= 40);
      return a && about(a);
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [skill(a, 'voix', -4), rest(a, 3), moral(a, -5)] : [];
    },
  },
  {
    id: 'fan-devoue',
    category: 'artistes',
    weight: 4,
    cooldown: 16,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx);
      return a && about(a);
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [hype(a, 10), fans(a, Math.max(200, Math.round(a.fanbase * 0.03)))] : [];
    },
  },
  {
    id: 'bonheur-prive',
    category: 'artistes',
    weight: 3,
    cooldown: 30,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx);
      return a && about(a);
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [moral(a, 8), affinity(a, 3)] : [];
    },
  },
  {
    id: 'depart-envisage',
    category: 'artistes',
    weight: (d) => (roster(d).some((a) => a.loyaute < 35) ? 5 : 0),
    cooldown: 30,
    when: (d) =>
      roster(d).some((a) => a.loyaute < 35 && d.contrats.some((c) => c.artisteId === a.id)),
    prepare: (d, ctx) => {
      const a = pickArtist(
        d,
        ctx,
        (x) => x.loyaute < 35 && d.contrats.some((c) => c.artisteId === x.id),
      );
      return a && about(a, { prime: money.euros(3000) });
    },
    choices: [
      {
        id: 'retenir',
        when: (d, vars) => d.label.tresorerie >= Number(vars['prime']),
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [cash(d, -Number(vars['prime'])), loyalty(a, 25), moral(a, 6)] : [];
        },
      },
      {
        id: 'laisser',
        apply: (d, ctx, vars) => {
          const c = d.contrats.find((k) => k.artisteId === Number(vars['artisteId']));
          if (c) c.echeance = Math.min(c.echeance, ctx.tick + 4);
          return [{ kind: 'contrat-raccourci', params: { artisteId: Number(vars['artisteId']) } }];
        },
      },
    ],
    defaultChoice: 'laisser',
  },
  {
    id: 'collaboration-spontanee',
    category: 'artistes',
    weight: (d) => (d.relations.some((r) => r.type === 'amitie') ? 4 : 0),
    cooldown: 26,
    when: (d) => d.relations.some((r) => r.type === 'amitie'),
    prepare: (d, ctx) => {
      const friends = d.relations.filter((r) => r.type === 'amitie');
      if (friends.length === 0) return null;
      const r = ctx.rng('evenements').pick(friends);
      const a = d.artistes.find((x) => x.id === r.a);
      const b = d.artistes.find((x) => x.id === r.b);
      return a && b ? { artisteId: a.id, autreId: b.id, nom: a.nomScene, autre: b.nomScene } : null;
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      const b = d.artistes.find((x) => x.id === Number(vars['autreId']));
      return a && b ? [hype(a, 7), hype(b, 7), fans(a, 300), fans(b, 300)] : [];
    },
  },
];
