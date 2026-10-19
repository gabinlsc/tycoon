// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

async function lancerTutoriel() {
  render(
    <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
      <Coquille />
    </LabelProvider>,
  );
  const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(screen.getByRole('radio', { name: /Tutoriel/ }));
  expect(screen.queryByText('Graine (facultatif)')).toBeNull();
  fireEvent.click(b);
  return screen.findByLabelText('Tutoriel');
}

describe('tutoriel guidé', () => {
  it('guide pas à pas : lecture, puis action dans le jeu', async () => {
    const panneau = await lancerTutoriel();
    expect(panneau.textContent).toContain('étape 1 sur 7');
    expect(panneau.textContent).toContain('Bienvenue dans ton label');
    fireEvent.click(screen.getByRole('button', { name: 'Compris' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Tutoriel').textContent).toContain('étape 2 sur 7'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Aller à l’écran Repérage' }));
    await screen.findByRole('heading', { name: 'Repérage' });
    fireEvent.click(
      (await screen.findAllByRole('button', { name: 'Lancer une session' }))[0] as HTMLElement,
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Tutoriel').textContent).toContain('étape 3 sur 7'),
    );
    expect(screen.getByLabelText('Tutoriel').textContent).toContain('Laisse le temps passer');
  });

  it('se passe en un clic et laisse la partie continuer', async () => {
    await lancerTutoriel();
    fireEvent.click(screen.getByRole('button', { name: 'Passer le tutoriel' }));
    await waitFor(() => expect(screen.queryByLabelText('Tutoriel')).toBeNull());
    expect(screen.getByLabelText('Trésorerie')).toBeTruthy();
  });

  it('ne s’affiche pas dans les autres modes', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await screen.findByRole('navigation', { name: 'Écrans du jeu' });
    expect(screen.queryByLabelText('Tutoriel')).toBeNull();
  });
});

describe('coach du tutoriel', () => {
  it('se réduit en pastille et se rouvre', async () => {
    await lancerTutoriel();
    fireEvent.click(screen.getByRole('button', { name: 'Réduire le tutoriel' }));
    expect(screen.queryByLabelText('Tutoriel')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Rouvrir le tutoriel · 1\/7/ }));
    expect(screen.getByLabelText('Tutoriel')).toBeTruthy();
  });

  it('fait clignoter l’écran à atteindre, et ne propose pas d’aller là où l’on est', async () => {
    await lancerTutoriel();
    expect(screen.queryByRole('button', { name: 'Aller à l’écran QG' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Compris' }));
    await waitFor(() =>
      expect(
        document.querySelector('[data-ecran="reperage"]')?.classList.contains('lt-cible'),
      ).toBe(true),
    );
  });
});
