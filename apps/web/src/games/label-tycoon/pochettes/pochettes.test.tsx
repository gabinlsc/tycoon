// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MOTIFS, hacher, parametresPochette, suite } from './generer';
import { Pochette } from './Pochette';

afterEach(cleanup);

describe('génération', () => {
  it('hache et tire de façon stable', () => {
    expect(hacher('a')).toBe(hacher('a'));
    expect(hacher('a')).not.toBe(hacher('b'));
    const a = suite(42);
    const b = suite(42);
    const tirages = Array.from({ length: 5 }, () => a());
    expect(tirages).toEqual(Array.from({ length: 5 }, () => b()));
    expect(tirages.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('donne toujours les mêmes paramètres pour une même graine et un même genre', () => {
    expect(parametresPochette('sortie-12', 'rap')).toEqual(parametresPochette('sortie-12', 'rap'));
    expect(parametresPochette('sortie-12', 'rap')).not.toEqual(
      parametresPochette('sortie-13', 'rap'),
    );
  });

  it('varie : tous les motifs apparaissent sur un échantillon, teintes valides', () => {
    const vus = new Set<string>();
    for (let i = 0; i < 200; i += 1) {
      const p = parametresPochette(`s${i}`, 'afro');
      vus.add(p.motif);
      for (const t of p.teintes) {
        expect(t).toBeGreaterThanOrEqual(0);
        expect(t).toBeLessThan(360);
      }
    }
    expect(vus.size).toBe(MOTIFS.length);
  });

  it('rapproche les couleurs des pochettes d’un même genre', () => {
    const fonds = (genre: string) =>
      Array.from({ length: 30 }, (_, i) => parametresPochette(`x${i}`, genre).teintes[0]);
    const ecart = (v: number[]) => Math.max(...v) - Math.min(...v);
    expect(ecart(fonds('rap').map(Number))).toBeLessThanOrEqual(120);
  });
});

describe('pochette', () => {
  it('est nommée, rend tous les motifs sans valeur invalide, et tronque les longs titres', () => {
    for (let i = 0; i < 40; i += 1) {
      const { container, unmount } = render(
        <Pochette graine={`p${i}`} genre="trap" titre={`Titre ${i}`} />,
      );
      expect(container.innerHTML).not.toMatch(/NaN|undefined/);
      unmount();
    }
    render(
      <Pochette
        graine="z"
        genre="rap"
        titre="Un titre vraiment beaucoup trop long pour la pochette"
      />,
    );
    expect(screen.getByRole('img', { name: /Pochette de Un titre/ })).toBeTruthy();
    expect(document.querySelector('.pochette__titre')?.textContent).toMatch(/…$/);
  });
});
