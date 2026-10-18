import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { INVESTORS, investorOffersWeek, investorShareBps, labelGame, newGame } from './index';

const offer = (id = 5) => ({
  id,
  nom: 'Fonds Atlas',
  apport: money.euros(80_000),
  partBps: 1200,
  objectifCA: money.euros(300_000),
  expire: 999,
});

describe('offres', () => {
  it('arrivent selon la réputation, plafonnées, rejouables', () => {
    const run = (rep: number) => {
      const d = newGame('inv').engine.data;
      d.label.reputation = rep;
      d.label.tier = 'etabli';
      const sigs: string[] = [];
      for (let t = 1; t <= 800; t += 1)
        investorOffersWeek(d, t, Rng.fromSeed(`i${t}`), (x) => sigs.push(x.kind));
      return { n: sigs.length, pending: d.offresInvest.length };
    };
    expect(run(5).n).toBe(0);
    const a = run(60);
    expect(a.n).toBeGreaterThan(0);
    expect(a.pending).toBeLessThanOrEqual(INVESTORS.maxPending);
    expect(run(60)).toEqual(a);
  });
});

describe('entrée au capital', () => {
  it('accepter verse l’apport, crée l’investisseur et cède une part de la valorisation', () => {
    const s = newGame('inv2');
    s.engine.data.offresInvest.push(offer());
    const before = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, { type: 'accepter-investisseur', offreId: 5 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.session.engine.data;
    expect(d.label.tresorerie).toBe(before + money.euros(80_000));
    expect(d.investisseurs[0]?.statut).toBe('actif');
    expect(investorShareBps(d)).toBe(1200);
    expect(d.offresInvest).toHaveLength(0);
  });
  it('refuser ne change rien ; offre inconnue et excès d’investisseurs refusés', () => {
    const s = newGame('inv3');
    s.engine.data.offresInvest.push(offer());
    const r = labelGame.dispatch(s, { type: 'refuser-investisseur', offreId: 5 });
    expect(r.ok && r.session.engine.data.investisseurs).toHaveLength(0);
    expect(labelGame.dispatch(s, { type: 'accepter-investisseur', offreId: 77 })).toMatchObject({
      ok: false,
      rejection: { code: 'offre-introuvable' },
    });
    for (let i = 0; i < INVESTORS.maxActive; i += 1)
      s.engine.data.investisseurs.push({
        id: 100 + i,
        nom: 'x',
        apport: 1,
        partBps: 100,
        objectifCA: 1,
        echeance: 9999,
        statut: 'actif',
      });
    expect(labelGame.dispatch(s, { type: 'accepter-investisseur', offreId: 5 })).toMatchObject({
      ok: false,
      rejection: { code: 'trop-d-investisseurs' },
    });
  });
});

describe('objectifs', () => {
  it('manquer l’objectif coûte une pénalité et cède une part de plus', () => {
    const s = newGame('inv4');
    s.engine.data.label.tresorerie = money.euros(500_000);
    s.engine.data.investisseurs.push({
      id: 9,
      nom: 'x',
      apport: money.euros(100_000),
      partBps: 1000,
      objectifCA: money.euros(10_000_000),
      echeance: 3,
      statut: 'actif',
    });
    const run = labelGame.advance(s, 5);
    const inv = run.session.engine.data.investisseurs[0];
    expect(inv?.statut).toBe('manque');
    expect(inv?.partBps).toBe(1000 + INVESTORS.extraShareBps);
    expect(run.signals.some((x) => x.kind === 'objectif-investisseur-manque')).toBe(true);
  });
  it('tenir l’objectif donne de la réputation', () => {
    const s = newGame('inv5');
    const rep = s.engine.data.label.reputation;
    s.engine.data.investisseurs.push({
      id: 9,
      nom: 'x',
      apport: cents(1000),
      partBps: 1000,
      objectifCA: 0,
      echeance: 2,
      statut: 'actif',
    });
    const run = labelGame.advance(s, 4).session.engine.data;
    expect(run.investisseurs[0]?.statut).toBe('tenu');
    expect(run.label.reputation).toBe(rep + INVESTORS.reputationGain);
  });
});
