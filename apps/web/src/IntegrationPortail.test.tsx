// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AccountProvider } from './accounts/AccountContext';
import { App } from './App';
import { GameCard } from './components/arcade/GameCard';
import { findGame } from './data/games';

// jsdom n'a pas matchMedia : on simule un navigateur sans préférences particulières.
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
});

afterEach(cleanup);

const label = findGame('label-tycoon');

describe('Label Tycoon dans le portail', () => {
  it('apparaît « Disponible » sur sa carte, avec un bouton Jouer vers sa page', () => {
    if (!label) throw new Error('Label Tycoon attendu dans le catalogue');
    render(
      <MemoryRouter>
        <GameCard game={label} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Disponible')).toBeTruthy();
    const lien = screen.getByRole('link', { name: 'Jouer' });
    expect(lien.getAttribute('href')).toBe('/jeux/label-tycoon');
  });

  it('s’ouvre aussi par /label, qui renvoie vers sa page', async () => {
    render(
      <MemoryRouter initialEntries={['/label']}>
        <AccountProvider>
          <App />
        </AccountProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Label Tycoon' })).toBeTruthy();
    expect(await screen.findByRole('region', { name: 'Jouer à Label Tycoon' })).toBeTruthy();
  });

  it('la page d’accueil propose de jouer au jeu mis en avant', () => {
    render(
      <MemoryRouter>
        <AccountProvider>
          <App />
        </AccountProvider>
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('link', { name: 'Jouer' }).length).toBeGreaterThan(0);
  });
});
