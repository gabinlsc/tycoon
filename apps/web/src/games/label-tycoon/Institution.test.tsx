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
        engine: {
          data: { label: { tier: string; tresorerie: number }; institution: { influence: number } };
        };
      };
      partie.engine.data.label.tier = tier;
      partie.engine.data.label.tresorerie = 9_000_000_000_000;
      partie.engine.data.institution.influence = 80;
      await envoyer?.({ type: 'charger', sauvegarde: JSON.stringify(partie) });
    });
}

const ouvrir = () => allerAEcran(/Institution/);

describe('écran Institution', () => {
  it('reste fermé avant le palier', async () => {
    await demarrer();
    ouvrir();
    await screen.findByText(/s’ouvrent au palier Institution/);
  });
  it('fonde l’académie, règle la fondation, agrandit le musée et exerce l’influence', async () => {
    await demarrer('institution');
    ouvrir();
    fireEvent.click(await screen.findByRole('button', { name: /Fonder l’académie/ }));
    await screen.findByText(/Niveau 1 \/ 3 · genre/);
    fireEvent.change(screen.getByLabelText('Don hebdomadaire (€)'), {
      target: { value: '1000000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Régler la fondation' }));
    await screen.findByText(/Don actuel : 1\s?000\s?000 €/);
    fireEvent.click(screen.getByRole('button', { name: /Agrandir le musée/ }));
    await screen.findByText(/Niveau 1 \/ 3 · revenu annuel/);
    fireEvent.click(screen.getByRole('button', { name: /Exercer : Soutenir la scène/ }));
    await waitFor(() => expect(screen.getByText(/Influence :/).textContent).toContain('55'));
  });
});
