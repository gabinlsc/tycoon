import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  BUILDINGS,
  BUILDING_EFFECTS,
  labelGame,
  newGame,
  productionCapacity,
  studioCap,
  teamCapacity,
} from './index';

const rich = () => {
  const s = newGame('bat');
  s.engine.data.label.tresorerie = money.euros(5_000_000);
  return s;
};

describe('état de départ', () => {
  it('commence avec un studio et des bureaux de niveau 1', () => {
    const d = newGame('b').engine.data;
    expect(d.batiments.niveaux).toMatchObject({
      studio: 1,
      bureaux: 1,
      repetition: 0,
      pressage: 0,
      concert: 0,
    });
    expect(studioCap(d)).toBe(BUILDING_EFFECTS.studioCapPerLevel);
    expect(teamCapacity(d)).toBe(BUILDING_EFFECTS.teamBase + BUILDING_EFFECTS.teamPerOffice);
  });
});

describe('construction', () => {
  it('débite le coût, termine après les travaux, puis augmente les capacités', () => {
    const s = rich();
    const before = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, { type: 'construire', batiment: 'studio' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.engine.data.label.tresorerie).toBe(before - (BUILDINGS.studio.cost[1] ?? 0));
    expect(r.session.engine.data.batiments.niveaux.studio).toBe(1);
    const done = labelGame.advance(r.session, BUILDINGS.studio.weeks + 1);
    expect(done.session.engine.data.batiments.niveaux.studio).toBe(2);
    expect(done.signals.some((x) => x.kind === 'batiment-termine')).toBe(true);
    expect(productionCapacity(done.session.engine.data)).toBe(
      productionCapacity(s.engine.data) + 1,
    );
    expect(studioCap(done.session.engine.data)).toBe(2 * BUILDING_EFFECTS.studioCapPerLevel);
  });

  it('refuse les travaux en double, le palier insuffisant, le niveau maximal et le manque de fonds', () => {
    const s = rich();
    const r = labelGame.dispatch(s, { type: 'construire', batiment: 'bureaux' });
    if (!r.ok) throw new Error('construction attendue');
    expect(
      labelGame.dispatch(r.session, { type: 'construire', batiment: 'bureaux' }),
    ).toMatchObject({ ok: false, rejection: { code: 'travaux-en-cours' } });
    expect(labelGame.dispatch(s, { type: 'construire', batiment: 'concert' })).toMatchObject({
      ok: false,
      rejection: { code: 'palier-insuffisant' },
    });
    s.engine.data.batiments.niveaux.bureaux = BUILDINGS.bureaux.maxLevel;
    expect(labelGame.dispatch(s, { type: 'construire', batiment: 'bureaux' })).toMatchObject({
      ok: false,
      rejection: { code: 'niveau-maximal' },
    });
    const poor = newGame('p');
    expect(labelGame.dispatch(poor, { type: 'construire', batiment: 'studio' })).toMatchObject({
      ok: false,
      rejection: { code: 'fonds-insuffisants' },
    });
  });

  it("l'entretien est prélevé chaque semaine et la répétition aide la récupération", () => {
    const s = rich();
    s.engine.data.batiments.niveaux.repetition = 3;
    const t0 = s.engine.data.label.tresorerie;
    const after = labelGame.advance(s, 1).session.engine.data.label.tresorerie;
    expect(t0 - after).toBeGreaterThanOrEqual(
      BUILDINGS.studio.upkeep + BUILDINGS.bureaux.upkeep + 3 * BUILDINGS.repetition.upkeep,
    );
  });

  it('un studio modeste limite le niveau des sorties', () => {
    const s = rich();
    const art = {
      type: 'lancer-projet',
      artisteId: 1,
      sortie: 'single',
      clip: 'aucun',
      studio: 80,
      producteur: 50,
      mixage: 0,
    } as const;
    s.engine.data.artistes.push({ id: 1, employeur: 'joueur' } as never);
    expect(labelGame.dispatch(s, art)).toMatchObject({
      ok: false,
      rejection: { code: 'studio-trop-modeste' },
    });
  });
});
