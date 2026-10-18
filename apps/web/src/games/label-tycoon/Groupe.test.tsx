// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CommandeJeu, ReponseJeu } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { texteNiveau, netRecent } from './Groupe';
import { LabelProvider, useLabel } from './LabelContext';

afterEach(cleanup);

describe('aides du groupe', () => {
  it('écrit une fourchette ou un niveau exact', () => {
    expect(texteNiveau([55, 75])).toBe('55 à 75');
    expect(texteNiveau([60, 60])).toBe('60');
  });
  it('additionne le net des dernières semaines', () => {
    expect(netRecent([100, -30, 5])).toBe(75);
    expect(netRecent([])).toBe(0);
  });
});

let envoyer: ((c: CommandeJeu) => Promise<ReponseJeu>) | null = null;
function Sonde() {
  envoyer = useLabel().envoyer;
  return null;
}

async function demarrer() {
  render(
    <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
      <Sonde />
      <Coquille />
    </LabelProvider>,
  );
  const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(b);
  await screen.findByRole('navigation', { name: 'Écrans du jeu' });
}

describe('écran Groupe', () => {
  it('reste fermé avant le palier Groupe', async () => {
    await demarrer();
    fireEvent.click(screen.getByRole('button', { name: /Groupe/ }));
    await screen.findByRole('heading', { name: 'Groupe' });
    expect(screen.getByText(/s’ouvrent au palier Groupe/)).toBeTruthy();
  });

  it('crée un sous-label, nomme un cadre et règle l’enveloppe', async () => {
    await demarrer();
    await act(async () => {
      const r = await envoyer?.({ type: 'sauvegarder' });
      if (r?.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
      const partie = JSON.parse(r.sauvegarde) as {
        engine: { data: { label: { tier: string; tresorerie: number } } };
      };
      partie.engine.data.label.tier = 'groupe';
      partie.engine.data.label.tresorerie = 50_000_000_000;
      await envoyer?.({ type: 'charger', sauvegarde: JSON.stringify(partie) });
      await envoyer?.({ type: 'avancer', semaines: 1, arretSurSignal: false });
    });
    fireEvent.click(
      within(screen.getByRole('navigation', { name: 'Écrans du jeu' })).getByRole('button', {
        name: /Groupe/,
      }),
    );
    await screen.findByText(/Tu diriges 0 sous-label/);
    fireEvent.change(screen.getByLabelText('Nom du sous-label'), { target: { value: 'Rap Nord' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer le sous-label' }));
    await screen.findByRole('article', { name: 'Rap Nord' });
    fireEvent.click(screen.getByRole('button', { name: 'Nommer le cadre de Rap Nord' }));
    await waitFor(() => expect(screen.getByText(/Dirigé par/)).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Enveloppe hebdomadaire de Rap Nord (€)'), {
      target: { value: '100000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Régler l’enveloppe de Rap Nord' }));
    await waitFor(() =>
      expect(screen.getByLabelText('Enveloppe hebdomadaire de Rap Nord (€)')).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Fermer Rap Nord' }));
    await waitFor(() => expect(screen.queryByRole('article', { name: 'Rap Nord' })).toBeNull());
  });
});
