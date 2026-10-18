// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LabelPilot } from '@tycoon/label-tycoon';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import type { MoteurLabel } from './engine/protocol';
import { LabelProvider } from './LabelContext';

afterEach(cleanup);

/** Partie préparée : un artiste signé avec contrat, obtenu en éditant une sauvegarde. */
function moteurAvecRoster(): MoteurLabel {
  const source = new LabelPilot();
  source.handle({ type: 'nouvelle-partie', graine: 'fiche' });
  source.handle({ type: 'action', action: { type: 'reperer', source: 'plateforme' } });
  const save = source.handle({ type: 'sauvegarder' });
  if (save.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
  const session = JSON.parse(save.sauvegarde) as {
    engine: {
      data: {
        artistes: { id: number; employeur: string; nomScene: string }[];
        contrats: unknown[];
      };
    };
  };
  const artiste = session.engine.data.artistes[0];
  if (!artiste) throw new Error('artiste attendu');
  artiste.employeur = 'joueur';
  session.engine.data.contrats.push({
    id: 900,
    artisteId: artiste.id,
    clauses: {
      avance: 0,
      royaltiesArtisteBps: 4500,
      dureeAnnees: 2,
      exclusivite: false,
      part360Bps: 0,
      clauseRachat: 0,
    },
    signeLe: 0,
    echeance: 104,
    recette360: 0,
  });
  const pilote = new LabelPilot();
  pilote.handle({ type: 'charger', sauvegarde: JSON.stringify(session) });
  // « Nouvelle partie » reprend la partie préparée
  return {
    envoyer: (c) =>
      Promise.resolve(pilote.handle(c.type === 'nouvelle-partie' ? { type: 'vue' } : c)),
    arreter: () => undefined,
  };
}

describe('fiche artiste', () => {
  it('s’ouvre depuis le roster, montre jauges, contrat et sorties, et revient au roster', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(moteurAvecRoster())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Roster/ }));
    const liens = document.querySelectorAll('.label-link');
    expect(liens.length).toBe(1);
    fireEvent.click(liens[0] as HTMLElement);
    expect(await screen.findByRole('heading', { name: /./, level: 2 })).toBeTruthy();
    expect(screen.getByText('Compétences')).toBeTruthy();
    expect(screen.getByText(/45\s?%/)).toBeTruthy();
    expect(screen.getAllByRole('meter').length).toBe(9);
    expect(screen.getByText('Aucune sortie pour l’instant.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Retour au roster/ }));
    expect(document.querySelectorAll('.label-link').length).toBe(1);
  });
});
