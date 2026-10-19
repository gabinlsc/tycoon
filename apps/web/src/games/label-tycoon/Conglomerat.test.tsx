// @vitest-environment jsdom
import { allerAEcran } from './testNavigation';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { CommandeJeu, ReponseJeu } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { lectureArbitrage } from './Conglomerat';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider, useLabel } from './LabelContext';

afterEach(cleanup);

describe('lecture de l’arbitrage', () => {
  it('explique ce que rapporte l’exclusivité selon la portée', () => {
    expect(lectureArbitrage(0, 0)).toMatch(/plateformes externes/);
    expect(lectureArbitrage(50, 10)).toMatch(/perdre des écoutes/);
    expect(lectureArbitrage(50, 50)).toMatch(/incertain/);
    expect(lectureArbitrage(50, 90)).toMatch(/rapporte plus/);
  });
});

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
      partie.engine.data.label.tresorerie = 900_000_000_000;
      await envoyer?.({ type: 'charger', sauvegarde: JSON.stringify(partie) });
    });
}

const ouvrir = () => allerAEcran(/Conglomérat/);

describe('écran Conglomérat', () => {
  it('reste fermé avant le palier', async () => {
    await demarrer();
    ouvrir();
    await screen.findByText(/s’ouvrent au palier/);
  });
  it('lance la plateforme, règle l’exclusivité, achète un studio et un festival', async () => {
    await demarrer('conglomerat');
    ouvrir();
    fireEvent.click(await screen.findByRole('button', { name: /Lancer la plateforme/ }));
    await screen.findByText(/abonnés · marge/);
    fireEvent.change(screen.getByLabelText('Catalogue exclusif (%)'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'Régler la plateforme' }));
    await screen.findByText(/Réglage actuel : 60 % d’exclusivité/);
    fireEvent.click(screen.getByRole('button', { name: /Acheter un studio de synchro/ }));
    await screen.findByText(/Niveau 1 \/ 3/);
    fireEvent.click(screen.getByRole('button', { name: /Acheter un festival/ }));
    await screen.findByText(/1 \/ 3 festival/);
  });
});
