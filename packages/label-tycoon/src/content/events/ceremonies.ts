import { money } from '@tycoon/core';
import { type LabelEvent, cash, fatigue, hype, moral, reputation, target } from './helpers';

/** Événements des cérémonies : ils ne sont pas tirés au sort, la remise de prix les déclenche. */
export const CEREMONY_EVENTS: readonly LabelEvent[] = [
  {
    id: 'nomination-recue',
    category: 'ceremonies',
    weight: 0,
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [hype(a, 6), moral(a, 5)] : [];
    },
  },
  {
    id: 'tapis-rouge',
    category: 'ceremonies',
    weight: 0,
    prepare: () => ({ tenue: money.euros(3000) }),
    choices: [
      {
        id: 'luxe',
        when: (d, vars) => d.label.tresorerie >= Number(vars['tenue']),
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return [cash(d, -Number(vars['tenue'])), ...(a ? [hype(a, 8)] : [])];
        },
      },
      {
        id: 'sobre',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return a ? [hype(a, 2)] : [];
        },
      },
    ],
    defaultChoice: 'sobre',
  },
  {
    id: 'prix-remporte',
    category: 'ceremonies',
    weight: 0,
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [moral(a, 15), { kind: 'prix', params: { artisteId: a.id } }] : [];
    },
  },
  {
    id: 'discours-gagnant',
    category: 'ceremonies',
    weight: 0,
    choices: [
      {
        id: 'sincere',
        apply: (d) => [reputation(d, 1)],
      },
      {
        id: 'provocateur',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return [reputation(d, -1), ...(a ? [hype(a, 10)] : [])];
        },
      },
    ],
    defaultChoice: 'sincere',
  },
  {
    id: 'prix-perdu',
    category: 'ceremonies',
    weight: 0,
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [moral(a, -6)] : [];
    },
  },
  {
    id: 'boycott',
    category: 'ceremonies',
    weight: 0,
    apply: (d, _c, vars) => {
      const a = target(d, vars);
      return a ? [hype(a, -4), moral(a, 3)] : [];
    },
  },
  {
    id: 'after-party',
    category: 'ceremonies',
    weight: 0,
    prepare: () => ({ budget: money.euros(2500) }),
    choices: [
      {
        id: 'faire-la-fete',
        when: (d, vars) => d.label.tresorerie >= Number(vars['budget']),
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return [cash(d, -Number(vars['budget'])), ...(a ? [hype(a, 5), fatigue(a, 5)] : [])];
        },
      },
      { id: 'rentrer' },
    ],
    defaultChoice: 'rentrer',
  },
  {
    id: 'label-de-l-annee',
    category: 'ceremonies',
    weight: 0,
    apply: (d) => [reputation(d, 1)],
  },
];
