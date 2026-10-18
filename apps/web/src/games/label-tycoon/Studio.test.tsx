// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LabelPilot } from '@tycoon/label-tycoon';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import type { MoteurLabel } from './engine/protocol';
import { LabelProvider } from './LabelContext';
import { Console } from './Studio';

afterEach(cleanup);

function moteurAvecRoster(): MoteurLabel {
  const source = new LabelPilot();
  source.handle({ type: 'nouvelle-partie', graine: 'studio' });
  source.handle({ type: 'action', action: { type: 'reperer', source: 'plateforme' } });
  const save = source.handle({ type: 'sauvegarder' });
  if (save.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
  const s = JSON.parse(save.sauvegarde) as {
    engine: { data: { artistes: { id: number; employeur: string }[] } };
  };
  const a = s.engine.data.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = 'joueur';
  const pilote = new LabelPilot();
  pilote.handle({ type: 'charger', sauvegarde: JSON.stringify(s) });
  return {
    envoyer: (c) =>
      Promise.resolve(pilote.handle(c.type === 'nouvelle-partie' ? { type: 'vue' } : c)),
    arreter: () => undefined,
  };
}

describe('console au trait', () => {
  it('place les faders selon les valeurs et reste décorative', () => {
    const { container } = render(
      <Console
        reglages={[
          { nom: 'A', valeur: 0 },
          { nom: 'B', valeur: 100 },
          { nom: 'C', valeur: 500 },
        ]}
      />,
    );
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    const ys = [...container.querySelectorAll('rect')]
      .slice(1)
      .map((r) => Number(r.getAttribute('y')));
    expect(ys[0]).toBeGreaterThan(ys[1] as number);
    expect(ys[1]).toBe(ys[2]);
    expect(container.innerHTML).not.toMatch(/NaN/);
  });
});

describe('écran Studio', () => {
  it('invite à signer un artiste quand le roster est vide', async () => {
    const vide = new LabelPilot();
    render(
      <LabelProvider
        fabrique={() =>
          Promise.resolve({
            envoyer: (c) => Promise.resolve(vide.handle(c)),
            arreter: () => undefined,
          })
        }
      >
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Studio/ }));
    expect(screen.getByText(/Signe d’abord un artiste/)).toBeTruthy();
  });

  it('estime la qualité en fourchette, lance une production et la liste', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(moteurAvecRoster())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    fireEvent.click(await screen.findByRole('button', { name: /Studio/ }));
    await screen.findByText(/jamais une valeur exacte/);
    expect(screen.getByText(/Aucun projet pour l’instant/)).toBeTruthy();
    const lancer = screen.getByRole('button', {
      name: 'Lancer la production',
    }) as HTMLButtonElement;
    await waitFor(() => expect(lancer.disabled).toBe(false));
    fireEvent.click(lancer);
    await waitFor(() => expect(document.querySelectorAll('.label-projects li').length).toBe(1));
    expect(screen.getByText(/fin prévue semaine/)).toBeTruthy();
  });
});
