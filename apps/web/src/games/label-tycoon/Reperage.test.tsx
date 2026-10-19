// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SCOUTING } from '@tycoon/label-tycoon';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueSuivi } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { allerAEcran } from './testNavigation';
import { Fourchette, incertitude } from './Reperage';

afterEach(cleanup);

describe('fourchette', () => {
  it('annonce la plage connue aux lecteurs d’écran, sans jamais afficher une valeur exacte', () => {
    render(<Fourchette libelle="Plume" plage={[40, 60]} />);
    expect(screen.getByRole('img', { name: 'Plume : entre 40 et 60' })).toBeTruthy();
  });
  it('mesure l’incertitude moyenne des fourchettes', () => {
    const s = { fourchettes: { plume: [40, 60], flow: [10, 50] } } as unknown as VueSuivi;
    expect(incertitude(s)).toBe(30);
    expect(incertitude({ fourchettes: {} } as unknown as VueSuivi)).toBe(100);
  });
});

async function ouvrir() {
  render(
    <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
      <Coquille />
    </LabelProvider>,
  );
  const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(b);
  await allerAEcran(/Repérage/);
}

describe('écran Repérage', () => {
  it('propose les quatre sources, lance une session gratuite et liste les talents suivis', async () => {
    await ouvrir();
    expect(screen.getAllByRole('button', { name: 'Lancer une session' })).toHaveLength(4);
    expect(screen.getByText('Aucun talent suivi. Lance une session de repérage.')).toBeTruthy();
    const gratuit = screen.getByText('Candidatures spontanées').closest('li') as HTMLElement;
    fireEvent.click(gratuit.querySelector('button') as HTMLElement);
    await waitFor(() =>
      expect(document.querySelectorAll('.label-prospect').length).toBeGreaterThan(0),
    );
    const premier = document.querySelector('.label-prospect') as HTMLElement;
    expect(premier.querySelectorAll('[role="img"]').length).toBe(5);
    expect(premier.textContent).toContain('restent cachés');
  });

  it('révèle les attributs cachés par un essai payant, puis permet d’abandonner un suivi', async () => {
    await ouvrir();
    const gratuit = screen.getByText('Candidatures spontanées').closest('li') as HTMLElement;
    fireEvent.click(gratuit.querySelector('button') as HTMLElement);
    await waitFor(() =>
      expect(document.querySelectorAll('.label-prospect').length).toBeGreaterThan(0),
    );
    const avant = document.querySelectorAll('.label-prospect').length;
    fireEvent.click(screen.getAllByRole('button', { name: /Essai en studio/ })[0] as HTMLElement);
    await waitFor(() => expect(screen.getAllByText(/Attributs cachés révélés/).length).toBe(1));
    fireEvent.click(screen.getAllByRole('button', { name: 'Abandonner' })[0] as HTMLElement);
    await waitFor(() =>
      expect(document.querySelectorAll('.label-prospect').length).toBe(avant - 1),
    );
    expect(SCOUTING.maxFollowed).toBeGreaterThan(avant);
  });
});
