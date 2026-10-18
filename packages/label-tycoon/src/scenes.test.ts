import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { SCENES, completerEtat, estEmergente, initialScenes, labelGame, newGame } from './index';
import type { LabelSession, SceneLocale } from './index';
import { buildView } from './view';

const agir = (s: LabelSession, action: Parameters<typeof labelGame.dispatch>[1]): LabelSession => {
  const r = labelGame.dispatch(s, action);
  if (!r.ok) throw new Error(`refus : ${r.rejection.code}`);
  return r.session;
};

describe('scènes de villes', () => {
  it('sont déduites de la graine, une par ville, avec deux genres distincts', () => {
    const villes = ['A', 'B', 'C', 'D'];
    const x = initialScenes('s', villes);
    expect(x).toEqual(initialScenes('s', villes));
    expect(x.map((s) => s.ville)).toEqual(villes);
    for (const s of x) {
      expect(s.genre).not.toBe(s.secondaire);
      expect(s.chaleur).toBeGreaterThanOrEqual(SCENES.startHeat.min);
      expect(s.chaleur).toBeLessThanOrEqual(SCENES.startHeat.max);
    }
    expect(initialScenes('autre', villes)).not.toEqual(x);
  });

  it('évoluent chaque semaine sans sortir de 0 à 100', () => {
    const s0 = newGame('chaleur');
    const avant = s0.engine.data.scenes.map((s) => s.chaleur);
    let s = s0;
    for (let i = 0; i < 20; i += 1) {
      s = labelGame.advance(s, 13).session;
      for (const sc of s.engine.data.scenes) {
        expect(sc.chaleur).toBeGreaterThanOrEqual(0);
        expect(sc.chaleur).toBeLessThanOrEqual(100);
      }
    }
    expect(s.engine.data.scenes.map((x) => x.chaleur)).not.toEqual(avant);
  });

  it('une scène émergente est chaude et en hausse', () => {
    const base: SceneLocale = {
      ville: 'V',
      genre: 'rap',
      secondaire: 'afro',
      chaleur: 80,
      elan: 1,
      signalee: false,
    };
    expect(estEmergente(base)).toBe(true);
    expect(estEmergente({ ...base, elan: 0 })).toBe(false);
    expect(estEmergente({ ...base, chaleur: 30 })).toBe(false);
  });

  it('annonce une scène qui s’embrase', () => {
    let s = newGame('annonce');
    const scene = s.engine.data.scenes[0];
    if (!scene) throw new Error('scène attendue');
    scene.chaleur = 90;
    scene.elan = 2;
    s = labelGame.advance(s, 1).session;
    expect(s.engine.data.fil.some((a) => a.kind === 'scene-emergente')).toBe(true);
  });
});

describe('repérer dans une scène', () => {
  it('trouve des talents de la ville, dans les genres de la scène, et les suit', () => {
    let s = newGame('reperer-scene');
    const scene = s.engine.data.scenes[0];
    if (!scene) throw new Error('scène attendue');
    scene.chaleur = 100;
    const avant = s.engine.data.label.tresorerie;
    s = agir(s, { type: 'reperer-scene', ville: scene.ville });
    const d = s.engine.data;
    expect(d.label.tresorerie).toBe(avant - SCENES.scoutCost);
    expect(d.suivis).toHaveLength(SCENES.scoutCount);
    expect(d.artistes).toHaveLength(SCENES.scoutCount);
    expect(d.artistes.every((a) => a.ville === scene.ville)).toBe(true);
  });

  it('une scène brûlante donne de meilleurs talents qu’une scène froide', () => {
    const moyenne = (chaleur: number): number => {
      let total = 0;
      let n = 0;
      for (let k = 0; k < 40; k += 1) {
        let s = newGame(`talents-${k}`);
        const scene = s.engine.data.scenes[0];
        if (!scene) throw new Error('scène attendue');
        scene.chaleur = chaleur;
        s.engine.data.label.tresorerie = money.euros(100_000);
        s = agir(s, { type: 'reperer-scene', ville: scene.ville });
        for (const a of s.engine.data.artistes) {
          total += a.potentiel;
          n += 1;
        }
      }
      return total / n;
    };
    expect(moyenne(100)).toBeGreaterThan(moyenne(0) + 4);
  });

  it('refuse une ville inconnue ou un budget insuffisant', () => {
    const s = newGame('refus-scene');
    expect(labelGame.dispatch(s, { type: 'reperer-scene', ville: 'Nulle part' })).toMatchObject({
      ok: false,
      rejection: { code: 'scene-introuvable' },
    });
    s.engine.data.label.tresorerie = money.euros(10);
    const ville = s.engine.data.scenes[0]?.ville ?? '';
    expect(labelGame.dispatch(s, { type: 'reperer-scene', ville })).toMatchObject({
      ok: false,
      rejection: { code: 'fonds-insuffisants' },
    });
  });

  it('apparaît dans la vue et se complète pour une ancienne sauvegarde', () => {
    const s = newGame('vue-scenes');
    const vue = buildView(s.engine.data, 0);
    expect(vue.scenesVilles).toHaveLength(s.engine.data.villes.length);
    const d = s.engine.data as unknown as { scenes?: unknown };
    delete d.scenes;
    completerEtat(s.engine.data);
    expect(s.engine.data.scenes).toHaveLength(s.engine.data.villes.length);
  });
});
