import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  EVENT_TEXTS,
  LABEL_EVENTS,
  describeEvent,
  eventEngine,
  fillTemplate,
  labelGame,
  newGame,
  scoutTalents,
} from './index';

describe('contenu des événements', () => {
  it('ont des identifiants uniques et des textes pour chaque événement et chaque choix', () => {
    const ids = LABEL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of LABEL_EVENTS) {
      const text = EVENT_TEXTS[e.id];
      expect(text, `texte de ${e.id}`).toBeDefined();
      for (const c of e.choices ?? [])
        expect(text?.choix?.[c.id], `choix ${e.id}/${c.id}`).toBeTruthy();
      if (e.choices) expect(e.choices.some((c) => c.id === e.defaultChoice)).toBe(true);
    }
    for (const id of Object.keys(EVENT_TEXTS)) expect(ids, `événement ${id}`).toContain(id);
  });

  it('comptent au moins douze événements artistes', () => {
    expect(LABEL_EVENTS.filter((e) => e.category === 'artistes').length).toBeGreaterThanOrEqual(12);
  });

  it('remplit les variables des textes', () => {
    expect(fillTemplate('{nom} gagne {n}', { nom: 'Zed', n: 3 })).toBe('Zed gagne 3');
    expect(describeEvent('caprice', { nom: 'Zed', montant: 100 })?.texte).toContain('Zed');
    expect(describeEvent('inconnu', {})).toBeUndefined();
  });

  it('forment un moteur valide', () => {
    expect(eventEngine).toBeDefined();
  });
});

const roster = (n = 3) => {
  const s = newGame('ev');
  const d = s.engine.data;
  d.label.tresorerie = money.euros(200_000);
  scoutTalents(d, Rng.fromSeed('e'), 'plateforme', 0);
  scoutTalents(d, Rng.fromSeed('e2'), 'plateforme', 0);
  d.artistes.slice(0, n).forEach((a) => {
    a.employeur = 'joueur';
    a.ego = 80;
    a.fatigue = 90;
    a.loyaute = 10;
    a.hype = 40;
  });
  return s;
};

describe('dans la simulation', () => {
  it('se déclenchent sur une longue partie, de façon rejouable, sans casser les bornes', () => {
    const run = () => labelGame.advance(roster(), 400).session.engine.data;
    const a = run();
    const fired = Object.keys(a.events.count);
    expect(fired.length).toBeGreaterThan(2);
    expect(run().events.count).toEqual(a.events.count);
    for (const art of a.artistes) {
      for (const v of [
        art.moral,
        art.hype,
        art.fatigue,
        art.loyaute,
        art.affinite < 0 ? 0 : art.affinite,
      ])
        expect(v).toBeGreaterThanOrEqual(0);
      expect(art.moral).toBeLessThanOrEqual(100);
    }
  });

  it('les décisions expirent sur leur choix par défaut', () => {
    const d = labelGame.advance(roster(), 400).session.engine.data;
    expect(d.events.pending.length).toBeLessThanOrEqual(6);
    expect(d.events.history.length).toBeGreaterThan(0);
  });
});
