// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountProvider, useAccount } from '../../accounts/AccountContext';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { DELAI_SAUVEGARDE_MS, Persistance } from './Persistance';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function Compte() {
  const { createAccount, status } = useAccount();
  return (
    <button type="button" onClick={() => void createAccount('Testeur')} disabled={status === 'in'}>
      creer
    </button>
  );
}

function Jeu() {
  return (
    <MemoryRouter>
      <AccountProvider>
        <Compte />
        <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
          <Persistance />
          <Coquille />
        </LabelProvider>
      </AccountProvider>
    </MemoryRouter>
  );
}

const attendre = (ms: number) =>
  act(async () => void (await new Promise((r) => setTimeout(r, ms))));

async function demarrer() {
  const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(b);
  await screen.findByRole('navigation', { name: 'Écrans du jeu' });
}

describe('sauvegarde de la partie', () => {
  it('prévient quand il n’y a pas de compte', async () => {
    render(<Jeu />);
    expect(await screen.findByText(/pour que ta partie soit sauvegardée/)).toBeTruthy();
    await demarrer();
    expect(screen.getByText(/ne sera pas sauvegardée/)).toBeTruthy();
  });

  it('enregistre la partie du compte, puis la propose à la reprise', async () => {
    const premier = render(<Jeu />);
    fireEvent.click(await screen.findByText('creer'));
    await waitFor(() =>
      expect((screen.getByText('creer') as HTMLButtonElement).disabled).toBe(true),
    );
    await demarrer();
    await attendre(DELAI_SAUVEGARDE_MS + 300);
    await screen.findByText(/Partie sauvegardée \(semaine 0\)/);
    const cles = Object.keys(window.localStorage).filter((k) => k.includes('label-tycoon'));
    expect(cles.length).toBeGreaterThan(0);
    premier.unmount();

    render(<Jeu />);
    const reprendre = await screen.findByRole(
      'button',
      { name: 'Reprendre ma partie' },
      { timeout: 3000 },
    );
    fireEvent.click(reprendre);
    await screen.findByRole('navigation', { name: 'Écrans du jeu' });
    expect(screen.getByLabelText('Trésorerie')).toBeTruthy();
  });

  it('demande confirmation avant de recommencer', async () => {
    render(<Jeu />);
    fireEvent.click(await screen.findByText('creer'));
    await waitFor(() =>
      expect((screen.getByText('creer') as HTMLButtonElement).disabled).toBe(true),
    );
    await demarrer();
    await attendre(DELAI_SAUVEGARDE_MS + 300);
    fireEvent.click(await screen.findByRole('button', { name: 'Recommencer' }));
    expect(screen.getByRole('button', { name: 'Oui, tout recommencer' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Recommencer' })).toBeTruthy();
  });
});
