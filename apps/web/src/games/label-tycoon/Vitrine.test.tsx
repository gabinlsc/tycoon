// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AfficheVitrine, donneesVitrine } from './Vitrine';
import { calculerSerie, dateDuJour, enregistrerJour, lireJours, titreDeSerie } from './serie';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('série de jours', () => {
  it('compte les jours d’affilée jusqu’à aujourd’hui ou hier', () => {
    expect(calculerSerie(['2026-03-01', '2026-03-02', '2026-03-03'], '2026-03-03')).toBe(3);
    expect(calculerSerie(['2026-03-01', '2026-03-02'], '2026-03-03')).toBe(2);
    expect(calculerSerie(['2026-03-01'], '2026-03-04')).toBe(0);
    expect(calculerSerie(['2026-02-28', '2026-03-01'], '2026-03-01')).toBe(2);
    expect(calculerSerie([], '2026-03-01')).toBe(0);
  });

  it('donne un titre aux séries longues', () => {
    expect(titreDeSerie(2)).toBeNull();
    expect(titreDeSerie(3)).toBe('Régulier');
    expect(titreDeSerie(7)).toBe('Habitué');
    expect(titreDeSerie(30)).toBe('Légende du label');
  });

  it('note le jour une seule fois', () => {
    const jour = new Date(2026, 2, 5);
    expect(enregistrerJour(jour)).toBe(1);
    expect(enregistrerJour(jour)).toBe(1);
    expect(lireJours()).toEqual(['2026-03-05']);
    expect(enregistrerJour(new Date(2026, 2, 6))).toBe(2);
    expect(dateDuJour(jour)).toBe('2026-03-05');
  });
});

describe('vitrine', () => {
  it('résume le label et ses trois meilleurs artistes', () => {
    const vue = {
      label: { nom: 'Maison Zed', palier: 'Indépendant', reputation: 42 },
      finances: { valorisation: 125_000_000 },
      roster: [
        { nom: 'A', notoriete: 10, competences: { x: 10 } },
        { nom: 'B', notoriete: 90, competences: { x: 90 } },
        { nom: 'C', notoriete: 50, competences: { x: 50 } },
        { nom: 'D', notoriete: 70, competences: { x: 70 } },
      ],
    } as never;
    const d = donneesVitrine(vue, 4);
    expect(d.artistes.map((a) => a.nom)).toEqual(['B', 'D', 'C']);
    expect(d.artistes[0]?.rarete).toBe('legendaire');
    render(<AfficheVitrine d={d} />);
    expect(screen.getByRole('img', { name: 'Vitrine de Maison Zed' })).toBeTruthy();
    expect(screen.getByText(/Série 4 jours/)).toBeTruthy();
  });
});
