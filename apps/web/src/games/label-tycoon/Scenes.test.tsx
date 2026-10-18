// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { libelleChaleur } from './Scenes';

afterEach(cleanup);

describe('écran Scènes', () => {
  it('dit la chaleur en toutes lettres', () => {
    expect(libelleChaleur({ chaleur: 90, emergente: true })).toBe('émergente');
    expect(libelleChaleur({ chaleur: 80, emergente: false })).toBe('brûlante');
    expect(libelleChaleur({ chaleur: 50, emergente: false })).toBe('active');
    expect(libelleChaleur({ chaleur: 10, emergente: false })).toBe('calme');
  });

  it('liste les villes et permet de repérer sur place', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    const nav = await screen.findByRole('navigation', { name: 'Écrans du jeu' });
    fireEvent.click(within(nav).getByRole('button', { name: /Scènes/ }));
    const boutons = await screen.findAllByRole('button', { name: /^Repérer à / });
    expect(boutons.length).toBeGreaterThan(3);
    fireEvent.click(boutons[0] as HTMLElement);
    await waitFor(() => expect(screen.queryByText(/Fonds insuffisants/)).toBeNull());
  });
});
