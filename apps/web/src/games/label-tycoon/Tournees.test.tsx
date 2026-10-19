// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueScene } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { allerAEcran } from './testNavigation';
import { previsionTournee } from './Tournees';

afterEach(cleanup);

const nova = { id: 1, nom: 'Nova', fans: 0, hype: 0, fatigue: 0, repos: 0 };
const scene: VueScene = {
  salles: [
    { id: 'club', nom: 'Club', capacite: 600, cout: 150_000, prixRef: 18, notorieteRef: 25 },
  ],
  artistes: [nova],
  niveauSalleMaison: 0,
  concerts: [],
  tournees: [],
  festivals: [],
  offresSynchro: [],
  tournee: { dates: { min: 3, max: 20 }, coutMerch: 800, prixMerch: 2500, tauxMerch: 0.15 },
};

describe('prévision de tournée', () => {
  it('additionne le coût des salles et du merch', () => {
    const p = previsionTournee(scene, nova, 'club', 18, 4, 100);
    expect(p.cout).toBe(150_000 * 4 + 800 * 100);
  });
  it('renvoie un bilan vide pour une salle inconnue', () => {
    expect(previsionTournee(scene, nova, 'nulle-part', 18, 4, 0)).toEqual({
      remplissage: 0,
      spectateurs: 0,
      billetterie: 0,
      cout: 0,
    });
  });
});

describe('écran Tournées', () => {
  it('invite à signer un artiste quand le roster est vide', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await allerAEcran(/Tournées/);
    await screen.findByRole('heading', { name: 'Tournées' });
    expect(screen.getByText('Signe un artiste pour organiser des concerts.')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Festivals' })).toBeTruthy();
  });
});
