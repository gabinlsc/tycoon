// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { saisonDuMois, toursRivales } from './Monde';

afterEach(cleanup);

describe('monde du label', () => {
  it('change de saison au fil de l’année', () => {
    expect(saisonDuMois(1)).toBe('hiver');
    expect(saisonDuMois(4)).toBe('printemps');
    expect(saisonDuMois(7)).toBe('ete');
    expect(saisonDuMois(10)).toBe('automne');
    expect(saisonDuMois(12)).toBe('hiver');
  });

  it('dresse les tours rivales par valorisation', () => {
    const tours = toursRivales([
      { id: 1, nom: 'Petit', valorisation: 10 },
      { id: 2, nom: 'Géant', valorisation: 100 },
    ] as never);
    expect(tours.map((t) => t.nom)).toEqual(['Géant', 'Petit']);
    expect(tours[0]?.hauteur).toBeGreaterThan(tours[1]?.hauteur ?? 0);
  });

  it('ouvre un étage dans un tiroir sans quitter la scène, et se referme', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    const scene = await screen.findByRole('region', { name: 'Le monde du label' });
    fireEvent.click(within(scene).getByRole('button', { name: /^Studio/ }));
    const tiroir = await screen.findByRole('complementary', { name: 'Détail : Studio' });
    expect(within(tiroir).getByRole('heading', { name: 'Studio' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Le monde du label' })).toBeTruthy();
    fireEvent.click(within(tiroir).getByRole('button', { name: 'Fermer le panneau' }));
    expect(screen.queryByRole('complementary', { name: 'Détail : Studio' })).toBeNull();
  });
});
