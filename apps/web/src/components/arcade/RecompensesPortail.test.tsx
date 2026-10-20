// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RecompensesPortail } from './RecompensesPortail';
import { reinitialiserRecompenses } from '../../lib/recompenses';

afterEach(() => {
  cleanup();
  reinitialiserRecompenses();
});

describe('Récompenses du portail', () => {
  it('verse le cadeau du jour une seule fois puis invite à revenir demain', () => {
    render(<RecompensesPortail />);
    fireEvent.click(screen.getByRole('button', { name: /Récupérer 10 pièces/ }));
    expect(
      (screen.getByRole('button', { name: 'Reviens demain' }) as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(screen.getAllByText('10', { selector: 'strong' }).length).toBeGreaterThan(0);
  });

  it('verse le bonus du mois une seule fois', () => {
    render(<RecompensesPortail />);
    fireEvent.click(screen.getByRole('button', { name: 'Récupérer' }));
    expect((screen.getByRole('button', { name: 'Déjà reçu' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
  });
});
