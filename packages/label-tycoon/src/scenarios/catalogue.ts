import { type Rng, money } from '@tycoon/core';
import { generateCandidate } from '../staff';
import type { LabelState } from '../state';
import { signerArtisteDeDepart } from './depart';
import type { ScenarioDef } from './types';

const AN = 52;

/** Embauche directement un membre d'équipe (conditions de départ). */
function embaucher(state: LabelState, rng: Rng, n: number): void {
  for (let i = 0; i < n; i += 1) state.personnel.push(generateCandidate(state, rng));
}

/**
 * Catalogue des scénarios. Chaque scénario est une donnée : conditions de départ, objectifs, règles
 * et limite de temps. Les définitions vivent ici ; la partie ne garde que l'identifiant.
 */
const LISTE: readonly ScenarioDef[] = [
  {
    id: 'premier-disque-d-or',
    titre: 'Premier disque d’or',
    description:
      'Deux ans, 5 000 € en caisse : décroche ton premier disque d’or avant la fin du délai.',
    graine: 'scenario-premier-or',
    limiteSemaines: 2 * AN,
    objectifs: [{ type: 'certification', niveau: 'or' }],
    depart(state) {
      state.label.tresorerie = money.euros(5000);
    },
  },
  {
    id: 'sauver-un-label',
    titre: 'Sauver un label au bord de la faillite',
    description:
      'Un label endetté, une équipe à payer, presque rien en caisse. Remets les comptes à flot et tiens un an et demi.',
    graine: 'scenario-sauvetage',
    limiteSemaines: 78,
    objectifs: [{ type: 'tresorerie', min: money.euros(25_000) }, { type: 'survie' }],
    depart(state, rng) {
      state.label.tresorerie = money.euros(6000);
      state.label.reputation = 12;
      embaucher(state, rng, 1);
      state.prets.push({
        id: state.nextId,
        capital: money.euros(20_000),
        restant: money.euros(12_000),
        tauxBps: 1400,
        semainesRestantes: 156,
      });
      state.nextId += 1;
      signerArtisteDeDepart(state, rng, { level: 'espoir' });
    },
  },
  {
    id: 'imposer-un-genre',
    titre: 'Imposer un genre que personne n’écoute',
    description:
      'Le dancehall est dans les choux. Signe-en un artiste, bâtis ta crédibilité dans ce genre et place une sortie au classement.',
    graine: 'scenario-genre',
    limiteSemaines: 3 * AN,
    objectifs: [
      { type: 'credibilite', genre: 'dancehall', min: 60 },
      { type: 'classement', rang: 20 },
    ],
    depart(state, rng) {
      state.label.tresorerie = money.euros(15_000);
      const genre = state.marche.genres['dancehall'];
      if (genre) Object.assign(genre, { popularite: 12, base: 12 });
      signerArtisteDeDepart(state, rng, { level: 'espoir', genre: 'dancehall' });
    },
  },
  {
    id: 'dix-ans-un-seul-artiste',
    titre: 'Tenir dix ans avec un seul artiste',
    description:
      'Un seul artiste sous contrat, pas un de plus : fais durer ton label dix ans et fais-le grandir quand même.',
    graine: 'scenario-solo',
    limiteSemaines: 10 * AN,
    objectifs: [{ type: 'valorisation', min: money.euros(300_000) }, { type: 'survie' }],
    regles: [{ type: 'roster-max', max: 1 }],
    depart(state, rng) {
      state.label.tresorerie = money.euros(20_000);
      signerArtisteDeDepart(state, rng, { level: 'confirme', dureeAnnees: 5 });
    },
  },
  {
    id: 'label-etabli',
    titre: 'Six ans pour devenir un label établi',
    description:
      'Les rivaux sont plus agressifs et le marché ne te fait aucun cadeau. Atteins le palier Établi en six ans.',
    graine: 'scenario-etabli',
    limiteSemaines: 6 * AN,
    difficulte: { rivalAggression: 1.3 },
    objectifs: [{ type: 'palier', palier: 'etabli' }],
    depart(state) {
      state.label.tresorerie = money.euros(40_000);
    },
  },
  {
    id: 'relancer-une-legende',
    titre: 'Relancer une légende',
    description:
      'Une légende oubliée a signé chez toi, hype au plus bas. Remets-la en haut de l’affiche en deux ans.',
    graine: 'scenario-legende',
    limiteSemaines: 2 * AN,
    objectifs: [{ type: 'artiste-cible', hype: 80, fans: 250_000 }],
    depart(state, rng) {
      state.label.tresorerie = money.euros(25_000);
      const id = signerArtisteDeDepart(state, rng, { level: 'star', dureeAnnees: 3 });
      const legende = state.artistes.find((a) => a.id === id);
      if (legende) {
        Object.assign(legende, {
          age: 49,
          phase: 'declin',
          hype: 8,
          moral: 45,
          fanbase: 90_000,
        });
      }
      if (state.scenario) state.scenario.cible = id;
    },
  },
  {
    id: 'numero-un',
    titre: 'Numéro un en un an',
    description:
      'Un artiste prometteur, 8 000 € et cinquante-deux semaines : place une sortie en tête du classement.',
    graine: 'scenario-numero-un',
    limiteSemaines: AN,
    objectifs: [{ type: 'classement', rang: 1 }],
    depart(state, rng) {
      state.label.tresorerie = money.euros(8000);
      signerArtisteDeDepart(state, rng, { level: 'espoir' });
    },
  },
  {
    id: 'une-vraie-equipe',
    titre: 'Une vraie équipe',
    description:
      'Fais de ton label une maison : dix personnes à l’année, un catalogue qui se vend et de quoi payer tout le monde.',
    graine: 'scenario-equipe',
    limiteSemaines: 4 * AN,
    objectifs: [
      { type: 'equipe', min: 10 },
      { type: 'sorties', min: 8 },
      { type: 'tresorerie', min: money.euros(50_000) },
    ],
    depart(state) {
      state.label.tresorerie = money.euros(25_000);
    },
  },
];

export const SCENARIOS: Readonly<Record<string, ScenarioDef>> = Object.fromEntries(
  LISTE.map((s) => [s.id, s]),
);

export const ORDRE_SCENARIOS: readonly string[] = LISTE.map((s) => s.id);
