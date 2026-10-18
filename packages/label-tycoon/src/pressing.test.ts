import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  FORMATS,
  PRESSING,
  labelGame,
  newGame,
  pressingWeeks,
  scoutTalents,
  stockOf,
  unitCost,
} from './index';

const released = (level = 1) => {
  const s = newGame('press');
  const d = s.engine.data;
  d.label.tresorerie = money.euros(2_000_000);
  d.batiments.niveaux.pressage = level;
  scoutTalents(d, Rng.fromSeed('p'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  d.projets.push({
    id: 900,
    artisteId: a.id,
    type: 'album',
    clip: 'aucun',
    studio: 50,
    producteur: 50,
    mixage: 0,
    debut: 0,
    fin: 0,
    retard: 0,
    statut: 'sortie',
    qualite: 70,
    sortieLe: 0,
    s1: 5_000_000,
    hit: 0,
    viral: null,
    derniers: 5_000_000,
    certification: null,
    streams: 0,
  });
  return s;
};

describe('coût et délai', () => {
  it('baissent avec le niveau du bâtiment de pressage', () => {
    const lo = released(1).engine.data;
    const hi = released(3).engine.data;
    expect(unitCost(hi, 'vinyle')).toBeLessThan(unitCost(lo, 'vinyle'));
    expect(pressingWeeks(hi, 'vinyle')).toBeLessThan(pressingWeeks(lo, 'vinyle'));
    expect(unitCost(lo, 'cd')).toBeLessThan(unitCost(lo, 'vinyle'));
  });
});

describe('commande', () => {
  it('débite le coût, arrive après le délai, se vend puis rapporte du revenu physique', () => {
    const s = released();
    const before = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, {
      type: 'presser',
      projetId: 900,
      format: 'vinyle',
      quantite: 1000,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.session.engine.data;
    expect(d.label.tresorerie).toBe(before - 1000 * unitCost(d, 'vinyle'));
    const c = d.commandes[0];
    expect(c && stockOf(c, 0)).toBe(0);
    const later = labelGame.advance(r.session, pressingWeeks(d, 'vinyle') + 6).session.engine.data;
    expect(later.commandes[0]?.vendu).toBeGreaterThan(0);
    expect(later.finances.annees.length + later.finances.semaines.length).toBeGreaterThan(0);
  });

  it('liquide les invendus après un an, à prix cassé', () => {
    const s = released();
    const d0 = s.engine.data;
    const p = d0.projets[0];
    if (p) p.derniers = 0;
    const r = labelGame.dispatch(s, {
      type: 'presser',
      projetId: 900,
      format: 'cd',
      quantite: 500,
    });
    if (!r.ok) throw new Error('commande attendue');
    const out = labelGame.advance(
      r.session,
      pressingWeeks(r.session.engine.data, 'cd') + PRESSING.liquidateAfter + 1,
    ).session.engine.data;
    expect(out.commandes[0]?.liquide).toBe(true);
    expect(out.commandes[0]?.vendu).toBe(500);
    expect(FORMATS.cd.prix).toBeGreaterThan(0);
  });

  it('refuse sans bâtiment, hors quantités permises, ou sans projet sorti', () => {
    const none = released(0);
    expect(
      labelGame.dispatch(none, { type: 'presser', projetId: 900, format: 'cd', quantite: 500 }),
    ).toMatchObject({ ok: false, rejection: { code: 'pas-de-pressage' } });
    const s = released();
    expect(
      labelGame.dispatch(s, { type: 'presser', projetId: 900, format: 'cd', quantite: 5 }),
    ).toMatchObject({ ok: false, rejection: { code: 'quantite-invalide' } });
    expect(
      labelGame.dispatch(s, { type: 'presser', projetId: 1, format: 'cd', quantite: 500 }),
    ).toMatchObject({ ok: false, rejection: { code: 'projet-introuvable' } });
  });
});
