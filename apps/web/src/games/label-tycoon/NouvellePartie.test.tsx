// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DIFFICULTY_PRESETS } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { presetCorrespondant } from './NouvellePartie';
import { configDepuisPartie } from './partie';

afterEach(cleanup);

describe('aides de la nouvelle partie', () => {
  it('reconnaît un préréglage exact et une personnalisation', () => {
    expect(presetCorrespondant({ ...DIFFICULTY_PRESETS.difficile })).toBe('difficile');
    expect(presetCorrespondant({ ...DIFFICULTY_PRESETS.normal, startingCash: 1.5 })).toBeNull();
  });
  it('reconstruit les réglages d’une partie en cours', () => {
    const config = configDepuisPartie({
      mode: 'bac-a-sable',
      scenarioId: null,
      bacASable: true,
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
  it('bloque le lancement quand un réglage sort des bornes', async () => {
    const b = await ouvrir();
    fireEvent.click(screen.getByText('Réglages avancés'));
    fireEvent.change(screen.getByLabelText(/Budget de départ/), { target: { value: '50' } });
    expect((b as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole('alert').textContent).toMatch(/hors bornes/);
  });
});
