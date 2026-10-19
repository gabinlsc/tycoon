import { Rng } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { CEREMONY, buildNominations, ceremonieDe, newGame, scoutTalents } from './index';

const avecCeremonie = () => {
  const s = newGame('vue-cer');
  const d = s.engine.data;
  scoutTalents(d, Rng.fromSeed('v'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  a.fanbase = 500_000;
  a.hype = 70;
  d.ceremonie = buildNominations(d, 0, Rng.fromSeed('n'));
  return d;
};

describe('vue de la cérémonie', () => {
  it('n’existe pas sans cérémonie ou pour une autre année', () => {
    expect(ceremonieDe(newGame('x').engine.data, 10)).toBeNull();
    expect(ceremonieDe(avecCeremonie(), 52 + 3)).toBeNull();
  });

  it('montre les nominations avec des noms stables, puis les résultats', () => {
    const d = avecCeremonie();
    const v = ceremonieDe(d, CEREMONY.nominationWeek);
    expect(v?.phase).toBe('nominations');
    expect(v?.annee).toBe(1);
    expect(v?.categories).toHaveLength(4);
    expect(v?.categories.every((c) => c.nommes.every((n) => n.nom.length > 0))).toBe(true);
    expect(ceremonieDe(d, CEREMONY.nominationWeek)).toEqual(v);

    for (const c of d.ceremonie?.categories ?? []) c.gagnant = c.candidats[0]?.ref ?? null;
    const r = ceremonieDe(d, CEREMONY.awardWeek);
    expect(r?.phase).toBe('resultats');
    expect(r?.categories.every((c) => c.nommes.filter((n) => n.gagnant).length === 1)).toBe(true);
    expect(r?.prixDuJoueur).toBe(
      r?.categories.flatMap((c) => c.nommes).filter((n) => n.joueur && n.gagnant).length,
    );
  });
});
