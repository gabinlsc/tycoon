// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueJeu } from '@tycoon/label-tycoon';
import { Effets, SEUIL_FLOTTANT, bandeauDeLActu } from './Effets';

afterEach(cleanup);

const vue = (tresorerie: number, noms: string[], fil: { id: number; kind: string }[] = []) =>
  ({
    finances: { tresorerie },
    roster: noms.map((nom, i) => ({ id: i + 1, nom })),
    fil: fil.map((a) => ({ ...a, titre: `Actu ${a.id}`, texte: 'texte' })),
  }) as unknown as VueJeu;

describe('effets du jeu', () => {
  it('associe certification, prix et palier à un bandeau', () => {
    expect(bandeauDeLActu('certification')).toBe('disque');
    expect(bandeauDeLActu('prix-remporte')).toBe('trophee');
    expect(bandeauDeLActu('palier')).toBe('palier');
    expect(bandeauDeLActu('sortie')).toBeNull();
  });

  it('fait voler les gains, tamponne les signatures et annonce les exploits', () => {
    const { container, rerender } = render(<Effets vue={vue(1_000_000, ['Zed'])} />);
    expect(container.querySelector('.lt-effets')).toBeNull();
    act(() =>
      rerender(
        <Effets
          vue={vue(
            1_000_000 + SEUIL_FLOTTANT * 5,
            ['Zed', 'Aya'],
            [{ id: 1, kind: 'certification' }],
          )}
        />,
      ),
    );
    expect(container.querySelector('.lt-flottant--gain')?.textContent).toMatch(/^\+/);
    expect(container.querySelector('.lt-tampon-ecran')?.textContent).toContain('Aya');
    expect(container.querySelector('.lt-bandeau-exploit')?.textContent).toContain('Actu 1');
  });

  it('ignore les petites variations', () => {
    const { container, rerender } = render(<Effets vue={vue(1_000_000, [])} />);
    act(() => rerender(<Effets vue={vue(1_000_000 + 50, [])} />));
    expect(container.querySelector('.lt-effets')).toBeNull();
  });
});
