import { money } from '@tycoon/core';
import {
  type LabelEvent,
  aboutProject,
  affinity,
  cash,
  delay,
  hype,
  moral,
  pickProject,
  project,
  quality,
  reputation,
  sizedCost,
  target,
} from './helpers';

const inProduction = (p: { statut: string }) => p.statut === 'production';
const ready = (p: { statut: string; qualite: number | null }) =>
  p.statut === 'prete' && p.qualite !== null;

/** Événements de production : studio, fuites, samples, mixage, featurings. */
export const PRODUCTION_EVENTS: readonly LabelEvent[] = [
  {
    id: 'retard-studio',
    category: 'production',
    weight: (d) => (d.projets.some(inProduction) ? 4 : 0),
    cooldown: 12,
    when: (d) => d.projets.some(inProduction),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, inProduction);
      return p && aboutProject(d, p, { prime: money.euros(3000), semaines: 3 });
    },
    choices: [
      {
        id: 'heures-sup',
        when: (d, vars) => d.label.tresorerie >= Number(vars['prime']),
        apply: (d, _c, vars) => [cash(d, -Number(vars['prime']))],
      },
      {
        id: 'accepter-retard',
        apply: (d, _c, vars) => {
          const p = project(d, vars);
          return p ? [delay(p, Number(vars['semaines']))] : [];
        },
      },
    ],
    defaultChoice: 'accepter-retard',
  },
  {
    id: 'fuite-titre',
    category: 'production',
    weight: (d) => (d.projets.some(inProduction) ? 3 : 0),
    cooldown: 26,
    when: (d) => d.projets.some(inProduction),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, inProduction);
      return p && aboutProject(d, p, { frais: money.euros(2000) });
    },
    choices: [
      {
        id: 'plainte',
        when: (d, vars) => d.label.tresorerie >= Number(vars['frais']),
        apply: (d, _c, vars) => [cash(d, -Number(vars['frais'])), reputation(d, 1)],
      },
      {
        id: 'en-profiter',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [hype(a, 8), moral(a, -3)] : [];
        },
      },
    ],
    defaultChoice: 'en-profiter',
  },
  {
    id: 'sample-non-declare',
    category: 'production',
    weight: (d) => (d.projets.some((p) => inProduction(p) || ready(p)) ? 3 : 0),
    cooldown: 40,
    when: (d) => d.projets.some((p) => inProduction(p) || ready(p)),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, (x) => inProduction(x) || ready(x));
      return p && aboutProject(d, p, { reglement: money.euros(5000) });
    },
    choices: [
      {
        id: 'regler',
        when: (d, vars) => d.label.tresorerie >= Number(vars['reglement']),
        apply: (d, _c, vars) => [cash(d, -Number(vars['reglement']))],
      },
      {
        id: 'ignorer',
        followUps: [{ eventId: 'proces-sample', afterWeeks: 12, chance: 0.5 }],
        apply: () => [{ kind: 'risque-proces', params: {} }],
      },
    ],
    defaultChoice: 'ignorer',
  },
  {
    id: 'proces-sample',
    category: 'production',
    weight: 0,
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return [
        cash(d, -sizedCost(d, money.euros(15_000))),
        reputation(d, -2),
        ...(a ? [moral(a, -4)] : []),
      ];
    },
  },
  {
    id: 'featuring-surprise',
    category: 'production',
    weight: (d) => (d.projets.some(inProduction) ? 3 : 0),
    cooldown: 26,
    when: (d) => d.projets.some(inProduction),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, inProduction);
      return p && aboutProject(d, p, { cachet: money.euros(1500) });
    },
    choices: [
      {
        id: 'accepter',
        when: (d, vars) => d.label.tresorerie >= Number(vars['cachet']),
        apply: (d, _c, vars) => {
          const p = project(d, vars);
          const a = target(d, vars);
          if (p) p.studio = Math.min(100, p.studio + 8);
          return [cash(d, -Number(vars['cachet'])), ...(a ? [hype(a, 5)] : [])];
        },
      },
      { id: 'refuser' },
    ],
    defaultChoice: 'refuser',
  },
  {
    id: 'panne-materiel',
    category: 'production',
    weight: (d) => (d.projets.some(inProduction) ? 3 : 0),
    cooldown: 20,
    when: (d) => d.projets.some(inProduction),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, inProduction);
      return p && aboutProject(d, p);
    },
    apply: (d, _c, vars) => {
      const p = project(d, vars);
      return p
        ? [cash(d, -sizedCost(d, money.euros(1500))), delay(p, 1)]
        : [cash(d, -sizedCost(d, money.euros(1500)))];
    },
  },
  {
    id: 'session-inspiree',
    category: 'production',
    weight: (d) => (d.projets.some(ready) ? 3 : 0),
    cooldown: 16,
    when: (d) => d.projets.some(ready),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, ready);
      return p && aboutProject(d, p);
    },
    apply: (d, _c, vars) => {
      const p = project(d, vars);
      const a = target(d, vars);
      return [...(p ? [quality(p, 3)] : []), ...(a ? [moral(a, 4)] : [])];
    },
  },
  {
    id: 'producteur-star',
    category: 'production',
    weight: (d) => (d.projets.some(inProduction) ? 2 : 0),
    cooldown: 52,
    when: (d) => d.projets.some(inProduction),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, inProduction);
      return p && aboutProject(d, p, { cachet: money.euros(4000) });
    },
    choices: [
      {
        id: 'engager',
        when: (d, vars) => d.label.tresorerie >= Number(vars['cachet']),
        apply: (d, _c, vars) => {
          const p = project(d, vars);
          if (p) p.producteur = Math.min(100, p.producteur + 20);
          return [cash(d, -Number(vars['cachet']))];
        },
      },
      { id: 'decliner' },
    ],
    defaultChoice: 'decliner',
  },
  {
    id: 'mixage-rate',
    category: 'production',
    weight: (d) => (d.projets.some(ready) ? 3 : 0),
    cooldown: 26,
    when: (d) => d.projets.some(ready),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, ready);
      return p && aboutProject(d, p, { frais: money.euros(1500) });
    },
    choices: [
      {
        id: 'refaire',
        when: (d, vars) => d.label.tresorerie >= Number(vars['frais']),
        apply: (d, _c, vars) => [cash(d, -Number(vars['frais']))],
      },
      {
        id: 'tel-quel',
        apply: (d, _c, vars) => {
          const p = project(d, vars);
          return p ? [quality(p, -5)] : [];
        },
      },
    ],
    defaultChoice: 'tel-quel',
  },
  {
    id: 'clip-viral',
    category: 'production',
    weight: (d) => (d.projets.some((p) => p.statut === 'sortie' && p.clip !== 'aucun') ? 3 : 0),
    cooldown: 26,
    when: (d) => d.projets.some((p) => p.statut === 'sortie' && p.clip !== 'aucun'),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, (x) => x.statut === 'sortie' && x.clip !== 'aucun');
      return p && aboutProject(d, p);
    },
    apply: (d, _c, vars) => {
      const p = project(d, vars);
      const a = target(d, vars);
      if (p) p.s1 = Math.round(p.s1 * 1.15);
      return [
        { kind: 'streams', params: { projetId: Number(vars['projetId']), pct: 15 } },
        ...(a ? [hype(a, 6), affinity(a, 2)] : []),
      ];
    },
  },
  {
    id: 'pression-delai',
    category: 'production',
    weight: (d) => (d.projets.some(inProduction) ? 3 : 0),
    cooldown: 16,
    when: (d) => d.projets.some(inProduction),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, (x) => inProduction(x) && x.fin - x.debut >= 4);
      return p && aboutProject(d, p);
    },
    choices: [
      {
        id: 'accelerer',
        apply: (d, _c, vars) => {
          const p = project(d, vars);
          return p ? [delay(p, -1), quality(p, -2)] : [];
        },
      },
      { id: 'maintenir' },
    ],
    defaultChoice: 'maintenir',
  },
];
