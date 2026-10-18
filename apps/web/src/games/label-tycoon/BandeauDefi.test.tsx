// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VueDefi } from '@tycoon/label-tycoon';
import { BandeauDefi } from './BandeauDefi';
import { Coquille } from './Coquille';
import { enregistrerScore, lireMeilleurScore } from './defi';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

const defi: VueDefi = {
  date: '2026-10-18',
  semainesRestantes: 12,
  termine: false,
  score: 12_345,
  partage: 'Label Tycoon · Défi du 2026-10-18\nScore : 12 345 €\n52/52 semaines',
};

describe('meilleur score du jour', () => {
  it('ne garde que le meilleur score, par date', () => {
    expect(lireMeilleurScore('2026-10-18')).toBeNull();
    expect(enregistrerScore('2026-10-18', 100)).toBe(100);
    expect(enregistrerScore('2026-10-18', 50)).toBe(100);
    expect(enregistrerScore('2026-10-18', 300)).toBe(300);
    expect(lireMeilleurScore('2026-10-19')).toBeNull();
  });
});

describe('bandeau du défi', () => {
  it('affiche les semaines restantes pendant le défi', () => {
    render(<BandeauDefi defi={defi} />);
    expect(screen.getByText(/Semaines restantes/).textContent).toContain('12');
    expect(screen.queryByRole('button', { name: 'Copier le résultat' })).toBeNull();
  });
  it('propose de copier le résultat une fois terminé, et retient le meilleur score', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: ecrire },
      configurable: true,
    });
    enregistrerScore('2026-10-18', 99_999);
    render(<BandeauDefi defi={{ ...defi, termine: true, semainesRestantes: 0 }} />);
    expect(screen.getByRole('status').textContent).toContain('ton meilleur score du jour');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copier le résultat' }));
    });
    expect(ecrire).toHaveBeenCalledWith(defi.partage);
    await screen.findByText('Résultat copié dans le presse-papiers.');
  });
});

describe('écran de départ : défi du jour', () => {
  it('lance le défi et affiche son bandeau', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('radio', { name: /Défi du jour/ }));
    expect(screen.queryByText('Graine (facultatif)')).toBeNull();
    fireEvent.click(b);
    const bandeau = await screen.findByLabelText(/^Défi du \d{4}-\d{2}-\d{2}$/);
    expect(bandeau.textContent).toContain('Semaines restantes : 52');
  });
});
