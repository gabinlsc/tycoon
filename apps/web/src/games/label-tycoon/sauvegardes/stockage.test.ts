import { describe, expect, it } from 'vitest';
import { PURGES } from '../../registry';
import { metadonneesCompte } from './regles';
import {
  EMPLACEMENTS,
  type SauvegardeLabel,
  creerStockageMemoire,
  estEmplacement,
  purgerParties,
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

describe('métadonnées et purge pour la page de compte', () => {
  it('résume la partie la plus récente et le nombre d’emplacements', async () => {
    expect(metadonneesCompte({})).toBeNull();
    const ancienne = { ...sauvegarde('Vieux'), enregistreLe: '2026-01-01T00:00:00Z' };
    const recente = { ...sauvegarde('Neuf'), enregistreLe: '2026-02-01T00:00:00Z', semaine: 9 };
    const meta = metadonneesCompte({ auto: ancienne, 'manuel-1': recente });
    expect(meta?.emplacements).toBe(2);
    expect(meta?.resume).toContain('Neuf · semaine 9');
    expect(meta?.resume).toContain('2 emplacements');
  });
  it('purge tous les emplacements d’un compte sans toucher aux autres', async () => {
    const s = creerStockageMemoire();
    await s.ecrire('a', 'auto', sauvegarde('A'));
    await s.ecrire('a', 'manuel-3', sauvegarde('A3'));
    await s.ecrire('b', 'auto', sauvegarde('B'));
    await purgerParties('a', s);
    expect(await s.lister('a')).toEqual({});
    expect(Object.keys(await s.lister('b'))).toEqual(['auto']);
  });
  it('enregistre la purge du jeu pour la page de compte', () => {
    expect(typeof PURGES['label-tycoon']).toBe('function');
  });
});
