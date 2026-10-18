// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { JaugeReaction, Tampon } from './Negociation';
import { OFFRE_DE_DEPART, clausesDepuis, offreDepuis } from './negociation';

afterEach(cleanup);

describe('conversions du formulaire', () => {
  it('passent des euros et pourcentages aux centimes et points de base, et reviennent', () => {
    const c = clausesDepuis({
      ...OFFRE_DE_DEPART,
      avanceEuros: 1500.5,
      royaltiesPct: 42.5,
      part360Pct: 10,
      annees: 3,
      exclusivite: true,
      rachatEuros: 2000,
    });
    expect(c).toEqual({
      avance: 150050,
      royaltiesArtisteBps: 4250,
      dureeAnnees: 3,
      exclusivite: true,
      part360Bps: 1000,
      clauseRachat: 200000,
    });
    expect(offreDepuis(c)).toMatchObject({
      avanceEuros: 1500.5,
      royaltiesPct: 42.5,
      part360Pct: 10,
    });
    expect(clausesDepuis({ ...OFFRE_DE_DEPART, avanceEuros: -5 }).avance).toBe(0);
  });
});

describe('jauge et tampon', () => {
  it('annonce la réaction et allume les niveaux jusqu’à elle', () => {
    const { container } = render(<JaugeReaction reaction="interesse" />);
    expect(screen.getByRole('img', { name: 'Réaction : Intéressé' })).toBeTruthy();
    expect(container.querySelectorAll('[data-on]')).toHaveLength(3);
    cleanup();
    render(<JaugeReaction reaction={null} />);
    expect(screen.getByRole('img', { name: 'Réaction : en attente' })).toBeTruthy();
  });
  it('affiche le tampon', () => {
    render(<Tampon />);
    expect(screen.getByRole('status').textContent).toBe('SIGNÉ');
  });
});

describe('écran de négociation', () => {
  it('réagit en direct aux clauses, accepte une offre généreuse et appose le tampon', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Repérage/ }));
    const gratuit = screen.getByText('Candidatures spontanées').closest('li') as HTMLElement;
    fireEvent.click(gratuit.querySelector('button') as HTMLElement);
    await waitFor(() =>
      expect(document.querySelectorAll('.label-prospect').length).toBeGreaterThan(0),
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Négocier' })[0] as HTMLElement);
    await screen.findByRole('heading', { name: /Négocier avec/ });
    // Offre de départ pingre : la jauge répond
    await waitFor(() =>
      expect(screen.getByRole('img', { name: /Réaction : (Mécontent|Hésitant)/ })).toBeTruthy(),
    );
    // Offre très généreuse : avance, royalties, durée courte
    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    fireEvent.change(sliders[0] as HTMLInputElement, { target: { value: '2500' } });
    fireEvent.change(sliders[1] as HTMLInputElement, { target: { value: '90' } });
    fireEvent.change(sliders[2] as HTMLInputElement, { target: { value: '1' } });
    await waitFor(() =>
      expect(screen.getByRole('img', { name: /Réaction : (Intéressé|Enthousiaste)/ })).toBeTruthy(),
    );
    await screen.findByText(/Il accepte/);
    fireEvent.click(screen.getByRole('button', { name: 'Proposer ce contrat' }));
    expect(await screen.findByText('SIGNÉ')).toBeTruthy();
  });
});
