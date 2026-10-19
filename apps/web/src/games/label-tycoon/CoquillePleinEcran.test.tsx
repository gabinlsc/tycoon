// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { eurCourt } from './Hud';
import { LabelProvider } from './LabelContext';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function demarrer() {
  render(
    <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
      <Coquille sauvegardes={<p>Panneau des sauvegardes</p>} />
    </LabelProvider>,
  );
  const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(b);
  return screen.findByRole('navigation', { name: 'Écrans du jeu' });
}

describe('coquille plein écran', () => {
  it('recouvre la page, bloque son défilement, et se met de côté puis se reprend', async () => {
    await demarrer();
    expect(document.querySelector('body > .lt-app')).not.toBeNull();
    expect(document.documentElement.classList.contains('lt-verrou')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Quitter le jeu/ }));
    expect(document.querySelector('.lt-app')).toBeNull();
    expect(document.documentElement.classList.contains('lt-verrou')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la partie' }));
    expect(await screen.findByRole('navigation', { name: 'Écrans du jeu' })).toBeTruthy();
  });

  it('range les écrans en pôles et signale ceux qui attendent un palier', async () => {
    const nav = await demarrer();
    for (const titre of [
      'QG',
      'Artistes',
      'Production',
      'Boîte',
      'Marché',
      'Gestion',
      'Empire',
      'Suivi',
    ])
      expect(within(nav).getByRole('button', { name: new RegExp(`^${titre}`) })).toBeTruthy();
    expect(within(nav).getByRole('button', { name: /^Empire/ }).textContent).toContain(
      'verrouillé',
    );
    expect(within(nav).getByRole('button', { name: /^Artistes/ }).textContent).not.toContain(
      'verrouillé',
    );
  });

  it('ouvre les écrans d’un pôle en onglets, et revient au dernier onglet visité', async () => {
    const nav = await demarrer();
    fireEvent.click(within(nav).getByRole('button', { name: /^Marché/ }));
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Le Fil',
      'Classements',
      'Marché',
      'Concurrence',
    ]);
    fireEvent.click(screen.getByRole('tab', { name: /Classements/ }));
    fireEvent.click(within(nav).getByRole('button', { name: /^QG/ }));
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    fireEvent.click(within(nav).getByRole('button', { name: /^Marché/ }));
    expect(screen.getByRole('tab', { name: /Classements/ }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('ouvre les sauvegardes depuis la barre latérale', async () => {
    await demarrer();
    const panneau = screen.getByText('Panneau des sauvegardes').parentElement as HTMLElement;
    expect(panneau.hidden).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /Sauvegardes/ }));
    expect(panneau.hidden).toBe(false);
  });

  it('passe en barre d’onglets et tiroir sur petit écran', async () => {
    vi.stubGlobal(
      'matchMedia',
      (query: string) =>
        ({
          matches: true,
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    await demarrer();
    const onglets = screen.getByRole('navigation', { name: 'Accès rapide' });
    fireEvent.click(within(onglets).getByRole('button', { name: /Production/ }));
    expect(
      within(onglets)
        .getByRole('button', { name: /Production/ })
        .getAttribute('aria-current'),
    ).toBe('page');
    fireEvent.click(within(onglets).getByRole('button', { name: /Menu/ }));
    expect(document.querySelector('.lt-app.is-tiroir-ouvert')).not.toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer le menu' })[0] as HTMLElement);
    expect(document.querySelector('.lt-app.is-tiroir-ouvert')).toBeNull();
  });
});

describe('montants du HUD', () => {
  it('s’abrègent pour rester lisibles', () => {
    expect(eurCourt(98_000)).toBe('980 €');
    expect(eurCourt(3_400_000)).toBe('34 k€');
    expect(eurCourt(125_000_000)).toMatch(/^1,3 M€$/);
    expect(eurCourt(260_000_000_000)).toMatch(/^2,6 Md€$/);
    expect(eurCourt(-5_000_000)).toBe('-50 k€');
  });
});
