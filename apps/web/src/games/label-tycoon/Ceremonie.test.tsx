import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { VueCeremonie } from '@tycoon/label-tycoon';
import { Ceremonie, TapisRouge } from './Ceremonie';

const nomme = (nom: string, joueur: boolean, gagnant: boolean) => ({
  ref: nom,
  nom,
  detail: '',
  genre: 'rap',
  joueur,
  gagnant,
});

const CEREMONIE: VueCeremonie = {
  annee: 2,
  phase: 'resultats',
  semaineRemise: 92,
  labelDeLAnnee: true,
  nominationsDuJoueur: 2,
  prixDuJoueur: 1,
  categories: [
    {
      id: 'single',
      nom: 'Single de l’année',
      nommes: [nomme('Nova', true, true), nomme('Rival A', false, false)],
    },
    {
      id: 'revelation',
      nom: 'Révélation de l’année',
      nommes: [nomme('Kali', true, false), nomme('Rival B', false, true)],
    },
  ],
};

describe('cérémonie des Trophées', () => {
  it('lève le rideau, ouvre les enveloppes puis montre le palmarès', () => {
    const fermer = vi.fn();
    render(<Ceremonie ceremonie={CEREMONIE} fermer={fermer} />);
    expect(screen.getByRole('dialog', { name: 'Les Trophées de la musique' })).toBeTruthy();
    expect(screen.getByText(/nommé 2 fois/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Lever le rideau' }));
    expect(screen.getByRole('heading', { name: 'Single de l’année' })).toBeTruthy();
    expect(screen.getByText('Ton label')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir l’enveloppe/ }));
    expect(screen.getByRole('status').textContent).toMatch(
      /Nova l’emporte\. Le trophée est pour ton label/,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Catégorie suivante' }));
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir l’enveloppe/ }));
    expect(screen.getByRole('status').textContent).toBe('Rival B l’emporte.');

    fireEvent.click(screen.getByRole('button', { name: 'Voir le palmarès' }));
    expect(screen.getByRole('heading', { name: '1 trophée !' })).toBeTruthy();
    expect(screen.getByText(/Label de l’année/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Retour au label' }));
    expect(fermer).toHaveBeenCalled();
  });

  it('se passe d’un clic ou avec Échap', () => {
    const fermer = vi.fn();
    render(<Ceremonie ceremonie={CEREMONIE} fermer={fermer} />);
    fireEvent.click(screen.getByRole('button', { name: /Passer la cérémonie/ }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(fermer).toHaveBeenCalledTimes(2);
  });

  it('annonce les nominations sur le tapis rouge du QG', () => {
    render(<TapisRouge ceremonie={{ ...CEREMONIE, phase: 'nominations' }} semaine={89} />);
    expect(screen.getByRole('heading', { name: '2 nominations pour ton label' })).toBeTruthy();
    expect(screen.getByText('Remise des prix dans 3 semaines.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Revoir/ })).toBeNull();
  });

  it('propose de revoir la cérémonie une fois les prix remis', () => {
    const revoir = vi.fn();
    render(<TapisRouge ceremonie={CEREMONIE} semaine={93} revoir={revoir} />);
    expect(screen.getByRole('heading', { name: '1 trophée remporté' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Revoir la cérémonie/ }));
    expect(revoir).toHaveBeenCalled();
  });
});
