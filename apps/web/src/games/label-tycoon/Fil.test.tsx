// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueActu } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { categorieDe, filtrer } from './Fil';
import { LabelProvider } from './LabelContext';
import { allerAEcran } from './testNavigation';

afterEach(cleanup);

const actu = (id: number, kind: string, importance: 1 | 2 | 3): VueActu => ({
  id,
  semaine: id,
  titre: `T${id}`,
  texte: '',
  importance,
  kind,
});

describe('filtres du Fil', () => {
  const liste = [actu(1, 'sortie', 2), actu(2, 'clash', 3), actu(3, 'sous-genre-ne', 1)];
  it('classe les types connus et met le reste dans « Mon label »', () => {
    expect(categorieDe(actu(0, 'debauchage', 1))).toBe('rivaux');
    expect(categorieDe(actu(0, 'inconnu', 1))).toBe('label');
  });
  it('filtre par catégorie et importance', () => {
    expect(filtrer(liste, 'tout', 1)).toHaveLength(3);
    expect(filtrer(liste, 'rivaux', 1).map((a) => a.id)).toEqual([2]);
    expect(filtrer(liste, 'tout', 2).map((a) => a.id)).toEqual([1, 2]);
    expect(filtrer(liste, 'marche', 2)).toEqual([]);
  });
});

describe('écran Fil', () => {
  it('annonce un Fil vide au départ', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await allerAEcran(/Le Fil/);
    await screen.findByRole('heading', { name: 'Le Fil' });
    expect(screen.getByText(/Le Fil se remplira/)).toBeTruthy();
  });
});
