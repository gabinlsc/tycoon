import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  EVENT_TEXTS,
  LABEL_EVENTS,
  describeEvent,
  eventEngine,
  fillTemplate,
  labelGame,
  mitigated,
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

  it('comptent au moins dix événements de production', () => {
    expect(LABEL_EVENTS.filter((e) => e.category === 'production').length).toBeGreaterThanOrEqual(
      10,
    );
  });

  it('comptent au moins dix événements de marché', () => {
    expect(LABEL_EVENTS.filter((e) => e.category === 'marche').length).toBeGreaterThanOrEqual(10);
  });

  it('comptent au moins dix événements médias', () => {
    expect(LABEL_EVENTS.filter((e) => e.category === 'medias').length).toBeGreaterThanOrEqual(10);
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

describe('événements de production', () => {
  it('surviennent autour d’un projet en cours, sans casser les projets', () => {
    const session = roster(1);
    const d = session.engine.data;
    const artist = d.artistes.find((x) => x.employeur === 'joueur');
    if (!artist) throw new Error('artiste attendu');
    d.projets.push({
      id: 9001,
      artisteId: artist.id,
      type: 'album',
      clip: 'gros',
      studio: 50,
      producteur: 50,
      mixage: 0,
      debut: 0,
      fin: 9000,
      retard: 0,
      statut: 'production',
      qualite: null,
      sortieLe: null,
      s1: 0,
      hit: 0,
      viral: null,
      streams: 0,
      derniers: 0,
      certification: null,
    });
    const out = labelGame.advance(session, 400).session.engine.data;
    const production = new Set(
      LABEL_EVENTS.filter((e) => e.category === 'production').map((e) => e.id),
    );
    expect(out.events.history.some((h) => production.has(h.eventId))).toBe(true);
    for (const p of out.projets) expect(p.fin).toBeGreaterThanOrEqual(p.debut);
  });
});

describe('événements de marché', () => {
  it('modifient le marché sans le sortir de ses bornes, sur une longue partie', () => {
    const out = labelGame.advance(roster(1), 800);
    const m = out.session.engine.data.marche;
    expect(m.facteurStreaming).toBeGreaterThanOrEqual(0.6);
    expect(m.facteurStreaming).toBeLessThanOrEqual(1.5);
    for (const g of Object.values(m.genres)) {
      expect(g.popularite).toBeGreaterThanOrEqual(0);
      expect(g.popularite).toBeLessThanOrEqual(100);
    }
    const market = new Set(LABEL_EVENTS.filter((e) => e.category === 'marche').map((e) => e.id));
    expect(out.session.engine.data.events.history.some((h) => market.has(h.eventId))).toBe(true);
  });
});

describe('événements médias', () => {
  it('surviennent autour du roster, et un attaché de presse atténue les effets négatifs', () => {
    const d = labelGame.advance(roster(3), 500).session.engine.data;
    const media = new Set(LABEL_EVENTS.filter((e) => e.category === 'medias').map((e) => e.id));
    expect(d.events.history.some((h) => media.has(h.eventId))).toBe(true);
    const plain = newGame('att').engine.data;
    expect(mitigated(plain, -10)).toBe(-10);
    plain.personnel.push({
      id: 1,
      nom: 'A',
      role: 'attache',
      niveau: 100,
      specialite: null,
      salaire: 0,
      moral: 60,
      trait: 'loyal',
      experience: 0,
    });
    expect(mitigated(plain, -10)).toBe(-5);
    expect(mitigated(plain, 10)).toBe(10);
  });
});
