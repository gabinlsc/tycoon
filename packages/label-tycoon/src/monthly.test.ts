import { Rng, cents } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { buildMonthlyReport, causesOfRelease, labelGame, newGame, scoutTalents } from './index';

describe('rapport mensuel', () => {
  it('est clos à chaque fin de mois (4-4-5), jamais deux fois, rejouable', () => {
    const run = () => labelGame.advance(newGame('rap'), 52);
    const a = run();
    expect(a.session.engine.data.rapportsMensuels).toHaveLength(12);
    expect(a.signals.filter((s) => s.kind === 'rapport-mensuel')).toHaveLength(12);
    expect(run().session.engine.data.rapportsMensuels).toEqual(
      a.session.engine.data.rapportsMensuels,
    );
  });

  it('donne la trésorerie, la variation et les totaux du mois', () => {
    const d = labelGame.advance(newGame('rap2'), 9).session.engine.data;
    const [first, second] = d.rapportsMensuels;
    expect(first?.tresorerie).toBeDefined();
    expect(second?.variation).toBe((second?.tresorerie ?? 0) - (first?.tresorerie ?? 0));
    expect(first?.depenses).toBeGreaterThan(0);
  });

  it('range réussites et échecs du mois avec leurs causes', () => {
    const s = newGame('rap3');
    const d = s.engine.data;
    scoutTalents(d, Rng.fromSeed('r'), 'plateforme', 0);
    const a = d.artistes[0];
    if (!a) throw new Error('artiste attendu');
    a.employeur = 'joueur';
    a.hype = 80;
    a.fatigue = 90;
    d.projets.push({
      id: 5,
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
      qualite: 85,
      sortieLe: 0,
      s1: 100,
      hit: 1,
      viral: null,
      derniers: 0,
      certification: null,
      streams: 0,
    });
    d.fil.push(
      {
        id: 1,
        semaine: 2,
        kind: 'certification',
        importance: 3,
        titre: 't',
        texte: 'x',
        artisteId: a.id,
      },
      {
        id: 2,
        semaine: 3,
        kind: 'burnout',
        importance: 3,
        titre: 't',
        texte: 'x',
        artisteId: a.id,
      },
    );
    d.finances.mois.push({
      debut: 0,
      fin: 3,
      revenus: { streaming: cents(500) },
      depenses: {},
      totalRevenus: cents(500),
      totalDepenses: cents(0),
      net: cents(500),
      tresorerieFin: cents(0),
    });
    const report = buildMonthlyReport(d, 3);
    expect(report.reussites.map((x) => x.code)).toEqual(['certification']);
    expect(report.echecs.map((x) => x.code)).toEqual(['burnout']);
    expect(report.echecs[0]?.causes).toEqual(['fatigue']);
    expect(report.reussites[0]?.causes.length).toBeGreaterThan(0);
    expect(report.premierRevenu).toBe('streaming');
    expect(causesOfRelease(d, 5)).toHaveLength(2);
    expect(causesOfRelease(d, 999)).toEqual([]);
  });
});
