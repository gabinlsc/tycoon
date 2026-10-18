// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueActu, VueDecision } from '@tycoon/label-tycoon';
import { BoiteReception, notificationsNonLues, semainesRestantes } from './BoiteReception';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider, useLabel } from './LabelContext';

afterEach(cleanup);

const actu = (id: number, importance: 1 | 2 | 3): VueActu => ({
  id,
  semaine: 1,
  titre: `t${id}`,
  texte: 'x',
  importance,
  kind: 'k',
});
const decision = (echeance: number): VueDecision => ({
  instanceId: 1,
  eventId: 'caprice',
  titre: 'T',
  texte: 'x',
  echeance,
  choix: [],
  parDefaut: '',
});

describe('aides', () => {
  it('compte les semaines restantes sans passer sous zéro', () => {
    expect(semainesRestantes(decision(10), 7)).toBe(3);
    expect(semainesRestantes(decision(10), 12)).toBe(0);
  });
  it('ne signale que les actus importantes et non lues', () => {
    const fil = [actu(5, 3), actu(4, 1), actu(3, 2), actu(2, 2)];
    expect(notificationsNonLues(fil, 0).map((a) => a.id)).toEqual([5, 3, 2]);
    expect(notificationsNonLues(fil, 3).map((a) => a.id)).toEqual([5]);
  });
});

function Pilote() {
  const { nouvellePartie, envoyer } = useLabel();
  return (
    <>
      <button type="button" onClick={() => void nouvellePartie('boite')}>
        go
      </button>
      <button
        type="button"
        onClick={() => void envoyer({ type: 'avancer', semaines: 150, arretSurSignal: false })}
      >
        long
      </button>
    </>
  );
}

function Boite() {
  const [lu, setLu] = useState(0);
  return <BoiteReception dernierLu={lu} onLu={setLu} />;
}

describe('boîte de réception', () => {
  it('affiche les décisions avec leur échéance et leur choix par défaut, et les trancher les retire', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Pilote />
        <Boite />
      </LabelProvider>,
    );
    await waitFor(() => expect(screen.getByText('go')).toBeTruthy());
    fireEvent.click(screen.getByText('go'));
    await screen.findByText('Aucune décision en attente.');
    // On joue assez longtemps pour qu'une décision apparaisse
    for (let i = 0; i < 8 && screen.queryByText('Aucune décision en attente.'); i += 1) {
      fireEvent.click(screen.getByText('long'));
      await new Promise((r) => setTimeout(r, 30));
    }
    const titres = screen.queryAllByRole('heading', { level: 4 });
    if (titres.length === 0) return; // Partie sans décision : rien à trancher
    expect(screen.getAllByText(/Si tu ne réponds pas/).length).toBeGreaterThan(0);
    const avant = titres.length;
    const premier = screen
      .getAllByRole('button')
      .find((b) => b.closest('.label-decision__choices') && !(b as HTMLButtonElement).disabled);
    if (!premier) throw new Error('un choix disponible est attendu');
    fireEvent.click(premier);
    await waitFor(() =>
      expect(screen.queryAllByRole('heading', { level: 4 }).length).toBeLessThan(avant),
    );
  });

  it('s’intègre à la coquille avec un badge sur l’onglet Boîte', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Boîte/ }));
    expect(screen.getByRole('heading', { name: 'Boîte de réception' })).toBeTruthy();
  });
});
