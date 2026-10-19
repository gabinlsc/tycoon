// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VueSuivi } from '@tycoon/label-tycoon';
import { Pack, meilleureRarete } from './Pack';
import { rareteDe, rangRarete, scoreArtiste, scoreSuivi } from './rarete';
import { traitsDuVisage } from './Visage';

afterEach(cleanup);

const talent = (id: number, nom: string, milieu: number): VueSuivi =>
  ({
    id,
    nom,
    genre: 'rap',
    fourchettes: {
      plume: [milieu - 5, milieu + 5],
      flow: [milieu - 5, milieu + 5],
    },
  }) as unknown as VueSuivi;

describe('raretés', () => {
  it('classe les scores en quatre raretés', () => {
    expect(rareteDe(10)).toBe('commun');
    expect(rareteDe(45)).toBe('rare');
    expect(rareteDe(65)).toBe('epique');
    expect(rareteDe(90)).toBe('legendaire');
    expect(rangRarete('legendaire')).toBeGreaterThan(rangRarete('epique'));
  });
  it('note un artiste signé et un talent repéré', () => {
    expect(scoreArtiste({ notoriete: 80, competences: { a: 60, b: 80 } })).toBe(75);
    expect(scoreSuivi({ fourchettes: { a: [40, 60] } })).toBe(50);
  });
  it('trouve la meilleure carte d’un lot', () => {
    expect(meilleureRarete([talent(1, 'A', 30), talent(2, 'B', 85)])).toBe('legendaire');
  });
});

describe('visage', () => {
  it('donne toujours le même visage au même nom', () => {
    expect(traitsDuVisage('Zed')).toEqual(traitsDuVisage('Zed'));
    expect(traitsDuVisage('Zed')).not.toEqual(traitsDuVisage('Aya la grande'));
  });
});

describe('ouverture de pack', () => {
  it('se déchire, puis chaque carte se retourne jusqu’à l’ajout au carnet', () => {
    const fermer = vi.fn();
    render(
      <Pack
        source="Open mic"
        talents={[talent(1, 'Zed', 30), talent(2, 'Aya', 85)]}
        fermer={fermer}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le pack/ }));
    const carte = screen.getByRole('button', { name: 'Retourner la carte 2' });
    fireEvent.click(carte);
    expect(screen.getByRole('button', { name: 'Aya, carte legendaire' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Tout retourner/ }));
    expect(screen.getByRole('button', { name: 'Zed, carte commun' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter à mon carnet/ }));
    expect(fermer).toHaveBeenCalled();
  });

  it('annonce un pack vide', () => {
    render(<Pack source="Battle" talents={[]} fermer={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir le pack/ }));
    expect(screen.getByText('Pack vide')).toBeTruthy();
  });
});
