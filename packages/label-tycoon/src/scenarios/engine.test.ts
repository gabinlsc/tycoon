import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { defaultConfig, labelGame, newGame, validateConfig } from '../index';
import { SCENARIOS } from './catalogue';
import type { ScenarioDef } from './types';
import { signerArtisteDeDepart } from './depart';
import { conditionMet, findScenario } from './engine';
import { texteCondition } from './textes';

const config = (scenarioId: string) => ({ ...defaultConfig('normal', 'scenario'), scenarioId });
const PREMIER_OR = 'premier-disque-d-or';

describe('démarrage d’un scénario', () => {
  it('impose sa graine et ses conditions de départ, quelle que soit la graine demandée', () => {
    const a = newGame('une-graine', config(PREMIER_OR));
    const b = newGame('une-autre', config(PREMIER_OR));
    expect(a.engine.data.label.tresorerie).toBe(money.euros(5000));
    expect(a.engine.data.scenario).toMatchObject({
      id: PREMIER_OR,
      statut: 'en-cours',
      limite: 104,
    });
    expect(a.engine.data.villes).toEqual(b.engine.data.villes);
    expect(a.engine.seed).toBe(SCENARIOS[PREMIER_OR]?.graine);
  });
  it('refuse un scénario inconnu', () => {
    expect(validateConfig(config('nope'))).toMatch(/Scénario inconnu/);
    expect(() => newGame('x', config('nope'))).toThrow(RangeError);
    expect(findScenario('nope')).toBeUndefined();
  });
  it('ne crée aucun suivi hors du mode scénario', () => {
    expect(newGame('x').engine.data.scenario).toBeUndefined();
  });
  it('crée un artiste de départ reproductible et signé', () => {
    const faire = () => {
      const s = newGame('depart');
      const id = signerArtisteDeDepart(s.engine.data, Rng.fromSeed('d'), { level: 'espoir' });
      return { s, id };
    };
    const { s, id } = faire();
    const artiste = s.engine.data.artistes.find((a) => a.id === id);
    expect(artiste?.employeur).toBe('joueur');
    expect(s.engine.data.contrats.some((c) => c.artisteId === id)).toBe(true);
    expect(faire().s.engine.data.artistes.find((a) => a.id === id)?.nom).toBe(artiste?.nom);
  });
});

describe('évaluation', () => {
  it('lit chaque condition sur l’état', () => {
    const s = newGame('cond');
    const d = s.engine.data;
    expect(conditionMet(d, 0, { type: 'tresorerie', min: cents(1) })).toBe(true);
    expect(conditionMet(d, 0, { type: 'tresorerie', min: money.euros(10_000_000) })).toBe(false);
    expect(conditionMet(d, 0, { type: 'palier', palier: 'home-studio' })).toBe(true);
    expect(conditionMet(d, 0, { type: 'palier', palier: 'major' })).toBe(false);
    expect(conditionMet(d, 0, { type: 'certification', niveau: 'or' })).toBe(false);
    expect(conditionMet(d, 0, { type: 'sorties', min: 1 })).toBe(false);
    expect(conditionMet(d, 10, { type: 'survie' }, 52)).toBe(false);
    expect(conditionMet(d, 52, { type: 'survie' }, 52)).toBe(true);
  });
  it('décrit les objectifs en français', () => {
    expect(texteCondition({ type: 'certification', niveau: 'or' })).toBe(
      'Décrocher un disque d’or',
    );
    expect(texteCondition({ type: 'classement', rang: 1 })).toMatch(/tête du classement/);
  });
});

describe('issue du scénario', () => {
  it('est gagné dès que les objectifs sont réunis, avec un score', () => {
    const facile: ScenarioDef = {
      id: 'test-facile',
      titre: 'Test',
      description: '',
      graine: 'test-facile',
      limiteSemaines: 20,
      objectifs: [{ type: 'tresorerie', min: cents(1000) }],
    };
    (SCENARIOS as Record<string, ScenarioDef>)['test-facile'] = facile;
    try {
      const r = labelGame.advance(newGame('x', config('test-facile')), 1);
      expect(r.session.engine.data.scenario?.statut).toBe('reussi');
      expect(r.session.engine.data.scenario?.score).toBeGreaterThan(1000);
      expect(r.signals.some((x) => x.kind === 'scenario-reussi' && x.interrupt)).toBe(true);
    } finally {
      delete (SCENARIOS as Record<string, ScenarioDef>)['test-facile'];
    }
  });
  it('est perdu à l’échéance', () => {
    let s = newGame('x', config(PREMIER_OR));
    s.engine.data.label.tresorerie = money.euros(50_000_000);
    s = labelGame.advance(s, 104).session;
    expect(s.engine.data.scenario?.statut).toBe('echec');
    expect(s.engine.data.scenario?.raison).toBe('temps');
  });
  it('est perdu par faillite', () => {
    let s = newGame('x', config(PREMIER_OR));
    s.engine.data.label.tresorerie = cents(-100_000_000);
    s = labelGame.advance(s, 12).session;
    expect(s.engine.data.scenario?.statut).toBe('echec');
    expect(s.engine.data.scenario?.raison).toBe('faillite');
  });
  it('ne change plus une fois terminé', () => {
    let s = newGame('x', config(PREMIER_OR));
    s.engine.data.label.tresorerie = cents(-100_000_000);
    s = labelGame.advance(s, 12).session;
    const fin = s.engine.data.scenario?.fin;
    s = labelGame.advance(s, 4).session;
    expect(s.engine.data.scenario?.fin).toBe(fin);
  });
});

describe('catalogue', () => {
  const ids = Object.keys(SCENARIOS);
  it('propose entre 6 et 8 scénarios', () => {
    expect(ids.length).toBeGreaterThanOrEqual(6);
    expect(ids.length).toBeLessThanOrEqual(8);
  });
  it.each(ids)('%s démarre proprement, reproductible, sans victoire ni défaite d’office', (id) => {
    const def = SCENARIOS[id] as ScenarioDef;
    expect(def.titre.length).toBeGreaterThan(5);
    expect(def.description.length).toBeGreaterThan(20);
    expect(def.objectifs.length).toBeGreaterThan(0);
    const a = newGame('une-graine', config(id));
    const b = newGame('une-autre', config(id));
    const d = a.engine.data;
    expect(JSON.stringify(d)).toBe(JSON.stringify(b.engine.data));
    expect(d.scenario?.statut).toBe('en-cours');
    // Au départ, les objectifs ne sont pas déjà réunis et les règles sont respectées.
    expect(def.objectifs.every((c) => conditionMet(d, 0, c, def.limiteSemaines))).toBe(false);
    for (const c of def.regles ?? []) expect(conditionMet(d, 0, c, def.limiteSemaines)).toBe(true);
    for (const c of [...def.objectifs, ...(def.regles ?? [])])
      expect(texteCondition(c).length).toBeGreaterThan(8);
    // La première semaine ne clôt pas le scénario.
    expect(labelGame.advance(a, 1).session.engine.data.scenario?.statut).toBe('en-cours');
  });
});
