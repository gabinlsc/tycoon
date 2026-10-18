// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueScenario } from '@tycoon/label-tycoon';
import { BandeauScenario, formaterDelai } from './BandeauScenario';

afterEach(cleanup);

const base: VueScenario = {
  id: 'x',
  titre: 'Test',
  description: '',
  statut: 'en-cours',
  limite: 104,
  semainesRestantes: 70,
  objectifs: [
    { texte: 'Objectif A', atteint: true },
    { texte: 'Objectif B', atteint: false },
  ],
  fin: null,
  score: null,
  raison: null,
  regles: [{ texte: 'Un seul artiste', respectee: false }],
};

describe('formatage du délai', () => {
  it('compte en années et semaines', () => {
    expect(formaterDelai(30)).toBe('30 sem.');
    expect(formaterDelai(52)).toBe('1 an');
    expect(formaterDelai(130)).toBe('2 ans 26 sem.');
  });
});

describe('bandeau de scénario', () => {
  it('liste objectifs et règles pendant la partie', () => {
    render(<BandeauScenario scenario={base} />);
    expect(screen.getByText(/Temps restant/).textContent).toContain('1 an 18 sem.');
    expect(screen.getByText(/Objectif A/).textContent).toContain('✔');
    expect(screen.getByText(/Objectif B/).textContent).toContain('○');
    expect(screen.getByText(/Règle : Un seul artiste/).textContent).toContain('✘');
  });
  it('annonce la victoire avec le score', () => {
    render(<BandeauScenario scenario={{ ...base, statut: 'reussi', fin: 40, score: 1640 }} />);
    expect(screen.getByRole('status').textContent).toMatch(/Scénario réussi/);
    expect(screen.getByRole('status').textContent).toContain('1');
    expect(screen.queryByText(/Temps restant/)).toBeNull();
  });
  it('explique la défaite', () => {
    render(<BandeauScenario scenario={{ ...base, statut: 'echec', raison: 'regle' }} />);
    expect(screen.getByRole('status').textContent).toMatch(/règle du scénario a été brisée/);
  });
});
