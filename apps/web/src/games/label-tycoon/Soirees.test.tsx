// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VueLigneClassement } from '@tycoon/label-tycoon';
import {
  CourseClassement,
  SoireeSortie,
  accueilAttendu,
  lignesDeLaCourse,
  nouvelleEntree,
} from './Soirees';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ligne = (rang: number, joueur = false): VueLigneClassement => ({
  rang,
  nom: `Titre ${rang}`,
  streams: 1000 - rang,
  joueur,
});

describe('accueil attendu', () => {
  it('monte avec la qualité et la hype', () => {
    expect(accueilAttendu(10, 10).mot).toBe('Timide');
    expect(accueilAttendu(50, 50).mot).toBe('Chaleureux');
    expect(accueilAttendu(80, 70).mot).toBe('Électrique');
    expect(accueilAttendu(100, 100).mot).toBe('Hystérique');
  });
});

describe('soirée de sortie', () => {
  it('compte à rebours, puis annonce l’accueil et propose les classements', () => {
    vi.useFakeTimers();
    const fermer = vi.fn();
    const voir = vi.fn();
    render(
      <SoireeSortie
        artiste="Zed"
        genre="rap"
        type="Single"
        graine="p1"
        qualite={80}
        hype={70}
        fermer={fermer}
        voirClassements={voir}
      />,
    );
    expect(screen.getByRole('dialog', { name: /Soirée de sortie : Zed/ })).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    for (let i = 0; i < 3; i += 1) act(() => void vi.advanceTimersByTime(950));
    expect(screen.getByText('C’EST SORTI !')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('Électrique');
    fireEvent.click(screen.getByRole('button', { name: /Voir les classements/ }));
    expect(voir).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Retour au label/ }));
    expect(fermer).toHaveBeenCalled();
  });
});

describe('course au classement', () => {
  it('repère une nouvelle entrée et garde ta ligne même hors du top 10', () => {
    const vue = {
      historiqueClassements: [
        {
          projetId: 1,
          nom: 'Ancien',
          classement: 'singles',
          meilleure: 3,
          semaines: 4,
          position: 3,
        },
        {
          projetId: 2,
          nom: 'Neuf',
          classement: 'singles',
          meilleure: 14,
          semaines: 1,
          position: 14,
        },
      ],
    } as never;
    expect(nouvelleEntree(new Set([1]), vue)?.nom).toBe('Neuf');
    expect(nouvelleEntree(new Set([1, 2]), vue)).toBeNull();
    const lignes = [
      ...Array.from({ length: 14 }, (_, i) => ligne(i + 1)),
      { ...ligne(15), joueur: true },
    ];
    const course = lignesDeLaCourse(lignes, 'Titre 15');
    expect(course).toHaveLength(10);
    expect(course[9]?.joueur).toBe(true);
  });

  it('annonce la place et se ferme', () => {
    const fermer = vi.fn();
    render(
      <CourseClassement
        nom="Neuf"
        position={7}
        lignes={[ligne(1), { ...ligne(7), nom: 'Neuf', joueur: true }]}
        fermer={fermer}
      />,
    );
    expect(screen.getByRole('dialog', { name: /Entrée au classement : Neuf/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(fermer).toHaveBeenCalled();
  });
});
