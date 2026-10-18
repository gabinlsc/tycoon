// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandeJeu, VueDefi } from '@tycoon/label-tycoon';
import { BandeauDefi } from './BandeauDefi';
import { Coquille } from './Coquille';
import { enregistrerScore, lireMeilleurScore } from './defi';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider, useLabel } from './LabelContext';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

const rendre = (ui: ReactNode) =>
  render(<LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>{ui}</LabelProvider>);

const defi: VueDefi = {
  date: '2026-10-18',
  type: 'jour',
  contrainte: null,
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
    rendre(<BandeauDefi defi={defi} />);
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
    rendre(<BandeauDefi defi={{ ...defi, termine: true, semainesRestantes: 0 }} />);
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

describe('défi de la semaine', () => {
  it('annonce la contrainte dans le bandeau', () => {
    rendre(
      <BandeauDefi
        defi={{
          ...defi,
          date: '2026-S42',
          type: 'semaine',
          contrainte: { id: 'sans-emprunt', nom: 'Sans crédit', description: 'Aucun prêt.' },
        }}
      />,
    );
    expect(screen.getByRole('heading', { name: /Défi de la semaine — 2026-S42/ })).toBeTruthy();
    expect(screen.getByText(/Contrainte :/).textContent).toContain('Sans crédit');
  });
  it('se lance depuis l’écran de départ avec sa contrainte', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('radio', { name: /Défi de la semaine/ }));
    expect(screen.getByText(/Défi de la semaine \d{4}-S\d{2}/)).toBeTruthy();
    fireEvent.click(b);
    const bandeau = await screen.findByLabelText(/^Défi de la semaine \d{4}-S\d{2}$/);
    expect(bandeau.textContent).toContain('Contrainte :');
    expect(bandeau.textContent).toContain('Semaines restantes : 52');
  });
});

describe('validation du score', () => {
  it('rejoue la partie, valide le score et affiche le classement du jour', async () => {
    let envoyerMoteur: ((c: CommandeJeu) => Promise<unknown>) | null = null;
    function Sonde() {
      envoyerMoteur = useLabel().envoyer;
      return null;
    }
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Sonde />
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(screen.getByRole('radio', { name: /Défi du jour/ }));
    fireEvent.click(b);
    await screen.findByLabelText(/^Défi du \d{4}-\d{2}-\d{2}$/);
    await act(async () => {
      await envoyerMoteur?.({ type: 'avancer', semaines: 52, arretSurSignal: false });
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Valider mon score' }));
    await screen.findByText(/Score validé par rejeu/, undefined, { timeout: 5000 });
    expect((await screen.findByLabelText('Classement du jour')).querySelectorAll('li').length).toBe(
      1,
    );
  }, 20_000);
});
