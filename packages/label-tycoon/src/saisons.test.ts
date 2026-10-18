import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  EVENEMENTS_SAISONNIERS_SPECS,
  EVENT_TEXTS,
  GENRE_IDS,
  LABEL_EVENTS,
  SAISONS,
  SAISON_IDS,
  SEASON_EVENTS,
  eventEngine,
  labelGame,
  newGame,
  saisonActive,
  saisonsActives,
  scoutTalents,
} from './index';
import type { SaisonId } from './index';
import { buildView } from './view';

describe('contenu saisonnier', () => {
  it('porte le jeu à 150 événements au moins, tous uniques et tous textés', () => {
    expect(LABEL_EVENTS.length).toBeGreaterThanOrEqual(150);
    const ids = LABEL_EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of SEASON_EVENTS) expect(EVENT_TEXTS[e.id], e.id).toBeDefined();
  });

  it('donne à chaque saison au moins quatorze événements', () => {
    for (const id of SAISON_IDS) {
      const n = EVENEMENTS_SAISONNIERS_SPECS.filter((s) => s.saison === id).length;
      expect(n, id).toBeGreaterThanOrEqual(14);
    }
  });

  it('n’emploie que des variables que l’événement fournit, et donne un défaut à chaque décision', () => {
    for (const s of EVENEMENTS_SAISONNIERS_SPECS) {
      const permises = new Set(s.cible === 'genre' ? ['genreNom'] : ['nom']);
      for (const texte of [s.titre, s.texte, ...(s.choix ?? []).map((c) => c.texte)])
        for (const m of texte.matchAll(/\{(\w+)\}/g))
          expect(permises.has(m[1] ?? ''), `${s.id} : {${m[1]}}`).toBe(true);
      if (s.choix) {
        expect(s.choix.length).toBeGreaterThanOrEqual(2);
        expect(s.choix.some((c) => c.id === (s.defaut ?? s.choix?.at(-1)?.id))).toBe(true);
      }
    }
  });

  it('une phrase qui parle de {nom} vise bien un artiste, une phrase de {genreNom} un genre', () => {
    for (const s of EVENEMENTS_SAISONNIERS_SPECS) {
      if (/\{genreNom\}/.test(`${s.titre} ${s.texte}`)) expect(s.cible, s.id).toBe('genre');
      if (/\{nom\}/.test(`${s.titre} ${s.texte}`))
        expect(s.cible ?? 'artiste', s.id).toBe('artiste');
    }
  });
});

describe('saisons', () => {
  it('suivent le calendrier de l’année', () => {
    const d = newGame('saisons').engine.data;
    expect(saisonActive('festivals', d, 26)).toBe(true);
    expect(saisonActive('festivals', d, 26 + 52)).toBe(true);
    expect(saisonActive('festivals', d, 5)).toBe(false);
    expect(saisonActive('rentree', d, 40)).toBe(true);
    expect(saisonActive('fetes', d, 50)).toBe(true);
    expect(saisonActive('fetes', d, 52)).toBe(false);
    expect(saisonActive('fetes', d, 0)).toBe(false);
    expect(saisonActive('fetes', d, 20)).toBe(false);
    expect(saisonsActives(d, 26)).toContain('festivals');
  });

  it('les turbulences suivent chaque changement d’ère, et la technologie certaines ères', () => {
    const d = newGame('turbulences').engine.data;
    const second = d.eres.programme[1];
    if (!second) throw new Error('deuxième ère attendue');
    expect(saisonActive('turbulences', d, second.debut - 1)).toBe(false);
    expect(saisonActive('turbulences', d, second.debut)).toBe(true);
    expect(saisonActive('turbulences', d, second.debut + 52)).toBe(false);
    d.eres.courante = 'streaming';
    expect(saisonActive('technologies', d, 10)).toBe(false);
    d.eres.courante = 'virale';
    expect(saisonActive('technologies', d, 10)).toBe(true);
  });

  it('apparaissent dans la vue quand elles sont en cours', () => {
    const d = newGame('vue-saisons').engine.data;
    expect(buildView(d, 5).saisons).toEqual([]);
    expect(buildView(d, 26).saisons.map((x) => x.id)).toEqual(['festivals']);
  });

  it('chaque saison a un nom et une description', () => {
    for (const id of SAISON_IDS) {
      expect(SAISONS[id].nom.length).toBeGreaterThan(3);
      expect(SAISONS[id].description.length).toBeGreaterThan(10);
    }
  });

  it('un événement saisonnier ne survient que pendant sa saison', () => {
    const d = newGame('hors-saison').engine.data;
    for (const e of SEASON_EVENTS) {
      const poids = typeof e.weight === 'function' ? e.weight(d, 5) : e.weight;
      const spec = EVENEMENTS_SAISONNIERS_SPECS.find((s) => s.id === e.id);
      if (spec && !saisonActive(spec.saison, d, 5)) expect(poids, e.id).toBe(0);
    }
  });
});

const jeu = (graine: string) => {
  const s = newGame(graine);
  const d = s.engine.data;
  d.label.tresorerie = money.euros(400_000);
  scoutTalents(d, Rng.fromSeed(graine), 'plateforme', 0);
  scoutTalents(d, Rng.fromSeed(`${graine}2`), 'plateforme', 0);
  for (const a of d.artistes.slice(0, 4)) a.employeur = 'joueur';
  return s;
};

describe('dans la simulation', () => {
  it('chaque saison finit par déclencher ses événements sur de longues parties', () => {
    const vus = new Set<SaisonId>();
    for (const graine of ['a', 'b', 'c']) {
      const d = labelGame.advance(jeu(graine), 52 * 12).session.engine.data;
      for (const h of d.events.history) {
        const spec = EVENEMENTS_SAISONNIERS_SPECS.find((s) => s.id === h.eventId);
        if (spec) vus.add(spec.saison);
      }
    }
    // Les saisons du calendrier reviennent chaque année ; les autres dépendent des ères de la graine.
    for (const id of ['festivals', 'rentree', 'fetes'] as const) expect(vus.has(id), id).toBe(true);
  });

  it('reste déterministe et dans les bornes du jeu', () => {
    const run = () => labelGame.advance(jeu('bornes'), 52 * 8).session.engine.data;
    const a = run();
    expect(run().events.count).toEqual(a.events.count);
    expect(a.marche.facteurStreaming).toBeGreaterThanOrEqual(0.6);
    expect(a.marche.facteurStreaming).toBeLessThanOrEqual(1.5);
    // Les sous-genres éphémères peuvent retomber à zéro ; les genres de départ restent dans leurs bornes.
    for (const id of GENRE_IDS) {
      expect(a.marche.genres[id]?.base ?? 50).toBeGreaterThanOrEqual(5);
      expect(a.marche.genres[id]?.base ?? 50).toBeLessThanOrEqual(95);
    }
    for (const art of a.artistes) {
      expect(art.moral).toBeGreaterThanOrEqual(0);
      expect(art.hype).toBeLessThanOrEqual(100);
    }
  });

  it('les décisions saisonnières ont toutes un choix disponible', () => {
    expect(eventEngine).toBeDefined();
    for (const e of SEASON_EVENTS)
      if (e.choices) expect(e.choices.some((c) => c.id === e.defaultChoice)).toBe(true);
  });
});
