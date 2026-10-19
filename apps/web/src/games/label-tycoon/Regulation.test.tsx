// @vitest-environment jsdom
import { allerAEcran } from './testNavigation';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CommandeJeu, ReponseJeu } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider, useLabel } from './LabelContext';

afterEach(cleanup);

let envoyer: ((c: CommandeJeu) => Promise<ReponseJeu>) | null = null;
function Sonde() {
  envoyer = useLabel().envoyer;
  return null;
}

interface Partie {
  engine: {
    data: {
      label: { tier: string; tresorerie: number };
      regulation: {
        surveillance: number;
        renegociation: unknown;
      };
    };
  };
}

async function demarrer(tier?: string) {
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
  if (tier)
    await act(async () => {
      const r = await envoyer?.({ type: 'sauvegarder' });
      if (r?.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
      const partie = JSON.parse(r.sauvegarde) as Partie;
      partie.engine.data.label.tier = tier;
      partie.engine.data.label.tresorerie = 9_000_000_000_000;
      partie.engine.data.regulation.surveillance = 60;
      partie.engine.data.regulation.renegociation = {
        annonce: 0,
        debut: 8,
        fin: 60,
        baisse: 0.05,
        resistee: false,
      };
      await envoyer?.({ type: 'charger', sauvegarde: JSON.stringify(partie) });
    });
}

const ouvrir = () => allerAEcran(/Régulation/);

describe('écran Régulation', () => {
  it('reste fermé avant le palier Groupe', async () => {
    await demarrer();
    ouvrir();
    await screen.findByText(/qu’à partir du palier Groupe/);
  });
  it('permet de plaider, de régler la veille et de résister aux plateformes', async () => {
    await demarrer('groupe');
    ouvrir();
    await screen.findByText('Surveillance');
    fireEvent.click(screen.getByRole('button', { name: /Plaider auprès des autorités/ }));
    await screen.findByText(/Tu as déjà plaidé récemment/);
    fireEvent.click(screen.getByRole('button', { name: 'Veille niveau 2' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Veille niveau 2' }).getAttribute('aria-pressed'),
      ).toBe('true'),
    );
    fireEvent.click(screen.getByRole('button', { name: /Résister/ }));
    await screen.findByText(/Tu as déjà tenté de résister/);
  });
});
