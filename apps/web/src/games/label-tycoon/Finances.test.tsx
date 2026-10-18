// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { remboursementSemaine, totalLignes } from './Finances';
import { LabelProvider } from './LabelContext';

afterEach(cleanup);

describe('aides des finances', () => {
  it('additionne les lignes du compte', () => {
    expect(
      totalLignes([
        { cle: 'a', nom: 'A', montant: 100 },
        { cle: 'b', nom: 'B', montant: 250 },
      ]),
    ).toBe(350);
  });
  it('répartit le restant dû sur les semaines restantes', () => {
    expect(
      remboursementSemaine({
        id: 1,
        capital: 1000,
        restant: 1000,
        tauxBps: 0,
        semainesRestantes: 3,
      }),
    ).toBe(334);
  });
});

describe('écran Finances', () => {
  it('affiche les comptes et permet de changer de stratégie fiscale', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Finances/ }));
    await screen.findByRole('heading', { name: 'Finances' });
    expect(screen.getByText('Les prêts s’ouvrent au palier Indépendant.')).toBeTruthy();
    const optimisee = screen.getByRole('radio', { name: /Optimisée/ }) as HTMLInputElement;
    expect(optimisee.checked).toBe(false);
    fireEvent.click(optimisee);
    await waitFor(() =>
      expect((screen.getByRole('radio', { name: /Optimisée/ }) as HTMLInputElement).checked).toBe(
        true,
      ),
    );
  });
});
