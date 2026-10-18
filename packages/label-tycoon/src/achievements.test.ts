import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_THRESHOLDS,
  OBJECTIF_TEXTES,
  OBJECTIVES,
  RECORD_TEXTES,
  SUCCES,
  SUCCES_TEXTES,
  isReached,
  labelGame,
  newGame,
  newlyUnlocked,
  objectiveDone,
  proposeObjective,
  updateRecords,
} from './index';

describe('catalogue', () => {
  it('compte soixante succès aux identifiants uniques', () => {
    expect(SUCCES).toHaveLength(60);
    expect(new Set(SUCCES.map((s) => s.id)).size).toBe(60);
    expect(Object.keys(ACHIEVEMENT_THRESHOLDS).length).toBeGreaterThan(10);
  });
  it('le classement se lit à l’envers (plus petit = mieux)', () => {
    expect(isReached('classement', 8, 10)).toBe(true);
    expect(isReached('classement', 30, 10)).toBe(false);
    expect(isReached('signatures', 5, 5)).toBe(true);
  });
});

describe('textes', () => {
  it('chaque succès, objectif et record a son intitulé français', () => {
    for (const s of SUCCES) {
      const text = SUCCES_TEXTES[s.famille];
      expect(text.titre(s.seuil).length, s.id).toBeGreaterThan(2);
      expect(text.description(s.seuil)).not.toMatch(/undefined|NaN/);
    }
    for (const kind of [
      'signer',
      'sortir',
      'concert',
      'certification',
      'classement',
      'tresorerie',
    ] as const)
      expect(OBJECTIF_TEXTES[kind]).toBeTruthy();
    expect(Object.keys(RECORD_TEXTES)).toHaveLength(4);
  });
});

describe('déblocage', () => {
  it('débloque d’après les compteurs et la fortune, une seule fois', () => {
    const d = newGame('succ').engine.data;
    d.stats['artiste-signe'] = 5;
    d.label.tresorerie = money.euros(150_000);
    const ids = newlyUnlocked(d, 0).map((s) => s.id);
    expect(ids).toContain('signatures:1');
    expect(ids).toContain('signatures:5');
    expect(ids).not.toContain('signatures:10');
    expect(ids).toContain(`tresorerie:${money.euros(100_000)}`);
    d.succes.push(...ids);
    expect(newlyUnlocked(d, 0)).toHaveLength(0);
  });

  it('s’alimente des signaux pendant la partie et émet un signal de succès', () => {
    const s = newGame('succ2');
    const out = labelGame.advance(s, 60);
    expect(out.session.engine.data.succes.length).toBeGreaterThan(0);
    expect(out.signals.some((x) => x.kind === 'succes')).toBe(true);
    expect(Object.keys(out.session.engine.data.stats).length).toBeGreaterThan(0);
  });
});

describe('objectifs dynamiques', () => {
  it('en propose trois de types distincts, rejouables', () => {
    const run = () => labelGame.advance(newGame('obj'), 2).session.engine.data.objectifs;
    const a = run();
    expect(a).toHaveLength(OBJECTIVES.active);
    expect(new Set(a.map((o) => o.kind)).size).toBe(OBJECTIVES.active);
    expect(run()).toEqual(a);
  });
  it('récompensent à l’atteinte, puis en proposent un nouveau', () => {
    const s = newGame('obj2');
    const d = s.engine.data;
    d.objectifs.push({ id: 1, kind: 'sortir', cible: 1, base: 0 });
    d.stats['sortie'] = 1;
    expect(objectiveDone(d, d.objectifs[0] ?? proposeObjective(d, () => 0))).toBe(true);
    const before = d.label.tresorerie;
    const out = labelGame.advance(s, 1);
    expect(out.signals.some((x) => x.kind === 'objectif-atteint')).toBe(true);
    expect(out.session.engine.data.objectifs).toHaveLength(OBJECTIVES.active);
    expect(before).toBeGreaterThan(0);
  });
});

describe('records', () => {
  it('ne font que monter', () => {
    const d = newGame('rec').engine.data;
    d.label.tresorerie = money.euros(50_000);
    updateRecords(d, 1);
    const first = d.records.find((r) => r.clef === 'tresorerie-max')?.valeur ?? 0;
    d.label.tresorerie = money.euros(10_000);
    updateRecords(d, 2);
    expect(d.records.find((r) => r.clef === 'tresorerie-max')?.valeur).toBe(first);
    d.label.tresorerie = money.euros(90_000);
    expect(updateRecords(d, 3)).toContain('tresorerie-max');
  });
});
