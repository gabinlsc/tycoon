// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueRival } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { parValorisation } from './Concurrence';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { allerAEcran } from './testNavigation';

afterEach(cleanup);

const rival = (id: number, nom: string, valorisation: number): VueRival => ({
  id,
  nom,
  personnalite: 'Agressif',
  genreFetiche: 'Rap',
  reputation: 10,
  tresorerie: 0,
  valorisation,
  roster: [],
});

describe('aides de la concurrence', () => {
  it('trie les rivaux par valorisation décroissante puis par nom', () => {
    expect(
      parValorisation([rival(1, 'Zed', 5), rival(2, 'Abel', 5), rival(3, 'Top', 9)]).map(
        (r) => r.id,
      ),
    ).toEqual([3, 2, 1]);
  });
});

describe('écran Concurrence', () => {
  it('liste les labels rivaux et leurs parts de marché', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await allerAEcran(/Concurrence/);
    await screen.findByRole('heading', { name: 'Concurrence' });
    expect(document.querySelectorAll('.lt-rival').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('heading', { name: 'Parts de marché par genre' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Affrontements récents' })).toBeTruthy();
  });
});
