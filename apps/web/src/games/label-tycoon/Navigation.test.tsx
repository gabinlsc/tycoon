// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('navigation sur petit écran', () => {
  it('ramène l’onglet actif dans la zone visible à chaque changement d’écran', async () => {
    const defiler = vi.fn();
    Element.prototype.scrollIntoView = defiler;
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Succès/ }));
    await screen.findByRole('heading', { name: 'Succès' });
    expect(defiler).toHaveBeenCalled();
    const actif = document.querySelector('.label-nav [aria-current="page"]');
    expect(actif?.textContent).toContain('Succès');
  });
});
