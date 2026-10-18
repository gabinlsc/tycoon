import { describe, expect, it, vi } from 'vitest';
import { LabelPilot, configDefi, graineDuDefi } from '@tycoon/label-tycoon';
import { creerServeurHttp, creerServeurSimule, inscrire } from './serveur';

const DATE = '2026-10-18';

function defiJoue() {
  const p = new LabelPilot();
  p.handle({ type: 'nouvelle-partie', graine: graineDuDefi(DATE), config: configDefi(DATE) });
  p.handle({ type: 'avancer', semaines: 52, arretSurSignal: false });
  const r = p.handle({ type: 'soumettre-defi', pseudo: 'Gabin' });
  if (r.type !== 'soumission') throw new Error('soumission attendue');
  return r.soumission;
}

function stockageMemoire() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
  };
}

describe('classement', () => {
  it('garde le meilleur score par pseudo, trié, limité à dix', () => {
    let c = inscrire([], { pseudo: 'A', score: 10 });
    c = inscrire(c, { pseudo: 'A', score: 5 });
    expect(c).toEqual([{ pseudo: 'A', score: 10 }]);
    c = inscrire(c, { pseudo: 'A', score: 30 });
    c = inscrire(c, { pseudo: 'B', score: 20 });
    expect(c.map((e) => e.pseudo)).toEqual(['A', 'B']);
    for (let i = 0; i < 15; i += 1) c = inscrire(c, { pseudo: `J${i}`, score: i });
    expect(c).toHaveLength(10);
  });
});

describe('serveur simulé', () => {
  it('valide par rejeu, inscrit au classement et refuse un score gonflé', async () => {
    const s = creerServeurSimule(stockageMemoire());
    const soumission = defiJoue();
    const ok = await s.soumettre(soumission);
    expect(ok).toMatchObject({ statut: 'valide', score: soumission.scoreAnnonce });
    expect(await s.classement(DATE)).toEqual([{ pseudo: 'Gabin', score: soumission.scoreAnnonce }]);
    const triche = await s.soumettre({
      ...soumission,
      pseudo: 'Tricheur',
      scoreAnnonce: 9_999_999_999,
    });
    expect(triche).toMatchObject({ statut: 'refuse', code: 'score-different' });
    expect((await s.classement(DATE)).map((e) => e.pseudo)).toEqual(['Gabin']);
  });
});

describe('client HTTP', () => {
  it('envoie la soumission en JSON et lit la réponse, même un refus', async () => {
    const appel = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () =>
        Promise.resolve({
          statut: 'refuse',
          code: 'score-different',
          message: 'non',
          scoreRecalcule: 1,
        }),
    });
    const s = creerServeurHttp('https://exemple.test', appel as unknown as typeof fetch);
    const r = await s.soumettre(defiJoue());
    expect(r).toMatchObject({ statut: 'refuse', code: 'score-different' });
    expect(appel).toHaveBeenCalledWith(
      'https://exemple.test/defi/soumissions',
      expect.objectContaining({ method: 'POST' }),
    );
  });
  it('signale un classement indisponible', async () => {
    const appel = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503, json: () => Promise.resolve([]) });
    const s = creerServeurHttp('https://exemple.test', appel as unknown as typeof fetch);
    await expect(s.classement(DATE)).rejects.toThrow(/503/);
    expect(appel).toHaveBeenCalledWith('https://exemple.test/defi/classement?date=2026-10-18');
  });
});
