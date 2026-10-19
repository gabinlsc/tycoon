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

interface Artiste {
  id: number;
  employeur: string;
  genre: string;
  phase: string;
  fanbase: number;
  age: number;
  nomScene?: string;
  retraite?: { semaine: number; chezJoueur: boolean };
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
  await act(async () => {
    await envoyer?.({ type: 'action', action: { type: 'reperer', source: 'plateforme' } });
    await envoyer?.({ type: 'avancer', semaines: 2 });
    const r = await envoyer?.({ type: 'sauvegarder' });
    if (r?.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
    const partie = JSON.parse(r.sauvegarde) as { engine: { data: { artistes: Artiste[] } } };
    const { artistes } = partie.engine.data;
    const modele = artistes[0];
    if (!modele) throw new Error('artiste attendu');
    const legende: Artiste = { ...modele, id: 9001 };
    const jeune: Artiste = { ...modele, id: 9002, nomScene: 'Jeune Pousse' };
    artistes.push(legende, jeune);
    legende.employeur = 'retraite';
    legende.retraite = { semaine: 3, chezJoueur: true };
    legende.fanbase = 3_000_000;
    legende.age = 66;
    jeune.employeur = 'joueur';
    jeune.genre = legende.genre;
    jeune.phase = 'emergent';
    await envoyer?.({ type: 'charger', sauvegarde: JSON.stringify(partie) });
  });
}

describe('écran Générations', () => {
  it('liste les légendes et permet de parrainer un jeune talent', async () => {
    await demarrer();
    await allerAEcran(/Générations/);
    await screen.findByText('légende(s) du label');
    fireEvent.click(await screen.findByRole('button', { name: /Faire parrainer par/ }));
    await screen.findByText(/parraine /);
  });
});
