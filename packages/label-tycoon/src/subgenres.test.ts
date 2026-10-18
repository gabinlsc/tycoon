import { Rng } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  SUBGENRES,
  claimSubgenre,
  genreKeys,
  labelGame,
  newGame,
  subgenrePopularity,
} from './index';
import type { SousGenre } from './index';

const sub = (over: Partial<SousGenre> = {}): SousGenre => ({
  id: 'sg-1',
  nom: 'Néo Rap',
  parent: 'rap',
  naissance: 0,
  duree: 100,
  pic: 80,
  premier: null,
  ...over,
});

describe('cycle de vie', () => {
  it('monte, culmine à mi-vie puis retombe à zéro', () => {
    const s = sub();
    expect(subgenrePopularity(s, 0)).toBe(0);
    expect(subgenrePopularity(s, 50)).toBe(80);
    expect(subgenrePopularity(s, 25)).toBeGreaterThan(0);
    expect(subgenrePopularity(s, 25)).toBeLessThan(80);
    expect(subgenrePopularity(s, 100)).toBe(0);
  });
});

describe('dans la simulation', () => {
  it('des sous-genres naissent et disparaissent, jamais plus que le maximum, rejouablement', () => {
    const born: string[] = [];
    const gone: string[] = [];
    let session = newGame('sg');
    let maxAlive = 0;
    for (let w = 0; w < 1500; w += 52) {
      const r = labelGame.advance(session, 52);
      session = r.session;
      maxAlive = Math.max(maxAlive, session.engine.data.sousGenres.length);
      for (const s of r.signals) {
        if (s.kind === 'sous-genre-ne') born.push(String(s.payload?.id));
        if (s.kind === 'sous-genre-disparu') gone.push(String(s.payload?.id));
      }
    }
    expect(born.length).toBeGreaterThan(0);
    expect(gone.length).toBeGreaterThan(0);
    expect(maxAlive).toBeLessThanOrEqual(SUBGENRES.maxAlive);
    const alive = session.engine.data.sousGenres.map((s) => s.id);
    for (const id of gone) expect(genreKeys(session.engine.data.marche)).not.toContain(id);
    for (const id of alive) expect(genreKeys(session.engine.data.marche)).toContain(id);
    const again = labelGame.advance(newGame('sg'), 1508).session.engine.data.sousGenres;
    expect(again).toEqual(session.engine.data.sousGenres);
    void Rng;
  });
});

describe('premier signataire', () => {
  it('gagne un bonus de crédibilité, une seule fois', () => {
    const d = newGame('first').engine.data;
    d.sousGenres.push(sub());
    d.label.credibilite['sg-1'] = 0;
    expect(claimSubgenre(d, 'sg-1', 'joueur')).toBe(true);
    expect(d.label.credibilite['sg-1']).toBe(SUBGENRES.firstSignerCredibility);
    expect(claimSubgenre(d, 'sg-1', 'joueur')).toBe(false);
    expect(d.label.credibilite['sg-1']).toBe(SUBGENRES.firstSignerCredibility);
    expect(claimSubgenre(d, 'rap', 'joueur')).toBe(false);
  });
});
