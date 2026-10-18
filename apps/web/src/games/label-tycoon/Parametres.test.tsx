// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { RACCOURCIS } from './Parametres';
import { CLE_REGLAGES } from './temps';

afterEach(() => {
  cleanup();
  window.localStorage.removeItem(CLE_REGLAGES);
});

describe('raccourcis', () => {
  it('numérote les neuf premiers écrans et garde les touches du temps', () => {
    expect(RACCOURCIS.map((r) => r.touche).slice(0, 3)).toEqual(['Espace', 'N', '1']);
    expect(RACCOURCIS).toHaveLength(11);
  });
});

describe('écran Paramètres', () => {
  it('mémorise une auto-pause désactivée et la rétablit', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Paramètres/ }));
    await screen.findByRole('heading', { name: 'Paramètres' });
    const cases = screen.getAllByRole('checkbox', { name: 'Décision à prendre' });
    const premiere = cases[cases.length - 1] as HTMLInputElement;
    expect(premiere.checked).toBe(true);
    fireEvent.click(premiere);
    await waitFor(() => expect(premiere.checked).toBe(false));
    expect(window.localStorage.getItem(CLE_REGLAGES)).toContain('"decision":false');
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir les réglages par défaut' }));
    await waitFor(() => expect(premiere.checked).toBe(true));
  });
});
