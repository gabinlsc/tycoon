import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { CONCERTS, SYNC, labelGame, liveShare, newGame, scoutTalents } from './index';

const signed = (part360Bps: number) => {
  const s = newGame('c360');
  const d = s.engine.data;
  d.label.tresorerie = money.euros(500_000);
  scoutTalents(d, Rng.fromSeed('3'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.ego = 10;
  a.ethique = 10;
  a.affinite = 100;
  const r = labelGame.dispatch(s, {
    type: 'signer',
    artisteId: a.id,
    clauses: {
      avance: money.euros(9000),
      royaltiesArtisteBps: 8000,
      dureeAnnees: 2,
      exclusivite: false,
      part360Bps,
      clauseRachat: cents(0),
    },
  });
  if (!r.ok) throw new Error('signature attendue');
  return { s: r.session, id: a.id };
};

describe('part du label sur le live', () => {
  it('sans 360, le label ne garde que sa commission de base', () => {
    const { s, id } = signed(0);
    expect(liveShare(s.engine.data, id, 10_000, CONCERTS.commissionBps)).toBe(3500);
    expect(s.engine.data.contrats[0]?.recette360).toBe(0);
  });
  it('avec 360, il garde la base plus la part négociée, et cumule l’apport de la clause', () => {
    const { s, id } = signed(2000);
    expect(liveShare(s.engine.data, id, 10_000, CONCERTS.commissionBps)).toBe(5500);
    expect(s.engine.data.contrats[0]?.recette360).toBe(2000);
    liveShare(s.engine.data, id, 10_000, SYNC.labelBps);
    expect(s.engine.data.contrats[0]?.recette360).toBe(4000);
  });
  it('plafonne à la totalité du revenu', () => {
    const { s, id } = signed(5000);
    expect(liveShare(s.engine.data, id, 10_000, 9000)).toBeLessThanOrEqual(10_000);
  });
  it('sans contrat, seule la base s’applique', () => {
    const d = newGame('none').engine.data;
    expect(liveShare(d, 999, 10_000, 3500)).toBe(3500);
  });
});
