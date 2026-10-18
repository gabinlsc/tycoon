import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { RIVALS, labelGame, newGame, rivalBid, scoutTalents } from './index';
import type { Clauses } from './index';

const clauses = (over: Partial<Clauses> = {}): Clauses => ({
  avance: money.euros(5000),
  royaltiesArtisteBps: 7000,
  dureeAnnees: 2,
  exclusivite: false,
  part360Bps: 0,
  clauseRachat: 0 as never,
  ...over,
});

const setup = (seed = 'ench') => {
  const session = newGame(seed);
  session.engine.data.label.tresorerie = money.euros(500_000);
  scoutTalents(session.engine.data, Rng.fromSeed('e'), 'plateforme', 0);
  const artist = session.engine.data.artistes[0];
  if (!artist) throw new Error('artiste attendu');
  return { session, artist };
};

describe('rivaux de départ', () => {
  it('sont générés avec la partie, de façon déterministe', () => {
    const a = newGame('r1').engine.data.rivaux;
    expect(a).toHaveLength(RIVALS.count);
    expect(newGame('r1').engine.data.rivaux).toEqual(a);
  });
  it('un rival sans budget ne surenchérit pas', () => {
    const { session, artist } = setup();
    const rival = {
      ...(session.engine.data.rivaux[0] as never as {
        id: number;
        nom: string;
        style: 'prudent';
        tresorerie: number;
      }),
      tresorerie: 10,
    };
    expect(rivalBid(rival, artist, clauses())).toBeNull();
  });
});

describe('enchère', () => {
  it("une offre très généreuse l'emporte et signe l'artiste", () => {
    const { session, artist } = setup();
    const r = labelGame.dispatch(session, {
      type: 'encherir',
      artisteId: artist.id,
      clauses: clauses({ avance: money.euros(900_000 / 10), royaltiesArtisteBps: 9000 }),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.engine.data.artistes[0]?.employeur).toBe('joueur');
    expect(r.signals.some((s) => s.kind === 'enchere')).toBe(true);
  });

  it("un rival peut l'emporter sur une offre trop faible, de façon rejouable", () => {
    const run = () => {
      const { session, artist } = setup('ench2');
      session.engine.data.config.difficulty.rivalAggression = 5;
      const r = labelGame.dispatch(session, {
        type: 'encherir',
        artisteId: artist.id,
        clauses: clauses({ avance: money.euros(1), royaltiesArtisteBps: 1000, dureeAnnees: 6 }),
      });
      return r.ok ? r.session.engine.data.artistes[0]?.employeur : 'refus';
    };
    const who = run();
    expect(who).not.toBe('joueur');
    expect(run()).toBe(who);
  });
});
