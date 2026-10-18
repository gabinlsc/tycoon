import { Rng, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { CHARTS, chartOf, labelGame, marketNoise, newGame, scoutTalents } from './index';

describe('bruit de marché', () => {
  it('produit 50 entrées décroissantes en moyenne, rejouables', () => {
    const a = marketNoise(Rng.fromSeed('n'), 'singles');
    expect(a).toHaveLength(CHARTS.size);
    expect(a[0]?.streams).toBeGreaterThan(a[49]?.streams ?? 0);
    expect(marketNoise(Rng.fromSeed('n'), 'singles')).toEqual(a);
    expect(a.every((e) => e.projetId === null)).toBe(true);
  });
  it('range les singles et les albums dans leur classement', () => {
    expect(chartOf('single')).toBe('singles');
    expect(chartOf('album')).toBe('albums');
    expect(chartOf('ep')).toBe('albums');
  });
});

describe('classements dans la simulation', () => {
  it('une sortie du joueur entre au classement, garde sa meilleure place et son historique', () => {
    const session = newGame('chart');
    const d = session.engine.data;
    d.label.tresorerie = money.euros(500_000);
    d.batiments.niveaux.studio = 5;
    scoutTalents(d, Rng.fromSeed('c'), 'plateforme', 0);
    const artist = d.artistes[0];
    if (!artist) throw new Error('artiste attendu');
    artist.employeur = 'joueur';
    artist.fanbase = 400_000;
    artist.hype = 80;
    const l = labelGame.dispatch(session, {
      type: 'lancer-projet',
      artisteId: artist.id,
      sortie: 'single',
      clip: 'gros',
      studio: 90,
      producteur: 90,
      mixage: money.euros(1500),
    });
    if (!l.ok) throw new Error('lancement attendu');
    const fin = l.session.engine.data.projets[0]?.fin ?? 0;
    const ready = labelGame.advance(l.session, fin + 1).session;
    const out = labelGame.dispatch(ready, {
      type: 'sortir-projet',
      projetId: ready.engine.data.projets[0]?.id ?? 0,
    });
    if (!out.ok) throw new Error('sortie attendue');
    const run = labelGame.advance(out.session, 12);
    const data = run.session.engine.data;
    const history = Object.values(data.classements.historique)[0];
    expect(history).toBeDefined();
    expect(history?.semaines).toBeGreaterThan(0);
    expect(history?.meilleure).toBeLessThanOrEqual(CHARTS.size);
    expect(data.classements.singles).toHaveLength(CHARTS.size);
    expect(run.signals.some((s) => s.kind === 'entree-classement')).toBe(true);
  });
});
