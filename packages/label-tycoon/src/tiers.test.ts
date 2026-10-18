import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { labelGame, newGame, nextTier, scoutTalents, tierAtLeast } from './index';

describe('conditions', () => {
  it('un label de départ ne monte pas', () => {
    expect(nextTier(newGame('t').engine.data)).toBeNull();
  });
  it('demande réputation, chiffre d’affaires et certification à la fois', () => {
    const d = newGame('t2').engine.data;
    d.label.reputation = 50;
    expect(nextTier(d)).toBeNull();
    d.finances.semaines.push({
      debut: 0,
      fin: 0,
      revenus: {},
      depenses: {},
      totalRevenus: money.euros(200_000),
      totalDepenses: 0,
      net: 0,
      tresorerieFin: 0,
    } as never);
    expect(nextTier(d)).toBeNull();
    d.projets.push({
      id: 1,
      artisteId: 1,
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
      derniers: 0,
      certification: 'or',
      streams: 0,
    });
    expect(nextTier(d)).toBe('independant');
  });
});

describe('phase', () => {
  it('monte d’un cran avec signal et auto-pause, jamais plus d’un à la fois, sans reculer', () => {
    const s = newGame('t3');
    const d = s.engine.data;
    d.label.reputation = 90;
    d.finances.semaines.push({
      debut: 0,
      fin: 0,
      revenus: {},
      depenses: {},
      totalRevenus: money.euros(50_000_000),
      totalDepenses: 0,
      net: 0,
      tresorerieFin: 0,
    } as never);
    d.projets.push({
      id: 1,
      artisteId: 1,
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
      derniers: 0,
      certification: 'diamant',
      streams: 0,
    });
    const one = labelGame.advance(s, 1);
    expect(one.session.engine.data.label.tier).toBe('independant');
    expect(one.signals.some((x) => x.kind === 'palier' && x.interrupt)).toBe(true);
    const many = labelGame.advance(s, 4).session.engine.data;
    expect(many.label.tier).toBe('major');
    many.label.reputation = 0;
    expect(
      labelGame.advance({ ...s, engine: { ...s.engine, data: many } } as never, 2).session.engine
        .data.label.tier,
    ).toBe('major');
    void Rng;
    void scoutTalents;
  });
});

describe('déblocages', () => {
  it('les prêts demandent le palier indépendant', () => {
    const s = newGame('t4');
    expect(
      labelGame.dispatch(s, { type: 'emprunter', montant: money.euros(5000), semaines: 26 }),
    ).toMatchObject({ ok: false, rejection: { code: 'palier-insuffisant' } });
    s.engine.data.label.tier = 'independant';
    expect(
      labelGame.dispatch(s, { type: 'emprunter', montant: money.euros(5000), semaines: 26 }).ok,
    ).toBe(true);
    expect(tierAtLeast(s.engine.data, 'independant')).toBe(true);
    expect(tierAtLeast(s.engine.data, 'etabli')).toBe(false);
  });
  it('le directeur financier demande le palier établi', () => {
    const s = labelGame.advance(newGame('t5'), 1).session;
    const c = s.engine.data.candidats[0];
    if (!c) throw new Error('candidat attendu');
    c.role = 'directeur-financier';
    expect(labelGame.dispatch(s, { type: 'embaucher', membreId: c.id })).toMatchObject({
      ok: false,
      rejection: { code: 'palier-insuffisant' },
    });
  });
});
