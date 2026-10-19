// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueArtiste } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { texteEffectif } from './Roster';
import { SANS_FILTRE, alertesArtiste, filtrer, trier } from './rosterFiltres';

afterEach(cleanup);

const a = (id: number, nom: string, over: Partial<VueArtiste> = {}): VueArtiste => ({
  id,
  nom,
  genre: 'rap',
  genreNom: 'Rap',
  phase: 'montee',
  phaseNom: 'En montée',
  ville: 'Paris',
  traits: [],
  age: 22,
  employeur: 'joueur',
  notoriete: 40,
  fans: 1000,
  hype: 30,
  moral: 60,
  fatigue: 20,
  competences: {},
  contrat: null,
  enProduction: false,
  avanceIndicative: 0,
  ...over,
});

const liste = [
  a(1, 'Zed', { notoriete: 50 }),
  a(2, 'Aya', { notoriete: 80, genre: 'afro', genreNom: 'Afro' }),
  a(3, 'bob', { notoriete: 50 }),
];

describe('effectif du roster', () => {
  it('compare le nombre d’artistes au plafond du palier', () => {
    expect(texteEffectif(3, 6)).toBe('3 artistes sous contrat sur 6 possibles à ton palier.');
    expect(texteEffectif(1, 6)).toContain('1 artiste sous contrat');
  });
  it('invite à monter de palier quand le roster est plein', () => {
    expect(texteEffectif(6, 6)).toContain('le roster est plein');
  });
  it('n’annonce aucun plafond en bac à sable', () => {
    expect(texteEffectif(30, null)).toBe('30 artistes sous contrat.');
  });
});

describe('tri et filtre', () => {
  it('trie par nom sans tenir compte de la casse, par valeur, et départage les ex æquo par identifiant', () => {
    expect(trier(liste, 'nom', false).map((x) => x.nom)).toEqual(['Aya', 'bob', 'Zed']);
    expect(trier(liste, 'notoriete', true).map((x) => x.id)).toEqual([2, 1, 3]);
    expect(trier(liste, 'notoriete', false).map((x) => x.id)).toEqual([1, 3, 2]);
  });
  it('place les artistes sans contrat en dernier pour le tri par échéance', () => {
    const l = [a(1, 'x'), a(2, 'y', { contrat: { echeance: 10, royaltiesBps: 4000 } })];
    expect(trier(l, 'echeance', false).map((x) => x.id)).toEqual([2, 1]);
  });
  it('filtre par genre, phase et recherche partielle', () => {
    expect(filtrer(liste, { ...SANS_FILTRE, genre: 'afro' }).map((x) => x.id)).toEqual([2]);
    expect(filtrer(liste, { ...SANS_FILTRE, recherche: 'ZE' }).map((x) => x.id)).toEqual([1]);
    expect(filtrer(liste, { ...SANS_FILTRE, phase: 'pic' })).toEqual([]);
    expect(filtrer(liste, SANS_FILTRE)).toHaveLength(3);
  });
  it('signale fatigue, moral bas et contrat proche', () => {
    expect(alertesArtiste(a(1, 'x'), 0)).toEqual([]);
    expect(
      alertesArtiste(
        a(1, 'x', { fatigue: 80, moral: 20, contrat: { echeance: 5, royaltiesBps: 1 } }),
        0,
      ),
    ).toHaveLength(3);
  });
});

describe('écran Roster', () => {
  it('explique comment remplir un roster vide', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Roster/ }));
    expect(screen.getByText(/Ton roster est vide/)).toBeTruthy();
  });
});
