// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import type { BilanRegne } from '@tycoon/label-tycoon';
import { PANTHEON_MAX, enregistrerRegne, lirePantheon } from './pantheon';

const bilan = (valorisation: number, label = 'Label'): BilanRegne => ({
  label,
  semaines: 600,
  palier: 'groupe',
  valorisation,
  reputation: 80,
  disquesCertifies: 3,
  legendes: 1,
  generation: 1,
  bonus: [{ id: 'reseau', atteint: true, valeur: 40, cible: 30, herite: false }],
  heritage: { generation: 2, ancetre: label, reputation: 5, bonus: ['reseau'] },
});

beforeEach(() => window.localStorage.clear());

describe('Panthéon local', () => {
  it('est vide au départ et trie les règnes par valorisation', () => {
    expect(lirePantheon()).toEqual([]);
    enregistrerRegne(bilan(100, 'A'));
    enregistrerRegne(bilan(300, 'B'));
    expect(lirePantheon().map((e) => e.label)).toEqual(['B', 'A']);
  });
  it('n’inscrit pas deux fois la même clôture', () => {
    enregistrerRegne(bilan(100));
    enregistrerRegne(bilan(100));
    expect(lirePantheon()).toHaveLength(1);
  });
  it('ne garde que les meilleurs règnes', () => {
    for (let i = 1; i <= PANTHEON_MAX + 3; i += 1) enregistrerRegne(bilan(i * 10, `L${i}`));
    const liste = lirePantheon();
    expect(liste).toHaveLength(PANTHEON_MAX);
    expect(liste[PANTHEON_MAX - 1]?.valorisation).toBe(40);
  });
  it('ignore un contenu corrompu', () => {
    window.localStorage.setItem('tycoon:label:pantheon', '{pas du json');
    expect(lirePantheon()).toEqual([]);
    window.localStorage.setItem('tycoon:label:pantheon', JSON.stringify([{ label: 3 }]));
    expect(lirePantheon()).toEqual([]);
  });
});
