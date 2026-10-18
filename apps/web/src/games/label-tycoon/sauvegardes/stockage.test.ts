import { describe, expect, it } from 'vitest';
import {
  EMPLACEMENTS,
  type SauvegardeLabel,
  creerStockageMemoire,
  estEmplacement,
} from './stockage';

const sauvegarde = (label: string): SauvegardeLabel => ({
  version: 1,
  sauvegarde: '{}',
  semaine: 1,
  label,
  palier: '',
  tresorerie: 0,
  enregistreLe: '',
});

describe('stockage des parties', () => {
  it('propose un emplacement automatique et trois manuels', () => {
    expect(EMPLACEMENTS).toEqual(['auto', 'manuel-1', 'manuel-2', 'manuel-3']);
    expect(estEmplacement('manuel-2')).toBe(true);
    expect(estEmplacement('manuel-4')).toBe(false);
  });
  it('isole les sauvegardes par compte et par emplacement', async () => {
    const s = creerStockageMemoire();
    await s.ecrire('a', 'auto', sauvegarde('A'));
    await s.ecrire('b', 'auto', sauvegarde('B'));
    await s.ecrire('a', 'manuel-1', sauvegarde('A1'));
    expect((await s.lire('a', 'auto'))?.label).toBe('A');
    expect((await s.lire('b', 'auto'))?.label).toBe('B');
    expect(Object.keys(await s.lister('a')).sort()).toEqual(['auto', 'manuel-1']);
    await s.effacer('a', 'auto');
    expect(await s.lire('a', 'auto')).toBeNull();
    expect(await s.lire('b', 'auto')).not.toBeNull();
  });
});
