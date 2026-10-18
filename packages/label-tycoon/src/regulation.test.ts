import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  REGULATION,
  chanceDeResister,
  completerEtat,
  facteurRegulation,
  initialRegulation,
  labelGame,
  newGame,
  partDeMarche,
  scoutTalents,
} from './index';
import type { LabelSession } from './index';
import { buildView } from './view';

const groupe = (graine = 'reg'): LabelSession => {
  const s = newGame(graine);
  s.engine.data.label.tier = 'groupe';
  s.engine.data.label.tresorerie = money.euros(500_000_000);
  return s;
};

const agir = (s: LabelSession, action: Parameters<typeof labelGame.dispatch>[1]): LabelSession => {
  const r = labelGame.dispatch(s, action);
  if (!r.ok) throw new Error(`refus : ${r.rejection.code}`);
  return r.session;
};

describe('calendrier des frictions', () => {
  it('est déduit de la graine et reste dans les bornes', () => {
    const a = initialRegulation('x');
    expect(a).toEqual(initialRegulation('x'));
    expect(a.prochainPiratage).toBeGreaterThanOrEqual(REGULATION.piratage.first.min);
    expect(a.prochainPiratage).toBeLessThanOrEqual(REGULATION.piratage.first.max);
    expect(a.prochaineRenegociation).toBeGreaterThanOrEqual(REGULATION.renegociation.first.min);
  });
  it('ne s’applique pas avant le palier Groupe', () => {
    let s = newGame('avant-groupe');
    s.engine.data.regulation.prochainPiratage = 0;
    s.engine.data.regulation.prochaineRenegociation = 0;
    s = labelGame.advance(s, 20).session;
    expect(s.engine.data.regulation.piratage).toBeNull();
    expect(s.engine.data.regulation.renegociation).toBeNull();
    expect(labelGame.dispatch(s, { type: 'plaider' })).toMatchObject({
      ok: false,
      rejection: { code: 'palier-insuffisant' },
    });
  });
});

describe('anti-concentration', () => {
  const dominant = (): LabelSession => {
    const s = groupe();
    const d = s.engine.data;
    const rival = d.rivaux[0];
    if (!rival) throw new Error('rival attendu');
    scoutTalents(d, Rng.fromSeed('dominant'), 'plateforme', 0);
    const [moi, autre] = d.artistes;
    if (!moi || !autre) throw new Error('artistes attendus');
    moi.employeur = 'joueur';
    moi.fanbase = 9_000_000;
    autre.employeur = `rival:${rival.id}`;
    autre.fanbase = 1_000_000;
    d.regulation.prochainPiratage = 10_000;
    d.regulation.prochaineRenegociation = 10_000;
    return s;
  };

  it('mesure la part de marché des fans', () => {
    const s = dominant();
    expect(partDeMarche(s.engine.data)).toBeCloseTo(0.9, 1);
  });
  it('avertit puis condamne un label dominant, et une amende le ramène à 40', () => {
    let s = dominant();
    s.engine.data.finances.semaines.push({
      debut: 0,
      fin: 0,
      revenus: {},
      depenses: {},
      totalRevenus: money.euros(100_000_000),
      totalDepenses: money.ZERO,
      net: money.euros(100_000_000),
      tresorerieFin: money.euros(100_000_000),
    });
    let averti = false;
    let amende = false;
    for (let i = 0; i < 80 && !amende; i += 1) {
      const r = labelGame.advance(s, 1);
      s = r.session;
      for (const sig of r.signals) {
        if (sig.kind === 'avertissement-concentration') averti = true;
        if (sig.kind === 'amende-concentration') amende = true;
      }
    }
    expect(averti).toBe(true);
    expect(amende).toBe(true);
    expect(s.engine.data.regulation.amendes).toBeGreaterThanOrEqual(money.euros(2_000_000));
    expect(s.engine.data.regulation.surveillance).toBeLessThanOrEqual(100);
  });
  it('un plaidoyer fait baisser la surveillance, mais pas deux fois de suite', () => {
    let s = dominant();
    s.engine.data.regulation.surveillance = 80;
    s = agir(s, { type: 'plaider' });
    expect(s.engine.data.regulation.surveillance).toBe(80 - REGULATION.concentration.lobbyRelief);
    expect(labelGame.dispatch(s, { type: 'plaider' })).toMatchObject({
      ok: false,
      rejection: { code: 'plaidoyer-trop-recent' },
    });
  });
});

describe('piratage', () => {
  it('une vague réduit les écoutes, la veille en atténue l’effet, puis elle s’éteint', () => {
    let s = groupe('piratage');
    s.engine.data.regulation.prochainPiratage = 0;
    s.engine.data.regulation.prochaineRenegociation = 10_000;
    s = labelGame.advance(s, 1).session;
    const v = s.engine.data.regulation.piratage;
    if (!v) throw new Error('vague attendue');
    const sans = facteurRegulation(s.engine.data, v.debut);
    expect(sans).toBeCloseTo(1 - v.severite, 3);
    s = agir(s, { type: 'regler-veille', niveau: REGULATION.piratage.maxLevel });
    expect(facteurRegulation(s.engine.data, v.debut)).toBeGreaterThan(sans);
    expect(facteurRegulation(s.engine.data, v.fin)).toBe(1);
    s = labelGame.advance(s, v.fin - s.engine.tick + 1).session;
    expect(s.engine.data.regulation.piratage).toBeNull();
    expect(s.engine.data.regulation.prochainPiratage).toBeGreaterThan(v.fin);
  });
  it('la veille a un coût hebdomadaire et refuse un niveau invalide', () => {
    let s = groupe('veille');
    s.engine.data.regulation.prochainPiratage = 10_000;
    s.engine.data.regulation.prochaineRenegociation = 10_000;
    expect(labelGame.dispatch(s, { type: 'regler-veille', niveau: 9 })).toMatchObject({
      ok: false,
      rejection: { code: 'niveau-invalide' },
    });
    s = agir(s, { type: 'regler-veille', niveau: 2 });
    const avant = s.engine.data.label.tresorerie;
    s = labelGame.advance(s, 1).session;
    expect(s.engine.data.finances.semaines.at(-1)?.depenses['regulation']).toBe(
      2 * REGULATION.piratage.levelCost,
    );
    expect(s.engine.data.label.tresorerie).not.toBe(avant);
  });
});

describe('plateformes qui renégocient', () => {
  const annoncee = (): LabelSession => {
    let s = groupe('renego');
    s.engine.data.regulation.prochaineRenegociation = 0;
    s.engine.data.regulation.prochainPiratage = 10_000;
    s = labelGame.advance(s, 1).session;
    return s;
  };
  it('annonce la baisse avec préavis, puis l’applique un an', () => {
    const s = annoncee();
    const r = s.engine.data.regulation.renegociation;
    if (!r) throw new Error('renégociation attendue');
    expect(r.debut - r.annonce).toBe(REGULATION.renegociation.notice);
    expect(facteurRegulation(s.engine.data, r.annonce)).toBe(1);
    expect(facteurRegulation(s.engine.data, r.debut)).toBeCloseTo(1 - r.baisse, 5);
    expect(facteurRegulation(s.engine.data, r.fin)).toBe(1);
  });
  it('résister peut réduire la baisse, une seule fois', () => {
    let s = annoncee();
    const avant = s.engine.data.regulation.renegociation?.baisse ?? 0;
    expect(chanceDeResister(s.engine.data)).toBeLessThanOrEqual(REGULATION.renegociation.resistMax);
    s = agir(s, { type: 'resister-plateformes' });
    const apres = s.engine.data.regulation.renegociation;
    expect(apres?.resistee).toBe(true);
    expect([
      avant,
      Math.round(avant * REGULATION.renegociation.resistRemaining * 1000) / 1000,
    ]).toContain(apres?.baisse);
    expect(labelGame.dispatch(s, { type: 'resister-plateformes' })).toMatchObject({
      ok: false,
      rejection: { code: 'deja-resiste' },
    });
  });
  it('refuse de négocier sans annonce', () => {
    expect(labelGame.dispatch(groupe('rien'), { type: 'resister-plateformes' })).toMatchObject({
      ok: false,
      rejection: { code: 'rien-a-negocier' },
    });
  });
});

describe('vue et sauvegardes', () => {
  it('expose la régulation et complète une ancienne sauvegarde', () => {
    const s = groupe('vue-reg');
    const vue = buildView(s.engine.data, 0);
    expect(vue.regulation.actif).toBe(true);
    expect(vue.regulation.seuil).toBe(35);
    const d = s.engine.data as unknown as { regulation?: unknown };
    delete d.regulation;
    completerEtat(s.engine.data);
    expect(s.engine.data.regulation.surveillance).toBe(0);
  });
});
