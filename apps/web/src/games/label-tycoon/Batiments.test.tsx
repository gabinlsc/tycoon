// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueBatiment } from '@tycoon/label-tycoon';
import { raisonBlocage } from './Batiments';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';

afterEach(cleanup);

const base: VueBatiment = {
  id: 'studio',
  nom: 'Studio',
  effet: '',
  niveau: 1,
  niveauMax: 3,
  coutSuivant: 1000,
  semainesTravaux: 4,
  entretien: 0,
  palierRequis: 'Home studio',
  palierAtteint: true,
  travaux: null,
};

describe('raison de blocage', () => {
  it('autorise la construction quand tout est réuni', () => {
    expect(raisonBlocage(base, 5000)).toBeNull();
  });
  it('explique chaque blocage', () => {
    expect(raisonBlocage({ ...base, travaux: { niveau: 2, fin: 9 } }, 5000)).toMatch(/semaine 9/);
    expect(raisonBlocage({ ...base, coutSuivant: null }, 5000)).toMatch(/maximal/);
    expect(raisonBlocage({ ...base, palierAtteint: false }, 5000)).toMatch(/Palier/);
    expect(raisonBlocage(base, 10)).toMatch(/insuffisante/);
  });
});

describe('écran Bâtiments', () => {
  it('liste les cinq bâtiments', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Bâtiments/ }));
    await screen.findByRole('heading', { name: 'Bâtiments' });
    expect(document.querySelectorAll('article.label-card').length).toBe(5);
  });
});
