// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { ECRANS, ecranDeTouche } from './ecrans';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';

afterEach(cleanup);

const fabrique = () => Promise.resolve(creerMoteurLocal());

async function lancer() {
  render(
    <LabelProvider fabrique={fabrique}>
      <Coquille />
    </LabelProvider>,
  );
  const bouton = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((bouton as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(bouton);
  await screen.findByRole('navigation', { name: 'Écrans du jeu' });
}

describe('coquille du jeu', () => {
  it('propose de fonder un label, puis affiche le bandeau et la navigation', async () => {
    await lancer();
    expect(screen.getByLabelText('Trésorerie').textContent).toMatch(/€/);
    expect(screen.getByText('Home-studio')).toBeTruthy();
    for (const e of ECRANS)
      expect(screen.getByRole('button', { name: new RegExp(e.titre) })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'QG' })).toBeTruthy();
  });

  it('change d’écran au clic', async () => {
    await lancer();
    fireEvent.click(screen.getByRole('button', { name: /Roster/ }));
    expect(screen.getByRole('heading', { name: 'Roster' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Roster/ }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('change d’écran avec les raccourcis chiffrés, sauf dans un champ de saisie', async () => {
    await lancer();
    fireEvent.keyDown(window, { key: '3' });
    expect(screen.getByRole('heading', { name: 'Repérage' })).toBeTruthy();
    const input = document.createElement('input');
    document.body.append(input);
    fireEvent.keyDown(input, { key: '1' });
    expect(screen.getByRole('heading', { name: 'Repérage' })).toBeTruthy();
    input.remove();
    fireEvent.keyDown(window, { key: '9' });
    expect(screen.getByRole('heading', { name: 'Repérage' })).toBeTruthy();
  });
});

describe('raccourcis', () => {
  it('associe les chiffres aux écrans dans l’ordre', () => {
    expect(ecranDeTouche('1')).toBe('qg');
    expect(ecranDeTouche('2')).toBe('roster');
    expect(ecranDeTouche('0')).toBeNull();
    expect(ecranDeTouche('x')).toBeNull();
    expect(ecranDeTouche('9')).toBeNull();
  });
});
