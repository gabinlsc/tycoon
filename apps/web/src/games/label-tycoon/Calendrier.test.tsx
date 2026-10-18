// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueSortieCalendrier } from '@tycoon/label-tycoon';
import { Calendrier, HORIZON, collisions, parSemaine } from './Calendrier';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';

afterEach(cleanup);

const s = (over: Partial<VueSortieCalendrier>): VueSortieCalendrier => ({
  origine: 'joueur',
  nom: 'Zed',
  genre: 'rap',
  genreNom: 'Rap',
  semaine: 5,
  poids: 0,
  statut: 'production',
  ...over,
});

describe('collisions', () => {
  it('ne retient que les grosses sorties rivales du même genre la même semaine', () => {
    const l = [
      s({}),
      s({ origine: 'rival', nom: 'Atlas', poids: 8, statut: 'annoncee' }),
      s({ origine: 'rival', nom: 'Petit', poids: 1, statut: 'annoncee' }),
      s({ origine: 'rival', nom: 'Autre genre', genre: 'afro', poids: 8 }),
      s({ origine: 'rival', nom: 'Autre semaine', semaine: 6, poids: 8 }),
    ];
    expect(collisions(l).map((c) => c.rival)).toEqual(['Atlas']);
    expect(collisions([])).toEqual([]);
  });
});

describe('regroupement par semaine', () => {
  it('couvre tout l’horizon et range chaque sortie à sa semaine', () => {
    const m = parSemaine([s({ semaine: 7 }), s({ semaine: 7, nom: 'B' }), s({ semaine: 99 })], 3);
    expect([...m.keys()]).toHaveLength(HORIZON);
    expect(m.get(7)).toHaveLength(2);
    expect([...m.values()].flat()).toHaveLength(2);
  });
});

describe('écran Calendrier', () => {
  it('s’ouvre depuis la navigation et annonce l’absence de sortie', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
        <Calendrier />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Calendrier/ }));
    expect(
      screen.getAllByRole('heading', { name: 'Calendrier des sorties' }).length,
    ).toBeGreaterThan(0);
    expect(document.querySelectorAll('.label-calendar__week')).toHaveLength(HORIZON * 2);
  });
});
