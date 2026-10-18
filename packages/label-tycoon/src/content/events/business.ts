import { money } from '@tycoon/core';
import { generateCandidate, salaryFor } from '../../staff';
import { releaseValue } from '../../valuation';
import {
  type LabelEvent,
  about,
  aboutProject,
  cash,
  legalCost,
  moral,
  pickArtist,
  pickProject,
  project,
  reputation,
  roster,
  target,
} from './helpers';

const released = (p: { statut: string; s1: number }) => p.statut === 'sortie' && p.s1 > 0;

/** Événements business : offres, litiges, subventions, partenariats, recrutement. */
export const BUSINESS_EVENTS: readonly LabelEvent[] = [
  {
    id: 'offre-synchro-exceptionnelle',
    category: 'business',
    weight: (d) => (d.projets.some(released) ? 3 : 0),
    cooldown: 40,
    when: (d) => d.projets.some(released),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, released);
      return p ? aboutProject(d, p) : null;
    },
    apply: (d, ctx, vars) => {
      d.offresSynchro.push({
        id: d.nextId,
        projetId: Number(vars['projetId']),
        type: 'film',
        marque: 'Studio Lumière',
        cachet: money.euros(45_000),
        expire: ctx.tick + 6,
      });
      d.nextId += 1;
      return [{ kind: 'offre-synchro', params: { projetId: Number(vars['projetId']) } }];
    },
  },
  {
    id: 'rachat-catalogue',
    category: 'business',
    weight: (d) => (d.projets.some(released) ? 2 : 0),
    cooldown: 80,
    when: (d) => d.projets.some(released),
    prepare: (d, ctx) => {
      const p = pickProject(d, ctx, released);
      return p
        ? aboutProject(d, p, { prix: Math.round(releaseValue(d, p.id, ctx.tick) * 1.1) })
        : null;
    },
    choices: [
      {
        id: 'vendre',
        when: (_d, vars) => Number(vars['prix']) > 0,
        apply: (d, _c, vars) => {
          const p = project(d, vars);
          if (p) p.s1 = 0;
          return [cash(d, Number(vars['prix']))];
        },
      },
      { id: 'garder' },
    ],
    defaultChoice: 'garder',
  },
  {
    id: 'inspection',
    category: 'business',
    weight: 3,
    cooldown: 52,
    apply: (d) => [cash(d, -legalCost(d, money.euros(2500)))],
  },
  {
    id: 'proces-ancien-employe',
    category: 'business',
    weight: (d) => (d.personnel.length > 0 ? 2 : 0),
    cooldown: 80,
    when: (d) => d.personnel.length > 0,
    apply: (d) => [cash(d, -legalCost(d, money.euros(8000))), reputation(d, -1)],
  },
  {
    id: 'subvention-culturelle',
    category: 'business',
    weight: 3,
    cooldown: 104,
    apply: (d) => [cash(d, money.euros(8000)), reputation(d, 1)],
  },
  {
    id: 'litige-fiscal',
    category: 'business',
    weight: (d) => (d.finances.annees.length > 0 ? 2 : 0),
    cooldown: 104,
    when: (d) => d.finances.annees.length > 0,
    prepare: () => ({ somme: money.euros(6000) }),
    choices: [
      {
        id: 'contester',
        apply: (d, _c, vars) => [cash(d, -Math.round(legalCost(d, Number(vars['somme'])) / 2))],
      },
      {
        id: 'payer',
        apply: (d, _c, vars) => [cash(d, -Number(vars['somme']))],
      },
    ],
    defaultChoice: 'payer',
  },
  {
    id: 'partenariat-marque',
    category: 'business',
    weight: (d) => (roster(d).length > 0 ? 3 : 0),
    cooldown: 40,
    when: (d) => roster(d).length > 0,
    prepare: (d, ctx) => {
      const a = pickArtist(d, ctx);
      return a ? about(a, { cachet: money.euros(6000) }) : null;
    },
    choices: [
      {
        id: 'accepter',
        apply: (d, _c, vars) => {
          const a = target(d, vars);
          return [cash(d, Number(vars['cachet'])), ...(a ? [moral(a, -3)] : [])];
        },
      },
      { id: 'refuser' },
    ],
    defaultChoice: 'refuser',
  },
  {
    id: 'cyberattaque',
    category: 'business',
    weight: 2,
    cooldown: 104,
    apply: (d) => {
      for (const p of d.projets) if (p.statut === 'production') p.fin += 1;
      return [cash(d, -money.euros(4000)), { kind: 'retard-general', params: { semaines: 1 } }];
    },
  },
  {
    id: 'don-de-mecene',
    category: 'business',
    weight: 2,
    cooldown: 104,
    apply: (d) => [cash(d, money.euros(5000))],
  },
  {
    id: 'talent-du-metier',
    category: 'business',
    weight: 3,
    cooldown: 40,
    apply: (d, ctx) => {
      const candidate = generateCandidate(d, ctx.rng('personnel'));
      candidate.niveau = 90;
      candidate.salaire = salaryFor(90);
      d.candidats.push(candidate);
      return [{ kind: 'candidat', params: { membreId: candidate.id } }];
    },
  },
  {
    id: 'hausse-loyer',
    category: 'business',
    weight: 2,
    cooldown: 104,
    apply: (d) => [cash(d, -money.euros(3000))],
  },
];
