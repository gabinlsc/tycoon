import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  BANKRUPTCY,
  contractPrice,
  isBankrupt,
  labelGame,
  newGame,
  scoutTalents,
  weeksLeft,
} from './index';

const broke = () => {
  const s = newGame('fail');
  s.engine.data.label.tresorerie = cents(-1_000_000);
  return s;
};

describe('compteur', () => {
  it('compte les semaines négatives, alerte avec auto-pause, puis termine la partie à huit', () => {
    const s = broke();
    const first = labelGame.advance(s, 1);
    expect(first.session.engine.data.faillite.semaines).toBe(1);
    expect(first.signals.some((x) => x.kind === 'alerte-faillite' && x.interrupt)).toBe(true);
    expect(weeksLeft(first.session.engine.data)).toBe(BANKRUPTCY.weeks - 1);
    let session = first.session;
    let lost = false;
    for (let i = 0; i < BANKRUPTCY.weeks; i += 1) {
      const r = labelGame.advance(session, 1);
      session = r.session;
      if (r.signals.some((x) => x.kind === 'faillite')) lost = true;
    }
    expect(lost).toBe(true);
    expect(isBankrupt(session.engine.data)).toBe(true);
  });

  it('remet le compteur à zéro dès le retour au positif, et ignore le bac à sable', () => {
    const s = broke();
    const two = labelGame.advance(s, 2).session;
    expect(two.engine.data.faillite.semaines).toBe(2);
    two.engine.data.label.tresorerie = money.euros(50_000);
    expect(labelGame.advance(two, 1).session.engine.data.faillite.semaines).toBe(0);
    const sandbox = broke();
    sandbox.engine.data.config.sandbox = true;
    expect(labelGame.advance(sandbox, 12).session.engine.data.faillite.semaines).toBe(0);
  });
});

describe('vente de contrat', () => {
  it('libère le label du contrat contre un prix, et donne l’artiste au rival', () => {
    const s = newGame('sale');
    const d = s.engine.data;
    scoutTalents(d, Rng.fromSeed('v'), 'plateforme', 0);
    const a = d.artistes[0];
    const rival = d.rivaux[0];
    if (!a || !rival) throw new Error('données attendues');
    a.employeur = 'joueur';
    d.contrats.push({
      id: 50,
      artisteId: a.id,
      clauses: {
        avance: cents(1000),
        royaltiesArtisteBps: 4000,
        dureeAnnees: 3,
        exclusivite: false,
        part360Bps: 0,
        clauseRachat: cents(0),
      },
      signeLe: 0,
      echeance: 156,
      recette360: 0,
    });
    const price = contractPrice(d, a.id);
    expect(price).toBeGreaterThan(0);
    const before = d.label.tresorerie;
    const r = labelGame.dispatch(s, { type: 'vendre-contrat', artisteId: a.id, rivalId: rival.id });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const after = r.session.engine.data;
    expect(after.label.tresorerie).toBe(before + price);
    expect(after.contrats).toHaveLength(0);
    expect(after.artistes[0]?.employeur).toBe(`rival:${rival.id}`);
    expect(
      labelGame.dispatch(s, { type: 'vendre-contrat', artisteId: a.id, rivalId: 999 }),
    ).toMatchObject({ ok: false, rejection: { code: 'rival-introuvable' } });
    expect(
      labelGame.dispatch(s, { type: 'vendre-contrat', artisteId: 12345, rivalId: rival.id }),
    ).toMatchObject({ ok: false, rejection: { code: 'contrat-introuvable' } });
  });
});
