// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GraphBarres, GraphCourbe, HitParade } from './Graphiques';

afterEach(cleanup);

const series = [
  { nom: 'Streaming', valeurs: [10, 40, 25, 60] },
  { nom: 'Concerts', valeurs: [5, 8, 30, 12] },
];
const etiquettes = ['M1', 'M2', 'M3', 'M4'];

describe('courbes', () => {
  it('sont nommées pour les lecteurs d’écran et doublées d’une table de données', () => {
    render(<GraphCourbe titre="Revenus" etiquettes={etiquettes} series={series} />);
    expect(screen.getByRole('img', { name: 'Revenus' })).toBeTruthy();
    const table = screen.getByRole('table', { hidden: true });
    expect(table.querySelectorAll('tbody tr')).toHaveLength(4);
    expect(table.textContent).toContain('Streaming');
  });
  it('dessinent une ligne par série, une aire si demandé, et une légende', () => {
    const { container } = render(
      <GraphCourbe titre="R" etiquettes={etiquettes} series={series} aire />,
    );
    expect(container.querySelectorAll('.graph__line')).toHaveLength(2);
    expect(container.querySelectorAll('.graph__area')).toHaveLength(1);
    expect(container.querySelectorAll('.graph__legend li')).toHaveLength(2);
  });
  it('gardent des tracés finis même avec une seule valeur ou des valeurs négatives', () => {
    const { container } = render(
      <GraphCourbe titre="R" etiquettes={['A']} series={[{ nom: 's', valeurs: [-3] }]} />,
    );
    expect(container.querySelector('.graph__line')?.getAttribute('d')).not.toMatch(/NaN|Infinity/);
  });
});

describe('barres', () => {
  it('dessinent une barre par valeur, rouge si négative', () => {
    const { container } = render(
      <GraphBarres
        titre="Net"
        etiquettes={['A', 'B']}
        series={[{ nom: 'net', valeurs: [10, -4] }]}
      />,
    );
    const bars = container.querySelectorAll('.graph__bar');
    expect(bars).toHaveLength(2);
    expect((bars[1] as SVGElement).style.fill).toBe('var(--red)');
  });
});

describe('hit-parade', () => {
  it('liste les rangs, met en avant le joueur et dimensionne les barres sur le meilleur score', () => {
    const { container } = render(
      <HitParade
        titre="Top singles"
        lignes={[
          { rang: 1, nom: 'A', valeur: 1000 },
          { rang: 2, nom: 'B', valeur: 500, joueur: true },
        ]}
      />,
    );
    expect(screen.getByText('Top singles')).toBeTruthy();
    expect(container.querySelectorAll('.is-player')).toHaveLength(1);
    const widths = [...container.querySelectorAll('.hit__bar > span')].map(
      (e) => (e as HTMLElement).style.width,
    );
    expect(widths).toEqual(['100%', '50%']);
  });
});
