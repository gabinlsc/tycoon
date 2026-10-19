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
        engine: { data: { label: { tier: string; tresorerie: number } } };
      };
      partie.engine.data.label.tier = tier;
      partie.engine.data.label.tresorerie = 9_000_000_000_000;
      await envoyer?.({ type: 'charger', sauvegarde: JSON.stringify(partie) });
    });
}

const ouvrir = () => allerAEcran(/International/);

describe('écran International', () => {
  it('reste fermé avant le palier Major', async () => {
    await demarrer();
    ouvrir();
    await screen.findByText(/L’export s’ouvre au palier Major/);
  });
  it('ouvre un bureau puis règle la campagne', async () => {
    await demarrer('major');
    ouvrir();
    fireEvent.click(await screen.findByRole('button', { name: /Ouvrir un bureau à Valdoria/ }));
    const champ = await screen.findByLabelText(/Budget de campagne à Valdoria/);
    fireEvent.change(champ, { target: { value: '5000' } });
    fireEvent.click(screen.getByRole('button', { name: /Régler la campagne à Valdoria/ }));
    await screen.findByText(/Pénétration/);
    expect(screen.getAllByText(/Classement local/).length).toBeGreaterThan(0);
  });
});
