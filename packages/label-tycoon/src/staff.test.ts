import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { STAFF, labelGame, newGame, roleLevel, salaryFor } from './index';

const withPool = () => {
  const s = labelGame.advance(newGame('staff'), 1).session;
  s.engine.data.label.tresorerie = money.euros(500_000);
  return s;
};

describe('candidats', () => {
  it('le marché de l’emploi se remplit et se renouvelle, de façon rejouable', () => {
    const a = withPool().engine.data.candidats;
    expect(a).toHaveLength(STAFF.poolSize);
    expect(withPool().engine.data.candidats).toEqual(a);
    const later = labelGame.advance(withPool(), STAFF.refreshEvery).session.engine.data.candidats;
    expect(later).toHaveLength(STAFF.poolSize);
    expect(later.map((c) => c.id)).not.toEqual(a.map((c) => c.id));
    expect(a.every((c) => c.salaire === salaryFor(c.niveau))).toBe(true);
  });
});

describe('embauche et salaires', () => {
  it("embaucher retire le candidat du marché, l'ajoute à l'équipe et déclenche les salaires", () => {
    const s = withPool();
    const c = s.engine.data.candidats[0];
    if (!c) throw new Error('candidat attendu');
    const r = labelGame.dispatch(s, { type: 'embaucher', membreId: c.id });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.session.engine.data.personnel.map((m) => m.id)).toEqual([c.id]);
    expect(r.session.engine.data.candidats.some((x) => x.id === c.id)).toBe(false);
    expect(roleLevel(r.session.engine.data, c.role)).toBe(c.niveau);
    const before = r.session.engine.data.finances.semaine.depenses.salaires ?? 0;
    const after = labelGame.advance(r.session, 1).session.engine.data;
    expect(after.label.tresorerie).toBeLessThan(r.session.engine.data.label.tresorerie);
    void before;
  });

  it('refuse un candidat inconnu et un licenciement hors équipe', () => {
    const s = withPool();
    expect(labelGame.dispatch(s, { type: 'embaucher', membreId: 99999 })).toMatchObject({
      ok: false,
      rejection: { code: 'candidat-introuvable' },
    });
    expect(labelGame.dispatch(s, { type: 'licencier', membreId: 99999 })).toMatchObject({
      ok: false,
      rejection: { code: 'membre-introuvable' },
    });
  });

  it("l'expérience fait gagner un niveau, plus vite pour un perfectionniste", () => {
    const grow = (trait: 'perfectionniste' | 'paresseux') => {
      const s = withPool();
      const c = s.engine.data.candidats[0];
      if (!c) throw new Error('candidat attendu');
      c.trait = trait;
      c.niveau = 40;
      const r = labelGame.dispatch(s, { type: 'embaucher', membreId: c.id });
      if (!r.ok) throw new Error('embauche attendue');
      return labelGame.advance(r.session, 104).session.engine.data.personnel[0]?.niveau ?? 0;
    };
    expect(grow('perfectionniste')).toBeGreaterThan(grow('paresseux'));
  });
});
