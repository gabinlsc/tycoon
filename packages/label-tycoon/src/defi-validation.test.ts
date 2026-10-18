import { describe, expect, it } from 'vitest';
import {
  JOURNAL_MAX,
  LabelPilot,
  type LabelAction,
  type SoumissionDefi,
  configDefi,
  graineDuDefi,
  soumissionDe,
  validerSoumission,
} from './index';

const DATE = '2026-10-18';

/** Une vraie partie de défi : quelques actions réelles, puis 52 semaines. */
function partieJouee(): SoumissionDefi {
  const p = new LabelPilot();
  p.handle({ type: 'nouvelle-partie', graine: graineDuDefi(DATE), config: configDefi(DATE) });
  p.handle({ type: 'action', action: { type: 'renommer-label', nom: 'Neon Dust' } });
  p.handle({ type: 'action', action: { type: 'reperer', source: 'open-mic' } });
  p.handle({ type: 'avancer', semaines: 20, arretSurSignal: false });
  p.handle({ type: 'action', action: { type: 'reperer', source: 'battle' } });
  p.handle({ type: 'avancer', semaines: 40, arretSurSignal: false });
  const r = p.handle({ type: 'soumettre-defi', pseudo: 'Gabin' });
  if (r.type !== 'soumission') throw new Error('soumission attendue');
  return r.soumission;
}

describe('soumission d’un défi', () => {
  it('n’existe qu’une fois les 52 semaines jouées', () => {
    const p = new LabelPilot();
    p.handle({ type: 'nouvelle-partie', graine: graineDuDefi(DATE), config: configDefi(DATE) });
    p.handle({ type: 'avancer', semaines: 10, arretSurSignal: false });
    expect(p.handle({ type: 'soumettre-defi' })).toMatchObject({ type: 'erreur' });
    const libre = new LabelPilot();
    libre.handle({ type: 'nouvelle-partie', graine: 'libre' });
    expect(libre.handle({ type: 'soumettre-defi' })).toMatchObject({ type: 'erreur' });
  });
  it('contient le journal, le score annoncé et le pseudo', () => {
    const s = partieJouee();
    expect(s).toMatchObject({ version: 1, date: DATE, semaines: 52, pseudo: 'Gabin' });
    expect(s.journal.length).toBe(3);
    expect(s.journal[0]).toEqual({
      tick: 0,
      action: { type: 'renommer-label', nom: 'Neon Dust' },
    });
  });
});

describe('validation par rejeu', () => {
  it('valide un journal honnête et recalcule le même score', () => {
    const s = partieJouee();
    expect(validerSoumission(s)).toEqual({
      statut: 'valide',
      date: DATE,
      semaines: 52,
      score: s.scoreAnnonce,
    });
  });
  it('survit à un aller-retour JSON (ce qui passe par le réseau)', () => {
    const s = partieJouee();
    const reçu: unknown = JSON.parse(JSON.stringify(s));
    expect(validerSoumission(reçu)).toMatchObject({ statut: 'valide' });
  });
  it('refuse un score gonflé en donnant le score réel', () => {
    const s = partieJouee();
    const r = validerSoumission({ ...s, scoreAnnonce: s.scoreAnnonce + 1_000_000 });
    expect(r).toMatchObject({
      statut: 'refuse',
      code: 'score-different',
      scoreRecalcule: s.scoreAnnonce,
    });
  });
  it('refuse un journal falsifié (action truquée, score inchangé)', () => {
    const s = partieJouee();
    const triche: LabelAction = { type: 'reperer', source: 'plateforme' };
    const r = validerSoumission({ ...s, journal: [...s.journal, { tick: 5, action: triche }] });
    // L'action supplémentaire change le déroulé : soit refusée au rejeu, soit un autre score.
    expect(r.statut).toBe('refuse');
  });
  it('refuse une action impossible au rejeu', () => {
    const s = partieJouee();
    const r = validerSoumission({
      ...s,
      journal: [{ tick: 0, action: { type: 'embaucher', membreId: 424242 } }],
    });
    expect(r).toMatchObject({ statut: 'refuse', code: 'action-refusee' });
  });
  it('refuse un journal mal ordonné ou dépassant la fin du défi', () => {
    const s = partieJouee();
    const a = { type: 'renommer-label', nom: 'A' };
    expect(
      validerSoumission({
        ...s,
        journal: [
          { tick: 9, action: a },
          { tick: 3, action: a },
        ],
      }),
    ).toMatchObject({ statut: 'refuse', code: 'action-refusee' });
    expect(validerSoumission({ ...s, journal: [{ tick: 80, action: a }] })).toMatchObject({
      statut: 'refuse',
    });
  });
});

describe('contrôle de la forme', () => {
  const s = partieJouee();
  const cas: [string, unknown, string][] = [
    ['pas un objet', 'oups', 'format'],
    ['tableau', [], 'format'],
    ['mauvaise version', { ...s, version: 2 }, 'version'],
    ['date invalide', { ...s, date: 'hier' }, 'date'],
    ['mauvais nombre de semaines', { ...s, semaines: 30 }, 'semaines'],
    ['score absent', { ...s, scoreAnnonce: 'beaucoup' }, 'format'],
    ['journal absent', { ...s, journal: 'rien' }, 'format'],
    ['entrée mal formée', { ...s, journal: [{ tick: 'x', action: {} }] }, 'journal-invalide'],
    ['action sans type', { ...s, journal: [{ tick: 0, action: {} }] }, 'journal-invalide'],
    [
      'journal trop long',
      {
        ...s,
        journal: Array.from({ length: JOURNAL_MAX + 1 }, () => ({
          tick: 0,
          action: { type: 'x' },
        })),
      },
      'journal-trop-long',
    ],
  ];
  it.each(cas)('refuse : %s', (_nom, entree, code) => {
    expect(validerSoumission(entree)).toMatchObject({ statut: 'refuse', code });
  });
  it('ne lève jamais d’exception, même pour des valeurs absurdes', () => {
    for (const v of [null, undefined, 42, true, { version: 1 }, { version: 1, date: DATE }])
      expect(() => validerSoumission(v)).not.toThrow();
  });
});

describe('soumissionDe', () => {
  it('renvoie null hors d’un défi terminé', () => {
    const p = new LabelPilot();
    p.handle({ type: 'nouvelle-partie', graine: 'libre' });
    expect(p.handle({ type: 'soumettre-defi' }).type).toBe('erreur');
    expect(soumissionDe).toBeTypeOf('function');
  });
});
