import { describe, expect, it } from 'vitest';
import { CATEGORIES_PAUSE, REGLAGES_PAR_DEFAUT, lireReglages, pauseDeclenchee } from './temps';

describe('auto-pauses', () => {
  it('ne se déclenchent que sur un signal d’interruption dont la catégorie est active', () => {
    expect(
      pauseDeclenchee([{ kind: 'decision-requise', interrupt: false }], REGLAGES_PAR_DEFAUT),
    ).toBeNull();
    expect(
      pauseDeclenchee([{ kind: 'decision-requise', interrupt: true }], REGLAGES_PAR_DEFAUT),
    ).toBe('decision');
    expect(
      pauseDeclenchee([{ kind: 'decision-requise', interrupt: true }], {
        ...REGLAGES_PAR_DEFAUT,
        decision: false,
      }),
    ).toBeNull();
    expect(pauseDeclenchee([{ kind: 'burnout', interrupt: true }], REGLAGES_PAR_DEFAUT)).toBe(
      'burnout',
    );
  });
  it('mettent toujours en pause sur une interruption inconnue', () => {
    expect(pauseDeclenchee([{ kind: 'inconnue', interrupt: true }], REGLAGES_PAR_DEFAUT)).toBe(
      'autre',
    );
  });
  it('relisent des réglages mémorisés, avec repli sûr', () => {
    expect(lireReglages(null)).toEqual(REGLAGES_PAR_DEFAUT);
    expect(lireReglages('pas du json')).toEqual(REGLAGES_PAR_DEFAUT);
    expect(lireReglages(JSON.stringify({ decision: false, bidule: 1, burnout: 'oui' }))).toEqual({
      ...REGLAGES_PAR_DEFAUT,
      decision: false,
    });
    expect(CATEGORIES_PAUSE.length).toBe(Object.keys(REGLAGES_PAR_DEFAUT).length);
  });
});
