import { cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { CONTRACTS, describeRejection, labelGame, newGame, utilityOf } from './index';
import type { Clauses } from './index';
import { Rng } from '@tycoon/core';
import { scoutTalents } from './index';

const fair = (): Clauses => ({
  avance: money.euros(2000),
  royaltiesArtisteBps: 4500,
  dureeAnnees: 2,
  exclusivite: false,
  part360Bps: 0,
  clauseRachat: cents(0),
});

const withTalent = () => {
  const session = newGame('ctr');
  session.engine.data.label.tresorerie = money.euros(100_000);
  scoutTalents(session.engine.data, Rng.fromSeed('t'), 'plateforme', 0);
  const artist = session.engine.data.artistes[0];
  if (!artist) throw new Error('artiste attendu');
  return { session, artist };
};

describe("modèle d'utilité", () => {
  it('somme ses termes et récompense une meilleure offre', () => {
    const { artist } = withTalent();
    const base = utilityOf(artist, fair(), 50);
    expect(base.total).toBeCloseTo(
      base.termes.reduce((s, t) => s + t.valeur, 0),
      9,
    );
    const better = utilityOf(artist, { ...fair(), royaltiesArtisteBps: 6500 }, 50);
    expect(better.total).toBeGreaterThan(base.total);
    const worse = utilityOf(artist, { ...fair(), exclusivite: true, part360Bps: 4000 }, 50);
    expect(worse.total).toBeLessThan(base.total);
  });
});

describe('signature', () => {
  it("lie l'artiste au label, verse l'avance et crée un contrat unique", () => {
    const { session, artist } = withTalent();
    const offer = {
      ...fair(),
      avance: money.euros(6000),
      royaltiesArtisteBps: 7500,
    };
    const before = session.engine.data.label.tresorerie;
    const result = labelGame.dispatch(session, {
      type: 'signer',
      artisteId: artist.id,
      clauses: offer,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.session.engine.data;
    expect(data.label.tresorerie).toBe(before - offer.avance);
    expect(data.contrats).toHaveLength(1);
    expect(data.artistes.find((a) => a.id === artist.id)?.employeur).toBe('joueur');
    expect(data.suivis.some((p) => p.artisteId === artist.id)).toBe(false);
    const again = labelGame.dispatch(result.session, {
      type: 'signer',
      artisteId: artist.id,
      clauses: offer,
    });
    expect(again).toMatchObject({ ok: false, rejection: { code: 'artiste-indisponible' } });
  });

  it('refuse une offre insuffisante, des clauses hors bornes et un budget trop juste', () => {
    const { session, artist } = withTalent();
    const lowball = {
      ...fair(),
      royaltiesArtisteBps: 1000,
      avance: cents(0),
      exclusivite: true,
      dureeAnnees: 6,
    };
    const r = labelGame.dispatch(session, {
      type: 'signer',
      artisteId: artist.id,
      clauses: lowball,
    });
    expect(r).toMatchObject({ ok: false, rejection: { code: 'offre-refusee' } });
    if (!r.ok) expect(describeRejection(r.rejection)).toContain('refuse');
    expect(
      labelGame.dispatch(session, {
        type: 'signer',
        artisteId: artist.id,
        clauses: { ...fair(), dureeAnnees: 99 },
      }),
    ).toMatchObject({ ok: false, rejection: { code: 'clauses-invalides' } });
    session.engine.data.label.tresorerie = cents(10);
    expect(
      labelGame.dispatch(session, {
        type: 'signer',
        artisteId: artist.id,
        clauses: { ...fair(), royaltiesArtisteBps: 6500 },
      }),
    ).toMatchObject({ ok: false, rejection: { code: 'fonds-insuffisants' } });
    expect(CONTRACTS.acceptThreshold).toBe(0);
  });
});
