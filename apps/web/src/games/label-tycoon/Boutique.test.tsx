// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { reinitialiserAchats } from '../../lib/boutique';
import { choisirOffre, useAbonnement } from '../../lib/pass';
import { appliquer, reinitialiserRecompenses } from '../../lib/recompenses';
import { Boutique } from './Boutique';

function Theme() {
  return <p data-testid="theme">{useAbonnement().theme}</p>;
}

afterEach(() => {
  cleanup();
  reinitialiserRecompenses();
  reinitialiserAchats();
  choisirOffre('gratuit');
});

describe('Boutique du jeu', () => {
  it('bloque l’achat sans assez de pièces', () => {
    render(<Boutique />);
    const bouton = screen.getByRole('button', { name: /Acheter Ciel Aube/ }) as HTMLButtonElement;
    expect(bouton.disabled).toBe(true);
  });

  it('achète puis équipe un thème avec les pièces du portefeuille', () => {
    appliquer((e) => ({ ...e, pieces: 250 }));
    render(
      <>
        <Boutique />
        <Theme />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: /Acheter Ciel Aube/ }));
    expect(screen.getByTestId('theme').textContent).toBe('aube');
    expect(screen.getByRole('button', { name: /Équipé/ })).toBeTruthy();
    expect(screen.getByText('50', { selector: 'strong' })).toBeTruthy();
  });
});
