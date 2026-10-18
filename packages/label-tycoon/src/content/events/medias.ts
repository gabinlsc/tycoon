import { money } from '@tycoon/core';
import {
  type LabelEvent,
  about,
  cash,
  fans,
  fatigue,
  hype,
  mitigated,
  moral,
  pickArtist,
  project,
  pickProject,
  aboutProject,
  reputation,
  roster,
  target,
} from './helpers';

const any = () => true;
const hasRoster = (d: Parameters<typeof roster>[0]) => roster(d).length > 0;

/** Événements médias : presse, polémiques, interviews, buzz. */
export const MEDIA_EVENTS: readonly LabelEvent[] = [
  {
    id: 'clash-public',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 3 : 0),
    cooldown: 20,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, any);
      return a ? about(a) : null;
    },
    choices: [
      {
        id: 'repondre',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [hype(a, 8), reputation(d, mitigated(d, -1))] : [];
        },
      },
      {
        id: 'calmer',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [moral(a, -2)] : [];
        },
      },
    ],
    defaultChoice: 'calmer',
  },
  {
    id: 'polemique',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 3 : 0),
    cooldown: 30,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, any);
      return a ? about(a, { frais: money.euros(1500) }) : null;
    },
    choices: [
      {
        id: 'dementir',
        when: (d, vars) => d.label.tresorerie >= Number(vars['frais']),
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return [cash(d, -Number(vars['frais'])), ...(a ? [hype(a, mitigated(d, -2))] : [])];
        },
      },
      {
        id: 'assumer',
        followUps: [{ eventId: 'mauvais-buzz', afterWeeks: 3, chance: 0.5 }],
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [hype(a, 10), reputation(d, mitigated(d, -2))] : [];
        },
      },
    ],
    defaultChoice: 'dementir',
  },
  {
    id: 'mauvais-buzz',
    category: 'medias',
    weight: 0,
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [hype(a, mitigated(d, -8)), moral(a, mitigated(d, -4))] : [];
    },
  },
  {
    id: 'interview-ratee',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 3 : 0),
    cooldown: 20,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.charisme < 60);
      return a ? about(a) : null;
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [hype(a, mitigated(d, -6)), moral(a, mitigated(d, -4))] : [];
    },
  },
  {
    id: 'buzz-positif',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 4 : 0),
    cooldown: 12,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, any);
      return a ? about(a) : null;
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [hype(a, 12), fans(a, Math.max(150, Math.round(a.fanbase * 0.02)))] : [];
    },
  },
  {
    id: 'article-elogieux',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 3 : 0),
    cooldown: 20,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.plume >= 50);
      return a ? about(a) : null;
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [hype(a, 5), reputation(d, 1)] : [];
    },
  },
  {
    id: 'documentaire',
    category: 'medias',
    weight: (d) => (roster(d).some((a) => a.fanbase > 20_000) ? 2 : 0),
    cooldown: 80,
    when: (d) => roster(d).some((a) => a.fanbase > 20_000),
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.fanbase > 20_000);
      return a ? about(a, { cout: money.euros(3000) }) : null;
    },
    choices: [
      {
        id: 'accepter',
        when: (d, vars) => d.label.tresorerie >= Number(vars['cout']),
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a
            ? [
                cash(d, -Number(vars['cout'])),
                hype(a, 10),
                fans(a, Math.round(a.fanbase * 0.05)),
                fatigue(a, 4),
              ]
            : [];
        },
      },
      { id: 'refuser' },
    ],
    defaultChoice: 'refuser',
  },
  {
    id: 'rumeur-couple',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 2 : 0),
    cooldown: 30,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, any);
      return a ? about(a) : null;
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [moral(a, mitigated(d, -3)), hype(a, 4)] : [];
    },
  },
  {
    id: 'passage-tv',
    category: 'medias',
    weight: (d) => (roster(d).some((a) => a.fanbase > 5000) ? 3 : 0),
    cooldown: 26,
    when: (d) => roster(d).some((a) => a.fanbase > 5000),
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, (x) => x.fanbase > 5000);
      return a ? about(a) : null;
    },
    choices: [
      {
        id: 'accepter',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [fans(a, Math.round(a.fanbase * 0.04)), hype(a, 7), fatigue(a, 5)] : [];
        },
      },
      { id: 'refuser' },
    ],
    defaultChoice: 'accepter',
  },
  {
    id: 'critique-assassine',
    category: 'medias',
    weight: (d) => (d.projets.some((p) => p.statut === 'sortie') ? 3 : 0),
    cooldown: 26,
    when: (d) => d.projets.some((p) => p.statut === 'sortie'),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, (x) => x.statut === 'sortie');
      return p ? aboutProject(d, p) : null;
    },
    apply: (d, _c, vars) => {
      const p = project(d, vars);
      if (p) p.s1 = Math.round(p.s1 * (1 + mitigated(d, -10) / 100));
      return [
        { kind: 'streams', params: { projetId: Number(vars['projetId']), pct: mitigated(d, -10) } },
      ];
    },
  },
  {
    id: 'influenceur-fan',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 4 : 0),
    cooldown: 12,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, any);
      return a ? about(a) : null;
    },
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [fans(a, Math.max(300, Math.round(a.fanbase * 0.03))), hype(a, 5)] : [];
    },
  },
  {
    id: 'fausse-information',
    category: 'medias',
    weight: (d) => (hasRoster(d) ? 2 : 0),
    cooldown: 30,
    when: hasRoster,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx, any);
      return a ? about(a, { frais: money.euros(1000) }) : null;
    },
    choices: [
      {
        id: 'dementir',
        when: (d, vars) => d.label.tresorerie >= Number(vars['frais']),
        apply: (d, _c, vars) => [cash(d, -Number(vars['frais'])), reputation(d, 1)],
      },
      {
        id: 'ignorer',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [hype(a, mitigated(d, -5)), moral(a, mitigated(d, -3))] : [];
        },
      },
    ],
    defaultChoice: 'ignorer',
  },
];
