import { cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { LOANS, labelGame, loanCap, loanRate, newGame, outstanding } from './index';

describe('taux et plafond', () => {
  it('le taux baisse avec la réputation, monte avec les impayés, jamais sous le plancher', () => {
    expect(loanRate(80, 0)).toBeLessThan(loanRate(10, 0));
    expect(loanRate(50, 2)).toBeGreaterThan(loanRate(50, 0));
    expect(loanRate(100, 0)).toBeGreaterThanOrEqual(LOANS.minRateBps);
  });
  it('le plafond croît avec la réputation', () => {
    const s = newGame('cap').engine.data;
    const low = loanCap(s);
    s.label.reputation = 80;
    expect(loanCap(s)).toBeGreaterThan(low);
  });
});

describe('emprunt', () => {
  it('crédite la trésorerie, prélève intérêts et capital chaque semaine, puis solde', () => {
    const s = newGame('loan');
    s.engine.data.label.tier = 'independant';
    const before = s.engine.data.label.tresorerie;
    const r = labelGame.dispatch(s, {
      type: 'emprunter',
      montant: money.euros(10_000),
      semaines: 20,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.engine.data.label.tresorerie).toBe(before + money.euros(10_000));
    expect(outstanding(r.session.engine.data)).toBe(money.euros(10_000));
    const mid = labelGame.advance(r.session, 5).session.engine.data;
    expect(outstanding(mid)).toBeLessThan(money.euros(10_000));
    const done = labelGame.advance(r.session, 21);
    expect(done.session.engine.data.prets).toHaveLength(0);
    expect(done.session.engine.data.credit.rembourses).toBe(1);
    expect(done.signals.some((x) => x.kind === 'pret-solde')).toBe(true);
  });

  it('refuse un montant trop faible, une durée hors bornes, le dépassement du plafond et trop de prêts', () => {
    const s = newGame('loan2');
    s.engine.data.label.tier = 'independant';
    expect(labelGame.dispatch(s, { type: 'emprunter', montant: 10, semaines: 20 })).toMatchObject({
      ok: false,
      rejection: { code: 'montant-invalide' },
    });
    expect(
      labelGame.dispatch(s, { type: 'emprunter', montant: money.euros(2000), semaines: 3 }),
    ).toMatchObject({ ok: false, rejection: { code: 'duree-invalide' } });
    expect(
      labelGame.dispatch(s, { type: 'emprunter', montant: money.euros(10_000_000), semaines: 52 }),
    ).toMatchObject({ ok: false, rejection: { code: 'plafond-depasse' } });
    for (let i = 0; i < LOANS.maxActive; i += 1)
      s.engine.data.prets.push({
        id: 100 + i,
        restant: 1,
        capital: 1,
        tauxBps: 500,
        semainesRestantes: 5,
      });
    expect(
      labelGame.dispatch(s, { type: 'emprunter', montant: money.euros(2000), semaines: 52 }),
    ).toMatchObject({ ok: false, rejection: { code: 'trop-de-prets' } });
  });

  it('un impayé est signalé, compté, et renchérit le prochain taux', () => {
    const s = newGame('loan3');
    s.engine.data.label.tier = 'independant';
    const r = labelGame.dispatch(s, {
      type: 'emprunter',
      montant: money.euros(10_000),
      semaines: 13,
    });
    if (!r.ok) throw new Error('prêt attendu');
    r.session.engine.data.label.tresorerie = cents(0);
    const run = labelGame.advance(r.session, 1);
    expect(run.signals.some((x) => x.kind === 'pret-impaye')).toBe(true);
    expect(run.session.engine.data.credit.impayes).toBe(1);
  });

  it('le remboursement anticipé solde le prêt', () => {
    const s = newGame('loan4');
    s.engine.data.label.tier = 'independant';
    const r = labelGame.dispatch(s, {
      type: 'emprunter',
      montant: money.euros(5000),
      semaines: 52,
    });
    if (!r.ok) throw new Error('prêt attendu');
    const id = r.session.engine.data.prets[0]?.id ?? 0;
    const p = labelGame.dispatch(r.session, { type: 'rembourser-pret', pretId: id });
    expect(p.ok && p.session.engine.data.prets).toHaveLength(0);
    expect(labelGame.dispatch(r.session, { type: 'rembourser-pret', pretId: 9999 })).toMatchObject({
      ok: false,
      rejection: { code: 'pret-introuvable' },
    });
  });
});
