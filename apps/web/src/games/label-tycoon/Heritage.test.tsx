// @vitest-environment jsdom
import { allerAEcran } from './testNavigation';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { CommandeJeu, ReponseJeu } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider, useLabel } from './LabelContext';
import { lirePantheon } from './pantheon';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

let envoyer: ((c: CommandeJeu) => Promise<ReponseJeu>) | null = null;
function Sonde() {
  envoyer = useLabel().envoyer;
  return null;
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
      const partie = JSON.parse(r.sauvegarde) as {
        engine: {
          data: {
            label: { tier: string; reputation: number };
            institution: { donne: number };
          };
        };
      };
      partie.engine.data.label.tier = tier;
      partie.engine.data.label.reputation = 80;
      partie.engine.data.institution.donne = 9_000_000_000_000;
      await envoyer?.({ type: 'charger', sauvegarde: JSON.stringify(partie) });
    });
}

const ouvrir = () => allerAEcran(/Héritage/);

describe('écran Héritage', () => {
  it('ne permet pas de clore un règne trop jeune', async () => {
    await demarrer();
    ouvrir();
    await screen.findByText(/à partir du palier groupe/);
    expect(screen.queryByRole('button', { name: 'Clore le règne' })).toBeNull();
    expect(screen.getByText(/Aucun règne n’a encore été clos/)).toBeTruthy();
  });

  it('clôt le règne, l’inscrit au Panthéon et lance la génération suivante avec ses bonus', async () => {
    await demarrer('groupe');
    ouvrir();
    fireEvent.click(await screen.findByRole('button', { name: 'Clore le règne' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Fonder la génération suivante' }));
    await waitFor(() => expect(lirePantheon()).toHaveLength(1));
    expect(lirePantheon()[0]?.bonus).toContain('fondation');
    ouvrir();
    await screen.findByText(/Règne n° 2 de/);
    expect(screen.getAllByText(/déjà hérité/).length).toBeGreaterThan(0);
  });
});
