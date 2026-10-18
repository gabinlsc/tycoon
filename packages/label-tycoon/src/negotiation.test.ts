import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  NEGOTIATION,
  counterOffer,
  evaluateOffer,
  gaugeOf,
  labelGame,
  newGame,
  scoutTalents,
  utilityOf,
} from './index';
import type { Clauses } from './index';

const clauses = (over: Partial<Clauses> = {}): Clauses => ({
  avance: money.euros(2000),
  royaltiesArtisteBps: 4000,
  dureeAnnees: 3,
  exclusivite: true,
  part360Bps: 2000,
  clauseRachat: cents(0),
  ...over,
});

const setup = () => {
  const session = newGame('neg');
  session.engine.data.label.tresorerie = money.euros(200_000);
  scoutTalents(session.engine.data, Rng.fromSeed('n'), 'plateforme', 0);
  const artist = session.engine.data.artistes[0];
  if (!artist) throw new Error('artiste attendu');
  return { session, artist };
};

describe('contre-proposition', () => {
  it("est toujours acceptée par l'artiste quand elle aboutit", () => {
    const { session, artist } = setup();
    const rep = session.engine.data.label.reputation;
    const counter = counterOffer(artist, clauses(), rep);
    expect(utilityOf(artist, counter, rep).total).toBeGreaterThanOrEqual(0);
    expect(evaluateOffer(artist, counter, rep)).toBe('accepte');
  });
  it("la jauge monte avec l'utilité", () => {
    expect(gaugeOf(-100)).toBe('mecontent');
    expect(gaugeOf(-5)).toBe('hesitant');
    expect(gaugeOf(1)).toBe('interesse');
    expect(gaugeOf(50)).toBe('enthousiaste');
  });
});

describe('action proposer', () => {
  it('accepte une bonne offre en signant', () => {
    const { session, artist } = setup();
    const rep = session.engine.data.label.reputation;
    const good = counterOffer(artist, clauses(), rep);
    const r = labelGame.dispatch(session, {
      type: 'proposer',
      artisteId: artist.id,
      clauses: good,
    });
    expect(r.ok && r.session.engine.data.contrats).toHaveLength(1);
  });

  it('répond par une contre-proposition, limitée à trois', () => {
    const { session, artist } = setup();
    session.engine.data.label.reputation = 60;
    const near = clauses({
      royaltiesArtisteBps: 3500,
      avance: money.euros(900),
      exclusivite: false,
      part360Bps: 0,
      dureeAnnees: 3,
    });
    let s = session;
    let seen = 0;
    for (let i = 0; i < NEGOTIATION.maxCounters + 1; i += 1) {
      const r = labelGame.dispatch(s, { type: 'proposer', artisteId: artist.id, clauses: near });
      if (!r.ok) {
        expect(r.rejection.code).toBe('contre-propositions-epuisees');
        break;
      }
      s = r.session;
      const n = s.engine.data.negociations[0];
      if (n?.contre) seen += 1;
    }
    expect(seen).toBeGreaterThan(0);
    expect(seen).toBeLessThanOrEqual(NEGOTIATION.maxCounters);
  });

  it("une offre insultante coûte de l'affinité et rompt la négociation", () => {
    const { session, artist } = setup();
    const insult = clauses({ royaltiesArtisteBps: 1000, avance: cents(0), dureeAnnees: 6 });
    const before = artist.affinite;
    const r = labelGame.dispatch(session, {
      type: 'proposer',
      artisteId: artist.id,
      clauses: insult,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const after = r.session.engine.data.artistes.find((a) => a.id === artist.id);
    expect(after?.affinite).toBe(before - NEGOTIATION.insultAffinityLoss);
    expect(r.session.engine.data.negociations[0]?.rompue).toBe(true);
    const again = labelGame.dispatch(r.session, {
      type: 'proposer',
      artisteId: artist.id,
      clauses: clauses(),
    });
    expect(again).toMatchObject({ ok: false, rejection: { code: 'negociation-rompue' } });
  });
});
