// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccountProvider, useAccount } from '../../accounts/AccountContext';
import { LabelPilot } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { Persistance } from './Persistance';
import { exporterFichier } from './sauvegardes/fichier';
import { PERIODE_AUTO, resumeSauvegarde, sauvegardeAutoDue } from './sauvegardes/regles';
import { type SauvegardeLabel, creerStockageMemoire } from './sauvegardes/stockage';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

function Compte() {
  const { createAccount, status } = useAccount();
  return (
    <button type="button" onClick={() => void createAccount('Testeur')} disabled={status === 'in'}>
      creer
    </button>
  );
}

function Jeu({ stockage }: { stockage: ReturnType<typeof creerStockageMemoire> }) {
  return (
    <MemoryRouter>
      <AccountProvider>
        <Compte />
        <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
          <Persistance stockage={stockage} />
          <Coquille />
        </LabelProvider>
      </AccountProvider>
    </MemoryRouter>
  );
}

async function demarrer() {
  const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
  await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(b);
  await screen.findByRole('navigation', { name: 'Écrans du jeu' });
}

async function connecter() {
  fireEvent.click(await screen.findByText('creer'));
  await waitFor(() => expect((screen.getByText('creer') as HTMLButtonElement).disabled).toBe(true));
}

describe('règles de sauvegarde', () => {
  it('sauvegarde automatiquement toutes les 4 semaines, une seule fois par semaine', () => {
    expect(PERIODE_AUTO).toBe(4);
    expect(sauvegardeAutoDue(0, -1)).toBe(false);
    expect(sauvegardeAutoDue(3, -1)).toBe(false);
    expect(sauvegardeAutoDue(4, -1)).toBe(true);
    expect(sauvegardeAutoDue(4, 4)).toBe(false);
    expect(sauvegardeAutoDue(8, 4)).toBe(true);
  });
  it('résume une sauvegarde', () => {
    const s: SauvegardeLabel = {
      version: 1,
      sauvegarde: '{}',
      semaine: 12,
      label: 'Neon',
      palier: 'Home-studio',
      tresorerie: 2_500_000,
      enregistreLe: '',
    };
    expect(resumeSauvegarde(s).replace(/\s/g, ' ')).toBe(
      'Neon · semaine 12 · Home-studio · 25 000 €',
    );
  });
});

describe('sauvegarde de la partie', () => {
  it('prévient quand il n’y a pas de compte', async () => {
    render(<Jeu stockage={creerStockageMemoire()} />);
    expect(await screen.findByText(/pour que ta partie soit sauvegardée/)).toBeTruthy();
    await demarrer();
    expect(screen.getByText(/ne sera pas sauvegardée/)).toBeTruthy();
  });

  it('enregistre dans un emplacement manuel puis le recharge après une reprise', async () => {
    const stockage = creerStockageMemoire();
    const premier = render(<Jeu stockage={stockage} />);
    await connecter();
    await demarrer();
    fireEvent.click(screen.getByText('Sauvegardes'));
    fireEvent.click(await screen.findByRole('button', { name: /Sauvegarder dans emplacement 2/ }));
    await screen.findByText('Emplacement 2 enregistrée.');
    premier.unmount();

    render(<Jeu stockage={stockage} />);
    const charger = await screen.findByRole(
      'button',
      { name: /Charger emplacement 2/ },
      { timeout: 3000 },
    );
    fireEvent.click(charger);
    await screen.findByRole('navigation', { name: 'Écrans du jeu' });
    expect(screen.getByLabelText('Trésorerie')).toBeTruthy();
  });

  it('crée la sauvegarde automatique à la quatrième semaine', async () => {
    const stockage = creerStockageMemoire();
    render(<Jeu stockage={stockage} />);
    await connecter();
    await demarrer();
    for (let i = 0; i < PERIODE_AUTO; i += 1) {
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Semaine ▶/ }));
        await new Promise((r) => setTimeout(r, 150));
      });
    }
    await screen.findByText(/Sauvegarde automatique \(semaine 4\)/, undefined, { timeout: 4000 });
  }, 20_000);

  it('efface un emplacement manuel', async () => {
    const stockage = creerStockageMemoire();
    render(<Jeu stockage={stockage} />);
    await connecter();
    await demarrer();
    fireEvent.click(screen.getByText('Sauvegardes'));
    fireEvent.click(await screen.findByRole('button', { name: /Sauvegarder dans emplacement 1/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Effacer emplacement 1/ }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Effacer emplacement 1/ })).toBeNull(),
    );
  });

  it('demande confirmation avant de recommencer', async () => {
    render(<Jeu stockage={creerStockageMemoire()} />);
    await connecter();
    await demarrer();
    fireEvent.click(screen.getByText('Sauvegardes'));
    fireEvent.click(await screen.findByRole('button', { name: 'Recommencer' }));
    expect(screen.getByRole('button', { name: 'Oui, recommencer une partie' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByRole('button', { name: 'Recommencer' })).toBeTruthy();
  });

  it('importe un fichier valide puis le charge', async () => {
    const pilote = new LabelPilot();
    pilote.handle({ type: 'nouvelle-partie', graine: 'import' });
    const r = pilote.handle({ type: 'sauvegarder' });
    if (r.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
    const texte = exporterFichier({
      version: 1,
      sauvegarde: r.sauvegarde,
      semaine: 0,
      label: 'Importé',
      palier: '',
      tresorerie: 0,
      enregistreLe: '',
    });
    render(<Jeu stockage={creerStockageMemoire()} />);
    await connecter();
    fireEvent.click(await screen.findByText('Reprendre ou importer une partie'));
    const champ = (await screen.findByLabelText(
      /Importer un fichier dans emplacement 1/,
    )) as HTMLInputElement;
    fireEvent.change(champ, {
      target: { files: [new File([texte], 'partie.json', { type: 'application/json' })] },
    });
    await screen.findByText(/Partie importée dans emplacement 1/);
    fireEvent.click(await screen.findByRole('button', { name: /Charger emplacement 1/ }));
    await screen.findByRole('navigation', { name: 'Écrans du jeu' });
  });

  it('refuse un fichier abîmé sans bloquer la partie', async () => {
    render(<Jeu stockage={creerStockageMemoire()} />);
    await connecter();
    await demarrer();
    fireEvent.click(screen.getByText('Sauvegardes'));
    const champ = (await screen.findByLabelText(
      /Importer un fichier dans emplacement 3/,
    )) as HTMLInputElement;
    const fichier = new File(['{ pas du json'], 'abime.json', { type: 'application/json' });
    fireEvent.change(champ, { target: { files: [fichier] } });
    await screen.findByText(/Import refusé : ce fichier n’est pas du JSON valide/);
    expect(screen.getByLabelText('Trésorerie')).toBeTruthy();
  });

  it('signale un emplacement corrompu sans toucher à la partie en cours', async () => {
    const base = creerStockageMemoire();
    // Même stockage, mais ce que l'on relit est tronqué : comme un fichier abîmé sur disque.
    const abime: typeof base = {
      ...base,
      lister: async (compte) => {
        const out = await base.lister(compte);
        for (const s of Object.values(out)) s.sauvegarde = s.sauvegarde.slice(0, 50);
        return out;
      },
    };
    render(<Jeu stockage={abime} />);
    await connecter();
    await demarrer();
    fireEvent.click(screen.getByText('Sauvegardes'));
    fireEvent.click(await screen.findByRole('button', { name: /Sauvegarder dans emplacement 1/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Charger emplacement 1/ }));
    await screen.findByText(/Emplacement 1 est illisible/);
    expect(screen.getByLabelText('Trésorerie')).toBeTruthy();
  });
});
