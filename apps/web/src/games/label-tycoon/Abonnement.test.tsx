// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Abonnement } from './Abonnement';
import { OFFRES, choisirOffre, definirAbonnement, normaliser, offreDe, prixTexte } from './offres';

afterEach(() => {
  cleanup();
  choisirOffre('gratuit');
});

describe('abonnement fictif', () => {
  it('propose trois offres aux prix de démonstration', () => {
    expect(OFFRES.map((o) => o.id)).toEqual(['gratuit', 'pro', 'legende']);
    expect(prixTexte(0)).toBe('0 €');
    expect(prixTexte(499)).toContain('4,99');
    expect(prixTexte(999)).toContain('9,99');
  });

  it('ne laisse jamais un avantage que l’offre n’autorise pas', () => {
    expect(normaliser({ offre: 'gratuit', theme: 'neon', cadre: 'diamant' })).toEqual({
      offre: 'gratuit',
      theme: 'saison',
      cadre: 'classique',
    });
    expect(normaliser({ offre: 'legende', theme: 'neon', cadre: 'diamant' }).cadre).toBe('diamant');
    expect(offreDe('pro').cadres).not.toContain('diamant');
  });

  it('active une offre sans paiement après confirmation, puis débloque thèmes et cadres', () => {
    render(<Abonnement />);
    expect(screen.getByText(/aucun paiement, aucune carte/)).toBeTruthy();
    expect((screen.getByRole('button', { name: /Neon|Néon/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choisir l’offre Pro' }));
    expect(screen.getByRole('dialog', { name: /Confirmer l’abonnement/ }).textContent).toContain(
      'sans aucun débit',
    );
    fireEvent.click(screen.getByRole('button', { name: /Activer l’offre Pro/ }));
    expect(screen.getByRole('button', { name: 'Offre Pro active' })).toBeTruthy();
    const neon = screen.getByRole('button', { name: /Néon/ }) as HTMLButtonElement;
    expect(neon.disabled).toBe(false);
    fireEvent.click(neon);
    expect(neon.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Choisir l’offre Gratuit' }));
    expect(screen.getByRole('button', { name: 'Offre Gratuit active' })).toBeTruthy();
  });

  it('annule sans rien changer', () => {
    render(<Abonnement />);
    fireEvent.click(screen.getByRole('button', { name: 'Choisir l’offre Légende' }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Offre Gratuit active' })).toBeTruthy();
    definirAbonnement({ theme: 'neon' });
    expect(screen.getByRole('button', { name: /Saisons/ }).getAttribute('aria-pressed')).toBe(
      'true',
    );
  });
});
