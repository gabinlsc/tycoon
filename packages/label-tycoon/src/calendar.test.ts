import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  RIVAL_RELEASES,
  announcedReleases,
  collisionFactor,
  labelGame,
  newGame,
  scoutTalents,
} from './index';

describe('sorties des rivaux', () => {
  it('sont planifiées dans le futur, certaines annoncées, de façon rejouable', () => {
    const run = () => {
      const session = newGame('cal');
      session.engine.data.config.difficulty.rivalAggression = 3;
      return labelGame.advance(session, 150).session.engine.data;
    };
    const a = run();
    expect(a.sortiesRivales.length).toBeGreaterThan(0);
    expect(announcedReleases(a, 0).every((s) => s.annoncee)).toBe(true);
    expect(run().sortiesRivales).toEqual(a.sortiesRivales);
  });

  it('purgent les sorties trop anciennes', () => {
    const session = newGame('cal2');
    session.engine.data.config.difficulty.rivalAggression = 3;
    const d = labelGame.advance(session, 200).session.engine.data;
    expect(d.sortiesRivales.every((s) => s.semaine >= 200 - RIVAL_RELEASES.keepWeeks - 1)).toBe(
      true,
    );
  });
});

describe('collision', () => {
  it("réduit l'exposition quand une grosse sortie rivale tombe le même jour dans le même genre", () => {
    const d = newGame('col').engine.data;
    d.sortiesRivales.push({
      id: 99,
      rivalId: 1,
      genre: 'rap',
      semaine: 10,
      poids: 8,
      annoncee: true,
      artisteId: null,
    });
    expect(collisionFactor(d, 'rap', 10)).toBe(RIVAL_RELEASES.collisionFactor);
    expect(collisionFactor(d, 'rap', 11)).toBe(1);
    expect(collisionFactor(d, 'pop', 10)).toBe(1);
    if (d.sortiesRivales[0]) d.sortiesRivales[0].poids = 1;
    expect(collisionFactor(d, 'rap', 10)).toBe(1);
  });

  it('pénalise les streams de première semaine à la sortie', () => {
    const make = (clash: boolean) => {
      const session = newGame('col2');
      const d = session.engine.data;
      d.label.tresorerie = money.euros(500_000);
      scoutTalents(d, Rng.fromSeed('c'), 'plateforme', 0);
      const artist = d.artistes[0];
      if (!artist) throw new Error('artiste attendu');
      artist.employeur = 'joueur';
      artist.fanbase = 30_000;
      d.projets.push({
        id: 500,
        artisteId: artist.id,
        type: 'single',
        clip: 'aucun',
        studio: 50,
        producteur: 50,
        mixage: 0,
        debut: 0,
        fin: 0,
        retard: 0,
        statut: 'prete',
        qualite: 70,
        sortieLe: null,
        s1: 0,
        hit: 0,
        viral: null,
        derniers: 0,
        certification: null,
        streams: 0,
      });
      if (clash)
        d.sortiesRivales.push({
          id: 501,
          rivalId: 1,
          genre: artist.genre,
          semaine: 0,
          poids: 8,
          annoncee: false,
          artisteId: null,
        });
      const r = labelGame.dispatch(session, { type: 'sortir-projet', projetId: 500 });
      if (!r.ok) throw new Error('sortie attendue');
      return r.session.engine.data.projets[0]?.s1 ?? 0;
    };
    expect(make(true)).toBeLessThan(make(false));
  });
});
