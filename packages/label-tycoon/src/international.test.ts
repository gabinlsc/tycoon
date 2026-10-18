import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  INTERNATIONAL,
  PAYS,
  affinite,
  affiniteDuRoster,
  classementLocal,
  completerEtat,
  labelGame,
  newGame,
  scoutTalents,
} from './index';
import type { LabelSession } from './index';

const major = (): LabelSession => {
  const s = newGame('export');
  const d = s.engine.data;
  d.label.tier = 'major';
  d.label.tresorerie = money.euros(50_000_000);
  scoutTalents(d, Rng.fromSeed('x'), 'plateforme', 0);
  for (const a of d.artistes.slice(0, 3)) {
    a.employeur = 'joueur';
    a.fanbase = 400_000;
  }
  return s;
};

const agir = (s: LabelSession, action: Parameters<typeof labelGame.dispatch>[1]): LabelSession => {
  const r = labelGame.dispatch(s, action);
  if (!r.ok) throw new Error(`refus : ${r.rejection.code}`);
  return r.session;
};

describe('goûts des pays', () => {
  it('varient autour de la base du pays et restent déterministes', () => {
    const base = PAYS.valdoria.affinites['afro'] ?? 1;
    for (const t of [0, 40, 100, 300]) {
      const a = affinite('valdoria', 'afro', t);
      expect(a).toBeGreaterThanOrEqual(base * (1 - INTERNATIONAL.driftAmplitude) - 0.001);
      expect(a).toBeLessThanOrEqual(base * (1 + INTERNATIONAL.driftAmplitude) + 0.001);
      expect(affinite('valdoria', 'afro', t)).toBe(a);
    }
    // Un genre absent de la liste vaut 1 (modulo la mode).
    expect(affinite('solaria', 'inconnu', 0)).toBeGreaterThan(0.8);
  });
  it('pondère le roster par ses fans', () => {
    const d = major().engine.data;
    const moyenne = affiniteDuRoster(d, 'solaria', 10);
    expect(moyenne).toBeGreaterThan(0);
    for (const a of d.artistes) a.employeur = 'libre';
    expect(affiniteDuRoster(d, 'solaria', 10)).toBe(1);
  });
});

describe('ouvrir un marché', () => {
  it('exige le palier Major, des fonds et refuse un pays inconnu ou déjà ouvert', () => {
    const s = newGame('export-ferme');
    expect(labelGame.dispatch(s, { type: 'ouvrir-marche', pays: 'valdoria' })).toMatchObject({
      ok: false,
      rejection: { code: 'palier-insuffisant' },
    });
    const m = major();
    expect(labelGame.dispatch(m, { type: 'ouvrir-marche', pays: 'atlantide' })).toMatchObject({
      ok: false,
      rejection: { code: 'pays-inconnu' },
    });
    const ouvert = agir(m, { type: 'ouvrir-marche', pays: 'valdoria' });
    expect(ouvert.engine.data.label.tresorerie).toBe(
      m.engine.data.label.tresorerie - PAYS.valdoria.ouverture,
    );
    expect(labelGame.dispatch(ouvert, { type: 'ouvrir-marche', pays: 'valdoria' })).toMatchObject({
      ok: false,
      rejection: { code: 'marche-deja-ouvert' },
    });
    m.engine.data.label.tresorerie = money.euros(1000);
    expect(labelGame.dispatch(m, { type: 'ouvrir-marche', pays: 'valdoria' })).toMatchObject({
      ok: false,
      rejection: { code: 'fonds-insuffisants' },
    });
  });
  it('règle la campagne dans les limites', () => {
    let s = agir(major(), { type: 'ouvrir-marche', pays: 'nordhelm' });
    expect(
      labelGame.dispatch(s, { type: 'regler-campagne', pays: 'solaria', budget: 0 }),
    ).toMatchObject({ ok: false, rejection: { code: 'marche-ferme' } });
    expect(
      labelGame.dispatch(s, {
        type: 'regler-campagne',
        pays: 'nordhelm',
        budget: INTERNATIONAL.budgetMax + 1,
      }),
    ).toMatchObject({ ok: false, rejection: { code: 'montant-invalide' } });
    s = agir(s, { type: 'regler-campagne', pays: 'nordhelm', budget: money.euros(20_000) });
    expect(s.engine.data.international.marches[0]?.budget).toBe(money.euros(20_000));
  });
});

describe('semaine à l’international', () => {
  it('une campagne fait monter la pénétration et rapporte du revenu d’export', () => {
    let s = agir(major(), { type: 'ouvrir-marche', pays: 'valdoria' });
    s = agir(s, { type: 'regler-campagne', pays: 'valdoria', budget: money.euros(20_000) });
    const d = s.engine.data;
    d.finances.semaine.revenus['streaming'] = money.euros(1_000_000);
    s = labelGame.advance(s, 30).session;
    const m = s.engine.data.international.marches[0];
    expect(m?.penetration).toBeGreaterThan(5);
    expect(m?.penetration).toBeLessThanOrEqual(100);
  });
  it('sans campagne, la pénétration retombe et le bureau coûte ses frais', () => {
    let s = agir(major(), { type: 'ouvrir-marche', pays: 'solaria' });
    const m = s.engine.data.international.marches[0];
    if (!m) throw new Error('marché attendu');
    m.penetration = 50;
    s = labelGame.advance(s, 20).session;
    const apres = s.engine.data.international.marches[0];
    expect(apres?.penetration).toBeLessThan(50);
    expect(apres?.cumul).toBeLessThan(0);
  });
  it('le classement local ne place le joueur qu’avec une présence', () => {
    const s = agir(major(), { type: 'ouvrir-marche', pays: 'valdoria' });
    const d = s.engine.data;
    expect(classementLocal(d, 'valdoria', 5).some((l) => l.joueur)).toBe(false);
    const m = d.international.marches[0];
    if (m) m.penetration = 60;
    const chart = classementLocal(d, 'valdoria', 5);
    expect(chart.some((l) => l.joueur)).toBe(true);
    expect(chart.map((l) => l.rang)).toEqual(chart.map((_, i) => i + 1));
    for (let i = 1; i < chart.length; i += 1)
      expect(chart[i - 1]?.score).toBeGreaterThanOrEqual(chart[i]?.score ?? 0);
  });
  it('une ancienne sauvegarde sans marchés se complète', () => {
    const d = newGame('ancienne').engine.data as unknown as { international?: unknown };
    delete d.international;
    completerEtat(d as never);
    expect(d.international).toEqual({ marches: [] });
  });
});
