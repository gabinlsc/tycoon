import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  CEREMONY,
  CEREMONY_CATEGORIES,
  EVENT_TEXTS,
  LABEL_EVENTS,
  buildNominations,
  drawWinner,
  labelGame,
  newGame,
  scoutTalents,
} from './index';

const withRelease = () => {
  const s = newGame('cer');
  const d = s.engine.data;
  d.label.tresorerie = money.euros(500_000);
  scoutTalents(d, Rng.fromSeed('c'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  a.fanbase = 500_000;
  a.hype = 70;
  a.phase = 'montee';
  d.projets.push({
    id: 600,
    artisteId: a.id,
    type: 'single',
    clip: 'aucun',
    studio: 50,
    producteur: 50,
    mixage: 0,
    debut: 0,
    fin: 0,
    retard: 0,
    statut: 'sortie',
    qualite: 95,
    sortieLe: 10,
    s1: 0,
    hit: 0,
    viral: null,
    derniers: 0,
    certification: null,
    streams: 5_000_000,
  });
  return { s, a };
};

describe('nominations', () => {
  it('limitent le nombre de nommés et mêlent sorties du joueur et fictifs', () => {
    const { s } = withRelease();
    const c = buildNominations(s.engine.data, 1, Rng.fromSeed('n'));
    expect(c.categories.map((x) => x.categorie)).toEqual([...CEREMONY_CATEGORIES]);
    for (const cat of c.categories) {
      expect(cat.candidats.length).toBeLessThanOrEqual(CEREMONY.nominees);
      expect(cat.candidats.some((x) => !x.joueur)).toBe(true);
    }
    const single = c.categories.find((x) => x.categorie === 'single');
    expect(single?.candidats.some((x) => x.ref === 'projet:600')).toBe(true);
    expect(
      c.categories.find((x) => x.categorie === 'revelation')?.candidats.some((x) => x.joueur),
    ).toBe(true);
  });

  it('le tirage du gagnant favorise le meilleur score et se rejoue', () => {
    const cat = {
      categorie: 'single' as const,
      gagnant: null,
      candidats: [
        { ref: 'a', joueur: true, artisteId: 1, score: 95 },
        { ref: 'b', joueur: false, artisteId: null, score: 40 },
      ],
    };
    let a = 0;
    for (let i = 0; i < 400; i += 1) if (drawWinner(cat, Rng.fromSeed(`w${i}`)) === 'a') a += 1;
    expect(a).toBeGreaterThan(300);
    expect(drawWinner(cat, Rng.fromSeed('x'))).toBe(drawWinner(cat, Rng.fromSeed('x')));
    expect(drawWinner({ ...cat, candidats: [] }, Rng.fromSeed('y'))).toBeNull();
  });
});

describe('dans la simulation', () => {
  it('nomme puis remet les prix en cours d’année, avec événements et récompenses', () => {
    const { s } = withRelease();
    const run = labelGame.advance(s, 52 + CEREMONY.awardWeek + 1);
    const d = run.session.engine.data;
    expect(run.signals.some((x) => x.kind === 'nomination')).toBe(true);
    expect(d.ceremonie?.categories.every((c) => c.gagnant !== null)).toBe(true);
    const fired = new Set(d.events.history.map((h) => h.eventId));
    expect(fired.has('nomination-recue')).toBe(true);
    expect(['prix-remporte', 'prix-perdu'].some((id) => fired.has(id))).toBe(true);
    const again = labelGame.advance(withRelease().s, 52 + CEREMONY.awardWeek + 1).session.engine
      .data;
    expect(again.ceremonie).toEqual(d.ceremonie);
  });

  it('compte au moins huit événements de cérémonie, tous traduits', () => {
    const events = LABEL_EVENTS.filter((e) => e.category === 'ceremonies');
    expect(events.length).toBeGreaterThanOrEqual(8);
    for (const e of events) expect(EVENT_TEXTS[e.id]).toBeDefined();
  });
});
