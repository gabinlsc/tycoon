import { describe, expect, it } from 'vitest';
import {
  DEFI_SEMAINES,
  LabelPilot,
  configDefi,
  dateDuDefi,
  dateValide,
  graineDuDefi,
  labelGame,
  newGame,
  nouveauDefi,
  resultatDefi,
  scoreDefi,
  texteResultat,
} from './index';

describe('seed du jour', () => {
  it('découle de la date UTC et pas de l’heure', () => {
    expect(dateDuDefi(new Date('2026-10-18T00:00:00Z'))).toBe('2026-10-18');
    expect(dateDuDefi(new Date('2026-10-18T23:59:59Z'))).toBe('2026-10-18');
    expect(graineDuDefi('2026-10-18')).toBe('defi-2026-10-18');
  });
  it('valide le format de date', () => {
    expect(dateValide('2026-10-18')).toBe(true);
    expect(dateValide('18/10/2026')).toBe(false);
    expect(dateValide('2026-13-40')).toBe(false);
    expect(() => configDefi('hier')).toThrow(RangeError);
  });
  it('donne le même monde à tous les joueurs du jour, un autre le lendemain', () => {
    const a = nouveauDefi('2026-10-18');
    const b = nouveauDefi('2026-10-18');
    const c = nouveauDefi('2026-10-19');
    expect(JSON.stringify(a.engine.data)).toBe(JSON.stringify(b.engine.data));
    expect(a.engine.data.villes).not.toEqual(c.engine.data.villes);
    expect(a.engine.data.config).toMatchObject({ mode: 'defi', defiDate: '2026-10-18' });
  });
  it('refuse une graine qui ne correspond pas à la date', () => {
    expect(() => newGame('ma-graine', configDefi('2026-10-18'))).toThrow(/découle de sa date/);
  });
});

describe('déroulement du défi', () => {
  it('s’arrête à 52 semaines et refuse toute action ensuite', () => {
    const p = new LabelPilot();
    p.handle({
      type: 'nouvelle-partie',
      graine: graineDuDefi('2026-10-18'),
      config: configDefi('2026-10-18'),
    });
    const r = p.handle({ type: 'avancer', semaines: 52, arretSurSignal: false });
    expect(r.type).toBe('vue');
    if (r.type !== 'vue') return;
    expect(r.vue.semaine).toBe(DEFI_SEMAINES);
    expect(r.vue.defi?.termine).toBe(true);
    const encore = p.handle({ type: 'avancer', semaines: 10, arretSurSignal: false });
    expect(encore.type === 'vue' && encore.vue.semaine).toBe(DEFI_SEMAINES);
    const action = p.handle({
      type: 'action',
      action: { type: 'renommer-label', nom: 'Trop tard' },
    });
    expect(action).toMatchObject({ type: 'refus', code: 'defi-termine' });
  });
  it('n’affecte pas les autres modes', () => {
    const p = new LabelPilot();
    p.handle({ type: 'nouvelle-partie', graine: 'libre' });
    const r = p.handle({ type: 'avancer', semaines: 52, arretSurSignal: false });
    p.handle({ type: 'avancer', semaines: 10, arretSurSignal: false });
    expect(r.type === 'vue' && r.vue.defi).toBeNull();
  });
  it('est reproductible : mêmes actions, même score', () => {
    const jouer = () => {
      let s = nouveauDefi('2026-10-18');
      s = labelGame.advance(s, 52).session;
      return scoreDefi(s.engine.data, s.engine.tick);
    };
    expect(jouer()).toBe(jouer());
  });
});

describe('score et partage', () => {
  it('vaut zéro en cas de faillite', () => {
    const s = nouveauDefi('2026-10-18');
    s.engine.data.faillite.terminee = true;
    expect(scoreDefi(s.engine.data, 10)).toBe(0);
  });
  it('compose un texte court sans donnée personnelle', () => {
    const s = labelGame.advance(nouveauDefi('2026-10-18'), 52).session;
    const r = resultatDefi(s.engine.data, s.engine.tick);
    if (!r) throw new Error('résultat attendu');
    const texte = texteResultat(r);
    expect(texte).toContain('Défi du 2026-10-18');
    expect(texte).toContain('52/52 semaines');
    expect(texte.split('\n').length).toBeLessThanOrEqual(4);
    expect(texte).not.toContain(s.engine.data.label.nom);
  });
  it('ne produit aucun résultat hors du mode défi', () => {
    const s = newGame('libre');
    expect(resultatDefi(s.engine.data, 0)).toBeNull();
  });
});
