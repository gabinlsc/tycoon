import { Rng } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { FIL_LIMIT, FIL_TEMPLATES, composeActu, labelGame, newGame, scoutTalents } from './index';

const state = () => {
  const s = newGame('fil');
  scoutTalents(s.engine.data, Rng.fromSeed('f'), 'plateforme', 0);
  const a = s.engine.data.artistes[0];
  if (!a) throw new Error('artiste attendu');
  return { d: s.engine.data, a };
};

describe('gabarits', () => {
  it('offrent plusieurs variantes de titres et d’accroches par type', () => {
    for (const [kind, t] of Object.entries(FIL_TEMPLATES)) {
      expect(t.titres.length, kind).toBeGreaterThanOrEqual(3);
      expect(t.textes.length, kind).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('composition', () => {
  it('remplit les variables avec le nom de l’artiste, du rival et le palier', () => {
    const { d, a } = state();
    const rng = Rng.fromSeed('c');
    const actu = composeActu(
      d,
      rng,
      'debauchage',
      { artisteId: a.id, rivalId: d.rivaux[0]?.id },
      12,
    );
    expect(actu?.artisteId).toBe(a.id);
    expect(`${actu?.titre} ${actu?.texte}`).not.toMatch(/\{\w+\}/);
    expect(actu?.semaine).toBe(12);
    const tier = composeActu(d, rng, 'palier', { palier: 'independant' }, 3);
    expect(tier?.titre).toContain('Label indépendant');
    expect(composeActu(d, rng, 'inconnu', {}, 1)).toBeNull();
  });

  it('évite de répéter le même titre deux fois de suite', () => {
    const { d, a } = state();
    const rng = Rng.fromSeed('r');
    let previous = '';
    for (let i = 0; i < 40; i += 1) {
      const actu = composeActu(d, rng, 'sortie', { artisteId: a.id }, i);
      expect(actu?.titre).not.toBe(previous);
      previous = actu?.titre ?? '';
    }
  });
});

describe('dans la simulation', () => {
  it('raconte la partie : des actus apparaissent, bornées et rejouables', () => {
    const run = () => labelGame.advance(newGame('fil2'), 300).session.engine.data;
    const a = run();
    expect(a.fil.length).toBeGreaterThan(5);
    expect(a.fil.length).toBeLessThanOrEqual(FIL_LIMIT);
    expect(a.fil.every((x) => !/\{\w+\}/.test(x.titre + x.texte))).toBe(true);
    expect(a.fil.every((x, i) => i === 0 || x.semaine >= (a.fil[i - 1]?.semaine ?? 0))).toBe(true);
    expect(run().fil).toEqual(a.fil);
  });
});
