import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { TAX, labelGame, newGame, taxDue } from './index';

describe('impôt dû', () => {
  it('est nul sans bénéfice, proportionnel au taux de la stratégie sinon', () => {
    expect(taxDue(-1000, 'prudente')).toBe(0);
    expect(taxDue(0, 'agressive')).toBe(0);
    expect(taxDue(10_000, 'prudente')).toBe(2500);
    expect(taxDue(10_000, 'agressive')).toBeLessThan(taxDue(10_000, 'optimisee'));
    expect(taxDue(10_000, 'optimisee')).toBeLessThan(taxDue(10_000, 'prudente'));
  });
});

describe('fin d’année', () => {
  it('prélève l’impôt sur le bénéfice de l’exercice', () => {
    const s = newGame('tax');
    s.engine.data.label.tresorerie = money.euros(1_000_000);
    const r = labelGame.advance(s, 52);
    const year = r.session.engine.data.finances.annees[0];
    expect(r.signals.some((x) => x.kind === 'impot')).toBe(true);
    expect(r.session.engine.data.fiscalite.dernierImpot).toBe(taxDue(year?.net ?? 0, 'prudente'));
  });

  it('paie un impôt positif quand l’exercice est bénéficiaire', () => {
    const s = newGame('tax2');
    s.engine.data.label.tresorerie = money.euros(1_000_000);
    const d = s.engine.data;
    d.finances.semaine.revenus.streaming = money.euros(500_000);
    const r = labelGame.advance(s, 52);
    const year = r.session.engine.data.finances.annees[0];
    expect(year?.net ?? 0).toBeGreaterThan(0);
    expect(r.session.engine.data.fiscalite.dernierImpot).toBe(taxDue(year?.net ?? 0, 'prudente'));
  });

  it('une stratégie agressive finit par être contrôlée et sanctionnée', () => {
    let controls = 0;
    for (let i = 0; i < 12; i += 1) {
      const s = newGame(`audit${i}`);
      const d = s.engine.data;
      d.label.tresorerie = money.euros(5_000_000);
      d.fiscalite.strategie = 'agressive';
      d.finances.semaine.revenus.streaming = money.euros(500_000);
      const rep = d.label.reputation;
      const r = labelGame.advance(s, 52);
      if (r.session.engine.data.fiscalite.controles > 0) {
        controls += 1;
        expect(r.session.engine.data.label.reputation).toBeLessThanOrEqual(
          Math.max(0, rep - TAX.auditReputationLoss) + 5,
        );
      }
    }
    expect(controls).toBeGreaterThan(0);
  });

  it('change de stratégie, et refuse une stratégie inconnue', () => {
    const s = newGame('tax3');
    const r = labelGame.dispatch(s, { type: 'choisir-fiscalite', strategie: 'optimisee' });
    expect(r.ok && r.session.engine.data.fiscalite.strategie).toBe('optimisee');
    expect(
      labelGame.dispatch(s, { type: 'choisir-fiscalite', strategie: 'x' as never }),
    ).toMatchObject({ ok: false, rejection: { code: 'strategie-inconnue' } });
  });
});
