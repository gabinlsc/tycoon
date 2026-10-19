// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CheminCampagne } from './Campagne';
import { CHAPITRES, progression } from './chapitres';

afterEach(cleanup);

const vue = (palierId: string, over = {}) =>
  ({
    label: { palierId },
    prochainPalier: {
      id: 'independant',
      nom: 'Indépendant',
      reputation: { actuelle: 10, requise: 20 },
      chiffreAffaires: { actuel: 7_500_000, requis: 15_000_000 },
      certification: { requise: 'or', atteinte: false },
    },
    ...over,
  }) as never;

describe('campagne', () => {
  it('a un chapitre par palier, du garage à l’institution', () => {
    expect(CHAPITRES).toHaveLength(7);
    expect(CHAPITRES[0]?.palier).toBe('home-studio');
    expect(CHAPITRES.at(-1)?.palier).toBe('institution');
  });

  it('mesure l’avancement du chapitre sur les conditions du palier suivant', () => {
    const p = progression(vue('home-studio'));
    expect(p.index).toBe(0);
    expect(p.objectifs.map((o) => o.id)).toEqual(['reputation', 'ca', 'certification']);
    expect(Math.round(p.avancement * 100)).toBe(33);
    expect(p.dernier).toBe(false);
  });

  it('termine la campagne au dernier palier', () => {
    const p = progression(vue('institution', { prochainPalier: null }));
    expect(p.dernier).toBe(true);
    expect(p.avancement).toBe(1);
  });

  it('dessine le chemin : chapitres passés, courant et à venir', () => {
    render(<CheminCampagne index={2} />);
    const etapes = screen.getAllByRole('listitem');
    expect(etapes).toHaveLength(7);
    expect(etapes[2]?.getAttribute('aria-current')).toBe('step');
    expect(etapes[0]?.className).toContain('is-fait');
    expect(etapes[5]?.className).toContain('is-futur');
  });
});
