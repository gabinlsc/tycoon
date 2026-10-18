// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueRapportMensuel } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { eurSigne, resume } from './RapportMensuel';

afterEach(cleanup);

const rapport: VueRapportMensuel = {
  semaine: 7,
  net: -250_000,
  revenus: 100_000,
  depenses: 350_000,
  tresorerie: 5_000_000,
  variation: -250_000,
  premierRevenu: 'Streaming',
  reussites: [],
  echecs: [],
};

describe('aides du rapport', () => {
  it('signe les montants', () => {
    expect(eurSigne(12_300)).toBe('+123 €');
    expect(eurSigne(-12_300)).toBe('−123 €');
    expect(eurSigne(0)).toBe('0 €');
  });
  it('résume un mois en perte', () => {
    expect(resume(rapport).replace(/\s/g, ' ')).toBe(
      'Mois clos à la semaine 7 : perte de 2 500 €, porté par : streaming.',
    );
  });
});

describe('écran Rapport mensuel', () => {
  it('attend la fin du premier mois, puis affiche le rapport', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Rapport mensuel/ }));
    await screen.findByRole('heading', { name: 'Rapport mensuel' });
    expect(screen.getByText(/Le premier rapport arrive/)).toBeTruthy();
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Semaine ▶/ }));
        await new Promise((r) => setTimeout(r, 150));
      });
    }
    await waitFor(() => expect(screen.getByText('Dernier rapport')).toBeTruthy(), {
      timeout: 5000,
    });
  }, 20_000);
});
