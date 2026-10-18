// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DIFFICULTY_PRESETS } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { BAC_A_SABLE_PAR_DEFAUT, configDepart, presetCorrespondant } from './NouvellePartie';
import { configDepuisPartie } from './partie';

afterEach(cleanup);

describe('aides de la nouvelle partie', () => {
  it('reconnaît un préréglage exact et une personnalisation', () => {
    expect(presetCorrespondant({ ...DIFFICULTY_PRESETS.difficile })).toBe('difficile');
    expect(presetCorrespondant({ ...DIFFICULTY_PRESETS.normal, startingCash: 1.5 })).toBeNull();
  });
  it('compose les réglages du bac à sable', () => {
    const d = { ...DIFFICULTY_PRESETS.normal };
    expect(configDepart('carriere', d, BAC_A_SABLE_PAR_DEFAUT).sandbox).toBeUndefined();
    expect(configDepart('bac-a-sable', d, BAC_A_SABLE_PAR_DEFAUT)).toMatchObject({
      mode: 'bac-a-sable',
      sandbox: true,
      bankruptcyOff: true,
    });
    expect(
      configDepart('bac-a-sable', d, { argentIllimite: false, faillite: false, frequence: 2 }),
    ).toEqual({ mode: 'bac-a-sable', difficulty: d, eventRate: 2 });
  });
  it('reconstruit les réglages d’une partie en cours', () => {
    const config = configDepuisPartie({
      mode: 'bac-a-sable',
      scenarioId: null,
      bacASable: true,
      faillitePossible: false,
      frequenceEvenements: 1,
      difficulte: {
        capitalDepart: 2,
        agressiviteRivaux: 0.7,
        volatiliteMarche: 0.8,
        bonusTresorerieRivaux: 0,
      },
    });
    expect(config).toEqual({
      mode: 'bac-a-sable',
      difficulty: { ...DIFFICULTY_PRESETS.facile },
      sandbox: true,
    });
  });
});

async function ouvrir() {
  render(
    <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
      <Coquille />
    </LabelProvider>,
  );
  const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  return b;
}

describe('écran de départ', () => {
  it('lance une carrière difficile avec ses réglages, visibles dans les paramètres', async () => {
    const b = await ouvrir();
    fireEvent.click(screen.getByRole('radio', { name: /Difficile/ }));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Paramètres/ }));
    await screen.findByRole('heading', { name: 'Ta partie' });
    expect(screen.getByText(/Mode :/).textContent).toContain('Carrière');
    expect(screen.getByText(/Bonus de trésorerie des rivaux/).textContent).toContain('25');
  });
  it('lance un bac à sable : vitesses ×8 et ×16, faillite désactivée', async () => {
    const b = await ouvrir();
    expect(screen.queryByRole('button', { name: '×16' })).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Bac à sable/ }));
    fireEvent.click(b);
    expect(await screen.findByRole('button', { name: '×16' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '×8' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Paramètres/ }));
    await screen.findByRole('heading', { name: 'Ta partie' });
    expect(screen.getByText(/Mode :/).textContent).toContain('Bac à sable');
    expect(screen.getByText(/Faillite :/).textContent).toContain('désactivée');
  });
  it('bloque le lancement quand un réglage sort des bornes', async () => {
    const b = await ouvrir();
    fireEvent.click(screen.getByText('Réglages avancés'));
    fireEvent.change(screen.getByLabelText(/Budget de départ/), { target: { value: '50' } });
    expect((b as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toMatch(/hors bornes/);
  });
});

describe('mode scénario', () => {
  it('compose les réglages d’un scénario', () => {
    expect(
      configDepart(
        'scenario',
        { ...DIFFICULTY_PRESETS.normal },
        BAC_A_SABLE_PAR_DEFAUT,
        'numero-un',
      ),
    ).toMatchObject({
      mode: 'scenario',
      scenarioId: 'numero-un',
    });
  });
  it('lance un scénario : bandeau d’objectifs, temps restant, monde imposé', async () => {
    const b = await ouvrir();
    fireEvent.click(screen.getByRole('radio', { name: /Scénarios/ }));
    expect(screen.queryByText('Graine (facultatif)')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Numéro un en un an/ }));
    fireEvent.click(b);
    const bandeau = await screen.findByLabelText('Scénario : Numéro un en un an');
    expect(bandeau.textContent).toContain('Temps restant : 1 an');
    expect(bandeau.textContent).toContain('Placer une sortie en tête du classement');
  });
});
