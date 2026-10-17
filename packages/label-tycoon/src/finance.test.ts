import { type Cents, calendarOf, cents, hashState, money } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  EXPENSE_CATEGORIES,
  FINANCE,
  REVENUE_CATEGORIES,
  aggregate,
  annualRevenue,
  canAfford,
  closeWeek,
  defaultConfig,
  earn,
  fr,
  initialState,
  labelGame,
  newGame,
  spend,
} from './index';

const fresh = () => initialState('fin', defaultConfig());

describe("mouvements d'argent", () => {
  it('encaisser augmente la trésorerie et alimente le compte de la semaine', () => {
    const state = fresh();
    const before = state.label.tresorerie;
    earn(state, 'streaming', money.euros(250));
    earn(state, 'streaming', money.euros(50));
    earn(state, 'concerts', money.euros(1_000));
    expect(state.label.tresorerie).toBe(before + money.euros(1_300));
    expect(state.finances.semaine.revenus).toEqual({
      streaming: money.euros(300),
      concerts: money.euros(1_000),
    });
  });

  it('dépenser diminue la trésorerie et alimente le compte de la semaine', () => {
    const state = fresh();
    const before = state.label.tresorerie;
    spend(state, 'production', money.euros(400));
    expect(state.label.tresorerie).toBe(before - money.euros(400));
    expect(state.finances.semaine.depenses).toEqual({ production: money.euros(400) });
  });

  it('refuse une catégorie inconnue ou un montant négatif', () => {
    const state = fresh();
    expect(() => earn(state, 'loto' as never, money.euros(1))).toThrow(RangeError);
    expect(() => spend(state, 'loto' as never, money.euros(1))).toThrow(RangeError);
    expect(() => earn(state, 'streaming', cents(-1))).toThrow(RangeError);
    expect(() => spend(state, 'production', cents(-1))).toThrow(RangeError);
  });

  it('canAfford compare à la trésorerie, sauf en bac à sable', () => {
    const state = fresh();
    expect(canAfford(state, money.euros(10_000))).toBe(true);
    expect(canAfford(state, money.euros(10_001))).toBe(false);
    const sandbox = initialState('s', { ...defaultConfig('normal', 'bac-a-sable'), sandbox: true });
    sandbox.label.tresorerie = cents(0);
    expect(canAfford(sandbox, money.euros(5_000_000))).toBe(true);
  });

  it('chaque catégorie a un libellé en français', () => {
    for (const c of REVENUE_CATEGORIES) expect(fr.categoriesRevenus[c].length).toBeGreaterThan(0);
    for (const c of EXPENSE_CATEGORIES) expect(fr.categoriesDepenses[c].length).toBeGreaterThan(0);
  });
});

describe('clôture de la semaine', () => {
  it('fige le compte, calcule le net et ouvre une semaine vierge', () => {
    const state = fresh();
    earn(state, 'streaming', money.euros(500));
    spend(state, 'marketing', money.euros(200));
    const report = closeWeek(state, 0);
    expect(report).toMatchObject({
      debut: 0,
      fin: 0,
      totalRevenus: money.euros(500),
      totalDepenses: money.euros(200),
      net: money.euros(300),
    });
    expect(report.tresorerieFin).toBe(state.label.tresorerie);
    expect(state.finances.semaine).toEqual({ revenus: {}, depenses: {} });
    expect(state.finances.semaines).toHaveLength(1);
  });

  it('omet les catégories à zéro', () => {
    const state = fresh();
    earn(state, 'merch', cents(0));
    expect(closeWeek(state, 0).revenus).toEqual({});
  });

  it('agrège les semaines en mois (4-4-5) et en année', () => {
    const state = fresh();
    for (let tick = 0; tick < 52; tick += 1) {
      earn(state, 'streaming', money.euros(100 + tick));
      spend(state, 'production', money.euros(40));
      closeWeek(state, tick);
    }
    expect(state.finances.mois).toHaveLength(12);
    expect(state.finances.annees).toHaveLength(1);
    // mars de la première année : 5 semaines (indices 8 à 12)
    const march = state.finances.mois[2];
    expect(march).toMatchObject({ debut: 8, fin: 12 });
    expect(march?.totalRevenus).toBe(
      money.euros([108, 109, 110, 111, 112].reduce((a, b) => a + b, 0)),
    );
    expect(state.finances.annees[0]).toMatchObject({ debut: 0, fin: 51 });
  });

  it("les mois et l'année s'accordent avec les semaines (propriété)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            gain: fc.integer({ min: 0, max: 5_000_00 }),
            cout: fc.integer({ min: 0, max: 5_000_00 }),
          }),
          { minLength: 52, maxLength: 104 },
        ),
        (weeks) => {
          const state = fresh();
          const start = state.label.tresorerie;
          weeks.forEach((w, tick) => {
            earn(state, 'streaming', cents(w.gain));
            spend(state, 'autres', cents(w.cout));
            closeWeek(state, tick);
          });
          const { semaines, mois, annees } = state.finances;
          const netSum = money.sum(semaines.map((r) => r.net));
          const monthsNet = money.sum(mois.map((m) => m.net));
          const yearsNet = money.sum(annees.map((y) => y.net));
          const lastMonthEnd = mois[mois.length - 1]?.fin ?? -1;
          const lastYearEnd = annees[annees.length - 1]?.fin ?? -1;
          const upTo = (end: number) =>
            money.sum(semaines.filter((r) => r.fin <= end).map((r) => r.net));
          return (
            state.label.tresorerie === start + netSum &&
            monthsNet === upTo(lastMonthEnd) &&
            yearsNet === upTo(lastYearEnd) &&
            mois.every((m) => calendarOf(m.fin).isMonthEnd) &&
            annees.every((y) => calendarOf(y.fin).isYearEnd)
          );
        },
      ),
      { numRuns: 40 },
    );
  });

  it("borne l'historique des semaines et des mois, mais garde toutes les années", () => {
    const state = fresh();
    for (let tick = 0; tick < 52 * 5; tick += 1) {
      earn(state, 'streaming', money.euros(10));
      closeWeek(state, tick);
    }
    expect(state.finances.semaines).toHaveLength(FINANCE.weekHistory);
    expect(state.finances.semaines[0]?.debut).toBe(52 * 5 - FINANCE.weekHistory);
    expect(state.finances.mois).toHaveLength(FINANCE.monthHistory);
    expect(state.finances.annees).toHaveLength(5);
  });

  it('aggregate refuse une liste vide', () => {
    expect(() => aggregate([])).toThrow(RangeError);
  });

  it("calcule le chiffre d'affaires sur les 52 dernières semaines seulement", () => {
    const state = fresh();
    for (let tick = 0; tick < 80; tick += 1) {
      earn(state, 'streaming', money.euros(tick < 28 ? 1_000 : 100));
      closeWeek(state, tick);
    }
    // semaines 28 à 79 : 52 semaines à 100 €
    expect(annualRevenue(state)).toBe(money.euros(5_200));
  });
});

describe('phase de fin de semaine', () => {
  it('prélève les frais courants chaque semaine et clôt les comptes', () => {
    const run = labelGame.advance(newGame('p'), 10).session.engine.data;
    expect(run.finances.semaines).toHaveLength(10);
    expect(run.label.tresorerie).toBe(money.euros(10_000) - 10 * FINANCE.weeklyBaseCost);
    expect(run.finances.semaines[0]?.depenses).toEqual({ entretien: FINANCE.weeklyBaseCost });
  });

  it('alerte une seule fois quand la trésorerie passe sous zéro, avec auto-pause', () => {
    let session = newGame('alerte');
    session.engine.data.label.tresorerie = cents(FINANCE.weeklyBaseCost + 50);
    const first = labelGame.advance(session, 1);
    expect(first.signals.filter((s) => s.kind === 'tresorerie-negative')).toHaveLength(0);
    session = first.session;
    const second = labelGame.advance(session, 1);
    const alerts = second.signals.filter((s) => s.kind === 'tresorerie-negative');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({ interrupt: true });
    expect(second.session.engine.data.finances.sousZero).toBe(true);
    // les semaines suivantes, toujours négatif : pas de nouvelle alerte
    const third = labelGame.advance(second.session, 3);
    expect(third.signals.filter((s) => s.kind === 'tresorerie-negative')).toHaveLength(0);
  });

  it('alerte de nouveau après un retour au positif', () => {
    let session = newGame('re');
    session.engine.data.label.tresorerie = cents(-100);
    session.engine.data.finances.sousZero = true;
    // la trésorerie redevient largement positive : une semaine saine remet le compteur à zéro
    session.engine.data.label.tresorerie = cents(1_000_000);
    session = labelGame.advance(session, 1).session;
    expect(session.engine.data.finances.sousZero).toBe(false);
    // elle replonge : nouvelle alerte
    session.engine.data.label.tresorerie = cents(10);
    const next = labelGame.advance(session, 1);
    expect(next.signals.filter((s) => s.kind === 'tresorerie-negative')).toHaveLength(1);
    expect(next.session.engine.data.finances.sousZero).toBe(true);
  });

  it('reste déterministe, entier et rejouable', () => {
    const played = labelGame.advance(newGame('d'), 60).session;
    const again = labelGame.advance(newGame('d'), 60).session;
    expect(hashState(played.engine)).toBe(hashState(again.engine));
    expect(Number.isSafeInteger(played.engine.data.label.tresorerie as Cents)).toBe(true);
    for (const report of played.engine.data.finances.semaines) {
      expect(Number.isSafeInteger(report.net)).toBe(true);
      expect(report.net).toBe(report.totalRevenus - report.totalDepenses);
    }
  });
});
