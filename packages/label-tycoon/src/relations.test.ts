import { Rng } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { RELATIONS, kindOf, labelGame, newGame, relationOf, scoutTalents } from './index';

const roster = (n: number, sameGenre: boolean) => {
  const s = newGame('rel');
  const d = s.engine.data;
  scoutTalents(d, Rng.fromSeed('r'), 'plateforme', 0);
  scoutTalents(d, Rng.fromSeed('r2'), 'plateforme', 0);
  const picked = d.artistes.slice(0, n);
  picked.forEach((a, i) => {
    a.employeur = 'joueur';
    a.genre = sameGenre ? 'rap' : i === 0 ? 'rap' : 'afro';
    a.ego = 50;
  });
  return { s, ids: picked.map((a) => a.id) };
};

describe('type de relation', () => {
  it('bascule aux seuils', () => {
    expect(kindOf(-50)).toBe('rivalite');
    expect(kindOf(0)).toBe('neutre');
    expect(kindOf(50)).toBe('amitie');
  });
});

describe('évolution', () => {
  it('le même genre nourrit la rivalité, des genres différents l’amitié', () => {
    const rivals = roster(2, true);
    const run = labelGame.advance(rivals.s, 120);
    const [a = 0, b = 0] = rivals.ids;
    expect(relationOf(run.session.engine.data, a, b)?.type).toBe('rivalite');
    expect(run.signals.some((x) => x.kind === 'rivalite')).toBe(true);
    const friends = roster(2, false);
    const f = labelGame.advance(friends.s, 600).session.engine.data;
    const [c = 0, e = 0] = friends.ids;
    expect(relationOf(f, c, e)?.type).toBe('amitie');
  });
});

describe('mentorat', () => {
  const pair = () => {
    const { s, ids } = roster(2, true);
    const [m, p] = s.engine.data.artistes.filter((a) => ids.includes(a.id));
    if (!m || !p) throw new Error('paire attendue');
    m.phase = 'pic';
    p.phase = 'emergent';
    p.potentiel = 95;
    p.plume = 20;
    return { s, mentorId: m.id, protegeId: p.id };
  };

  it('fait progresser le protégé et fidélise le mentor, puis se termine', () => {
    const { s, mentorId, protegeId } = pair();
    const r = labelGame.dispatch(s, { type: 'parrainer', mentorId, protegeId });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const before = r.session.engine.data.artistes.find((a) => a.id === protegeId)?.plume ?? 0;
    const loy0 = r.session.engine.data.artistes.find((a) => a.id === mentorId)?.loyaute ?? 0;
    const later = labelGame.advance(r.session, 20).session.engine.data;
    expect(later.artistes.find((a) => a.id === protegeId)?.plume ?? 0).toBeGreaterThan(before);
    expect(later.artistes.find((a) => a.id === mentorId)?.loyaute ?? 0).toBeGreaterThanOrEqual(
      loy0,
    );
    const over = labelGame.advance(r.session, RELATIONS.mentorWeeks + 2);
    expect(over.session.engine.data.mentorats).toHaveLength(0);
    expect(over.signals.some((x) => x.kind === 'mentorat-termine')).toBe(true);
  });

  it('refuse les mentorats incohérents et les doublons', () => {
    const { s, mentorId, protegeId } = pair();
    expect(
      labelGame.dispatch(s, { type: 'parrainer', mentorId: protegeId, protegeId: mentorId }),
    ).toMatchObject({ ok: false, rejection: { code: 'mentorat-invalide' } });
    const r = labelGame.dispatch(s, { type: 'parrainer', mentorId, protegeId });
    if (!r.ok) throw new Error('mentorat attendu');
    expect(labelGame.dispatch(r.session, { type: 'parrainer', mentorId, protegeId })).toMatchObject(
      { ok: false, rejection: { code: 'deja-parraine' } },
    );
  });
});
