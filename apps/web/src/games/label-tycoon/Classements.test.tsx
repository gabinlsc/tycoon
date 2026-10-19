// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LabelPilot } from '@tycoon/label-tycoon';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueCertification } from '@tycoon/label-tycoon';
import { Classements, progressionCertification } from './Classements';
import { Coquille } from './Coquille';
import type { MoteurLabel } from './engine/protocol';
import { LabelProvider } from './LabelContext';
import { allerAEcran } from './testNavigation';

afterEach(cleanup);

describe('progression vers une certification', () => {
  const c = (ventes: number, seuil: number | null): VueCertification => ({
    projetId: 1,
    nom: 'x',
    niveau: null,
    ventes,
    prochain: seuil === null ? null : { niveau: 'or', seuil },
  });
  it('reste entre 0 et 1, et vaut 1 quand il n’y a plus de palier', () => {
    expect(progressionCertification(c(50, 200))).toBe(0.25);
    expect(progressionCertification(c(900, 200))).toBe(1);
    expect(progressionCertification(c(0, 200))).toBe(0);
    expect(progressionCertification(c(5, null))).toBe(1);
  });
});

/** Partie préparée : une sortie du joueur avec beaucoup d'écoutes, jouée plusieurs semaines. */
function moteur(): MoteurLabel {
  const source = new LabelPilot();
  source.handle({ type: 'nouvelle-partie', graine: 'clas' });
  source.handle({ type: 'action', action: { type: 'reperer', source: 'plateforme' } });
  const save = source.handle({ type: 'sauvegarder' });
  if (save.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
  const s = JSON.parse(save.sauvegarde) as {
    engine: {
      data: Record<string, unknown> & {
        artistes: { id: number; employeur: string; fanbase: number }[];
        projets: unknown[];
      };
    };
  };
  const a = s.engine.data.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  a.fanbase = 3_000_000;
  s.engine.data.projets.push({
    id: 7000,
    artisteId: a.id,
    type: 'single',
    clip: 'aucun',
    studio: 50,
    producteur: 50,
    mixage: 0,
    debut: 0,
    fin: 0,
    retard: 0,
    statut: 'sortie',
    qualite: 90,
    sortieLe: 0,
    s1: 4_000_000,
    hit: 1,
    viral: null,
    derniers: 0,
    certification: null,
    streams: 0,
  });
  const p = new LabelPilot();
  p.handle({ type: 'charger', sauvegarde: JSON.stringify(s) });
  p.handle({ type: 'avancer', semaines: 3, arretSurSignal: false });
  return {
    envoyer: (c) => Promise.resolve(p.handle(c.type === 'nouvelle-partie' ? { type: 'vue' } : c)),
    arreter: () => undefined,
  };
}

describe('écran Classements', () => {
  it('affiche le Top, met en avant la sortie du joueur et ses certifications', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(moteur())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await allerAEcran(/Classements/);
    await screen.findByText(/Top 50 singles/);
    expect(document.querySelectorAll('.hit__row.is-player').length).toBe(1);
    expect(screen.getByText(/meilleure place/)).toBeTruthy();
    expect(screen.getAllByText(/ventes équivalentes/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Albums' }));
    expect(screen.getByText(/Top 50 albums/)).toBeTruthy();
    expect(Classements).toBeDefined();
  });
});
