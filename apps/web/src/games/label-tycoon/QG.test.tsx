// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueJeu } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { alertes, premiersPas, progressionObjectif } from './QG';

afterEach(cleanup);

const vue = (over: Partial<VueJeu> = {}): VueJeu =>
  ({
    semaine: 10,
    finances: {
      tresorerie: 100,
      valorisation: 0,
      termesValorisation: [],
      semainesNegatives: 0,
      faillite: false,
    },
    decisions: [],
    echeances: [],
    ...over,
  }) as VueJeu;

describe('alertes du QG', () => {
  it('ne signale rien quand tout va bien', () => {
    expect(alertes(vue())).toEqual([]);
  });
  it('signale la trésorerie négative, la faillite, les décisions et les fins de contrat proches', () => {
    expect(
      alertes(
        vue({
          finances: {
            tresorerie: -1,
            valorisation: 0,
            termesValorisation: [],
            semainesNegatives: 3,
            faillite: false,
          },
        }),
      )[0]?.texte,
    ).toContain('3 semaine');
    expect(
      alertes(
        vue({
          finances: {
            tresorerie: -1,
            valorisation: 0,
            termesValorisation: [],
            semainesNegatives: 8,
            faillite: true,
          },
        }),
      )[0]?.id,
    ).toBe('faillite');
    expect(alertes(vue({ decisions: [{} as never, {} as never] }))[0]).toMatchObject({
      id: 'decisions',
      ecran: 'boite',
    });
    const contrats = alertes(
      vue({
        echeances: [
          { type: 'contrat', artisteId: 1, nom: 'Zed', semaine: 12 },
          { type: 'contrat', artisteId: 2, nom: 'Loin', semaine: 40 },
          { type: 'projet', artisteId: 3, nom: 'Proj', semaine: 11 },
        ],
      }),
    );
    expect(contrats.map((a) => a.id)).toEqual(['contrat-1']);
  });
});

describe('progression des objectifs', () => {
  it('reste entre 0 et 1', () => {
    expect(
      progressionObjectif({ id: 1, kind: 'sortir', cible: 2, base: 1, progression: 2 } as never),
    ).toBe(0.5);
    expect(
      progressionObjectif({ id: 1, kind: 'sortir', cible: 2, base: 1, progression: 9 } as never),
    ).toBe(1);
    expect(
      progressionObjectif({
        id: 1,
        kind: 'tresorerie',
        cible: 200,
        base: 0,
        progression: 100,
      } as never),
    ).toBe(0.5);
    expect(
      progressionObjectif({
        id: 1,
        kind: 'tresorerie',
        cible: 200,
        base: 0,
        progression: -50,
      } as never),
    ).toBe(0);
  });
});

describe('QG dans la coquille', () => {
  it('affiche finances, échéances, objectifs et actus d’une nouvelle partie', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await screen.findByRole('heading', { name: 'Finances' });
    expect(screen.getByRole('heading', { name: 'Alertes' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Objectifs' })).toBeTruthy();
    expect(screen.getByText('Tout est calme. Aucune alerte.')).toBeTruthy();
  });
});

describe('premiers pas', () => {
  const base = (over: Partial<VueJeu> = {}): VueJeu =>
    ({ roster: [], suivis: [], projets: [], semaine: 0, ...over }) as unknown as VueJeu;

  it('suit les cinq gestes de base dans l’ordre', () => {
    expect(premiersPas(base()).map((e) => e.faite)).toEqual([false, false, false, false, false]);
    const suivi = premiersPas(base({ suivis: [{}] as VueJeu['suivis'] }));
    expect(suivi[0]?.faite).toBe(true);
    const sorti = premiersPas(
      base({
        roster: [{}] as VueJeu['roster'],
        projets: [{ statut: 'sortie' }] as VueJeu['projets'],
        semaine: 10,
      }),
    );
    expect(sorti.every((e) => e.faite)).toBe(true);
  });

  it('apparaît au QG d’une nouvelle carrière et mène au repérage', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: /Nouvelle partie/ });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await screen.findByRole('heading', { name: 'Premiers pas' });
    expect(screen.getByRole('progressbar', { name: 'Progression des premiers pas' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Aller repérer' }));
    await screen.findByRole('heading', { name: 'Repérage' });
  });
});
