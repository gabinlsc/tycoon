// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { allerAEcran } from './testNavigation';
import { parNiveau, progressionNiveau } from './Personnel';

afterEach(cleanup);

describe('aides du personnel', () => {
  it('borne la progression entre 0 et 100', () => {
    expect(progressionNiveau(50, 200)).toBe(25);
    expect(progressionNiveau(500, 200)).toBe(100);
    expect(progressionNiveau(-5, 200)).toBe(0);
  });
  it('trie par niveau décroissant puis par nom', () => {
    expect(
      parNiveau([
        { niveau: 10, nom: 'Zed' },
        { niveau: 10, nom: 'Abel' },
        { niveau: 40, nom: 'Top' },
      ]).map((x) => x.nom),
    ).toEqual(['Top', 'Abel', 'Zed']);
  });
});

describe('écran Personnel', () => {
  it('embauche un candidat, puis le licencie', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await allerAEcran(/Personnel/);
    await screen.findByRole('heading', { name: 'Personnel' });
    expect(screen.getByText('Aucun candidat pour l’instant.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Semaine/ }));
    const embaucher = await screen.findAllByRole(
      'button',
      { name: /^Embaucher / },
      { timeout: 5000 },
    );
    // Un directeur financier exige un palier que le label de départ n'a pas.
    const possible = embaucher.find(
      (bouton) => !bouton.closest('li')?.textContent?.includes('Directeur financier'),
    );
    fireEvent.click(possible as HTMLElement);
    const licencier = await screen.findByRole('button', { name: /^Licencier / });
    fireEvent.click(licencier);
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Licencier / })).toBeNull());
  });
});
