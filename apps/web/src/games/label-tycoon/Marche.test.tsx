// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueGenre, VuePrevision } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { fourchettePrevision, parPopularite, texteVariation } from './Marche';

afterEach(cleanup);

const g = (id: string, nom: string, popularite: number): VueGenre => ({
  id,
  nom,
  popularite,
  tendance: 1,
  audience: 1,
  credibilite: 0,
  sousGenre: null,
});

describe('aides du marché', () => {
  it('trie par popularité décroissante puis par nom', () => {
    expect(
      parPopularite([g('a', 'Zed', 50), g('b', 'Abel', 50), g('c', 'Top', 90)]).map((x) => x.id),
    ).toEqual(['c', 'b', 'a']);
  });
  it('borne la fourchette d’une prévision à 0-100', () => {
    const p = (valeur: number, marge: number): VuePrevision => ({
      genre: 'rap',
      nom: 'Rap',
      faiteLe: 0,
      pour: 10,
      valeur,
      marge,
    });
    expect(fourchettePrevision(p(50, 10))).toEqual([40, 60]);
    expect(fourchettePrevision(p(5, 20))).toEqual([0, 25]);
    expect(fourchettePrevision(p(95, 20))).toEqual([75, 100]);
  });
});

describe('variation d’ère', () => {
  it('écrit les variations avec leur signe', () => {
    expect(texteVariation(35)).toBe('+35 %');
    expect(texteVariation(-18)).toBe('−18 %');
    expect(texteVariation(0)).toBe('inchangé');
  });
});

describe('écran Marché', () => {
  it('liste les genres, commande une étude et affiche la prévision', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Marché/ }));
    await screen.findByRole('heading', { name: 'Marché' });
    expect(screen.getByRole('heading', { name: 'Ère du streaming' })).toBeTruthy();
    // Une partie démarre hors saison : rien n’est annoncé.
    expect(screen.queryByRole('heading', { name: 'Saisons en cours' })).toBeNull();
    expect(document.querySelectorAll('.label-table tbody tr').length).toBeGreaterThanOrEqual(10);
    expect(screen.getByText('Aucune étude pour l’instant.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Commander une étude/ }));
    await waitFor(() => expect(screen.getByText(/étude de la semaine 0/)).toBeTruthy());
  });
});
