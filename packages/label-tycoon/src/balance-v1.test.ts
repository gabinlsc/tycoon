import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  CREDIBILITY,
  CONTRACTS,
  ROSTER_CAP,
  STREAMS,
  certify,
  certificationThreshold,
  fairAdvance,
  firstWeekStreams,
  hitPotential,
  labelGame,
  newGame,
  prestigeFor,
  rosterCap,
  rosterFull,
  scoutTalents,
} from './index';
import { activeFans } from './formulas/streams';
import { CERTIFICATIONS } from './balance';
import type { Clauses } from './index';

const clauses = (avance: number): Clauses => ({
  avance: cents(avance),
  royaltiesArtisteBps: 6000,
  dureeAnnees: 2,
  exclusivite: false,
  part360Bps: 0,
  clauseRachat: cents(0),
});

describe('avance juste', () => {
  it('suit l’audience de l’artiste : plancher plus un montant par fan', () => {
    const s = newGame('avance');
    const a = scoutTalents(s.engine.data, Rng.fromSeed('a'), 'plateforme', 0)[0];
    if (!a) throw new Error('un talent est attendu');
    a.fanbase = 0;
    expect(fairAdvance(a)).toBe(CONTRACTS.advanceFloor);
    a.fanbase = 100_000;
    expect(fairAdvance(a)).toBe(CONTRACTS.advanceFloor + 100_000 * CONTRACTS.advancePerFan);
    a.fanbase = 5_000_000;
    expect(fairAdvance(a)).toBeGreaterThan(money.euros(100_000));
  });
});

describe('plafond du roster', () => {
  const rempli = (n: number) => {
    const s = newGame('roster');
    const d = s.engine.data;
    scoutTalents(d, Rng.fromSeed('r'), 'plateforme', 0, null);
    for (let i = 0; i < 4; i += 1) scoutTalents(d, Rng.fromSeed(`r${i}`), 'open-mic', 0, null);
    const artistes = d.artistes.filter((a) => a.employeur === 'libre');
    for (const a of artistes.slice(0, n)) a.employeur = 'joueur';
    return { s, d, libres: d.artistes.filter((a) => a.employeur === 'libre') };
  };
  it('augmente avec le palier', () => {
    expect(ROSTER_CAP['independant']).toBeGreaterThan(ROSTER_CAP['home-studio']);
    expect(ROSTER_CAP['etabli']).toBeGreaterThan(ROSTER_CAP['independant']);
    expect(ROSTER_CAP['major']).toBeGreaterThan(ROSTER_CAP['etabli']);
  });
  it('refuse une signature de plus quand le plafond est atteint', () => {
    const { s, d, libres } = rempli(ROSTER_CAP['home-studio']);
    expect(rosterFull(d)).toBe(true);
    const cible = libres[0];
    if (!cible) throw new Error('un talent libre est attendu');
    d.label.tresorerie = money.euros(500_000);
    const r = labelGame.dispatch(s, {
      type: 'signer',
      artisteId: cible.id,
      clauses: clauses(money.euros(20_000)),
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejection.code).toBe('roster-plein');
    expect(rosterCap(d)).toBe(ROSTER_CAP['home-studio']);
  });
  it('laisse signer tant qu’il reste de la place', () => {
    const { d } = rempli(ROSTER_CAP['home-studio'] - 1);
    expect(rosterFull(d)).toBe(false);
  });
  it('ne limite pas le bac à sable', () => {
    const { d } = rempli(ROSTER_CAP['home-studio']);
    d.config.sandbox = true;
    expect(rosterFull(d)).toBe(false);
  });
});

describe('fans actifs', () => {
  it('comptent tous les fans jusqu’au seuil, puis de moins en moins', () => {
    expect(activeFans(0)).toBe(0);
    expect(activeFans(STREAMS.fanKnee)).toBeCloseTo(STREAMS.fanKnee);
    expect(activeFans(STREAMS.fanKnee - 1)).toBe(STREAMS.fanKnee - 1);
    expect(activeFans(STREAMS.fanKnee * 40)).toBeLessThan(STREAMS.fanKnee * 40);
    expect(activeFans(STREAMS.fanKnee * 40)).toBeGreaterThan(activeFans(STREAMS.fanKnee * 10));
  });
  it('est continue au seuil', () => {
    const k = STREAMS.fanKnee;
    expect(Math.abs(activeFans(k + 1) - activeFans(k))).toBeLessThan(2);
  });
  it('freine les premières semaines d’une star sans toucher à un petit artiste', () => {
    expect(firstWeekStreams(1000, 0, 1)).toBe(1000 * STREAMS.listensPerFan);
    const star = firstWeekStreams(8_000_000, 0, 1);
    expect(star).toBeLessThan(8_000_000 * STREAMS.listensPerFan);
    expect(star).toBeGreaterThan(firstWeekStreams(1_000_000, 0, 1));
  });
});

describe('crédibilité de genre', () => {
  it('augmente le potentiel de hit, proportionnellement', () => {
    const sans = hitPotential(60, 1, 20, 1).value;
    const mi = hitPotential(60, 1, 20, 1, 50).value;
    const plein = hitPotential(60, 1, 20, 1, 100).value;
    expect(plein / sans).toBeCloseTo(1 + CREDIBILITY.hitBonus);
    expect(mi).toBeGreaterThan(sans);
    expect(mi).toBeLessThan(plein);
  });
  it('augmente le prestige aux yeux d’un artiste du genre', () => {
    const s = newGame('prestige');
    const a = scoutTalents(s.engine.data, Rng.fromSeed('p'), 'plateforme', 0)[0];
    if (!a) throw new Error('un talent est attendu');
    const avant = prestigeFor(s.engine.data, a);
    s.engine.data.label.credibilite[a.genre] = 40;
    expect(prestigeFor(s.engine.data, a)).toBeCloseTo(avant + 40 * CREDIBILITY.prestigeWeight);
  });
  it('se gagne avec une certification, dans le genre de l’artiste', () => {
    const s = newGame('cred-cert');
    const d = s.engine.data;
    const a = scoutTalents(d, Rng.fromSeed('c'), 'plateforme', 0)[0];
    if (!a) throw new Error('un talent est attendu');
    d.projets.push({
      id: 999,
      artisteId: a.id,
      type: 'single',
      clip: 'aucun',
      studio: 1,
      producteur: 1,
      mixage: 0,
      debut: 0,
      fin: 0,
      retard: 0,
      statut: 'sortie',
      qualite: 50,
      sortieLe: 0,
      s1: 0,
      hit: 0,
      viral: null,
      streams: certificationThreshold('or', 'single') * CERTIFICATIONS.streamsPerSale,
      derniers: 0,
      certification: null,
    });
    const avant = d.label.credibilite[a.genre] ?? 0;
    certify(d, () => undefined);
    expect(d.label.credibilite[a.genre]).toBe(avant + CREDIBILITY.certificationGain.or);
  });
});
