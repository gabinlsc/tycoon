// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { NOMS_DE_LABEL } from './NouvellePartie';

afterEach(cleanup);

async function ouvrir() {
  render(
    <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
      <Coquille />
    </LabelProvider>,
  );
  const b = await screen.findByRole('button', { name: /Nouvelle partie/ });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  return b;
}

describe('écran de lancement', () => {
  it('propose six modes en cartes, la carrière choisie par défaut', async () => {
    await ouvrir();
    expect(
      screen.getAllByRole('radio', { checked: true }).map((r) => r.closest('label')?.textContent),
    ).toEqual(expect.arrayContaining([expect.stringContaining('Carrière')]));
    for (const m of ['Tutoriel', 'Scénarios', 'Défi du jour', 'Défi de la semaine', 'Bac à sable'])
      expect(screen.getByRole('radio', { name: new RegExp(m) })).toBeTruthy();
    expect(screen.getByText('Nouveau ? Commence ici')).toBeTruthy();
  });

  it('adapte le panneau au mode choisi', async () => {
    await ouvrir();
    fireEvent.click(screen.getByRole('radio', { name: /Tutoriel/ }));
    expect(screen.getByRole('heading', { name: /Tutoriel/ })).toBeTruthy();
    expect(screen.queryByLabelText('Nom de ton label')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: /Bac à sable/ }));
    expect(screen.getByText('Argent illimité')).toBeTruthy();
  });

  it('le dé propose un nom de label, et la partie démarre sous ce nom', async () => {
    const b = await ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer un nom au hasard' }));
    const champ = screen.getByLabelText('Nom de ton label') as HTMLInputElement;
    expect(NOMS_DE_LABEL as readonly string[]).toContain(champ.value);
    fireEvent.change(champ, { target: { value: 'Velours Records' } });
    fireEvent.click(b);
    await waitFor(() =>
      expect(document.querySelector('.label-bar__name')?.textContent).toBe('Velours Records'),
    );
  });
});
