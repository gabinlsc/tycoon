// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BarreTemps } from './BarreTemps';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider, useLabel } from './LabelContext';

function Semaine() {
  const { vue } = useLabel();
  return <p data-testid="semaine">{vue?.semaine ?? -1}</p>;
}

function Demarrer() {
  const { nouvellePartie } = useLabel();
  return (
    <button type="button" onClick={() => void nouvellePartie('temps')}>
      go
    </button>
  );
}

async function lancer() {
  render(
    <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
      <Demarrer />
      <Semaine />
      <BarreTemps />
    </LabelProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
  await act(async () => {
    fireEvent.click(screen.getByText('go'));
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const semaine = () => Number(screen.getByTestId('semaine').textContent);

describe('barre de temps', () => {
  it('démarre en pause, avance d’une semaine au clic', async () => {
    await lancer();
    expect(semaine()).toBe(0);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Semaine/ }));
    });
    expect(semaine()).toBe(1);
  });

  it('joue à la vitesse choisie, puis s’arrête en pause', async () => {
    await lancer();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '×4' }));
    });
    for (let i = 0; i < 4; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250);
      });
    }
    expect(semaine()).toBeGreaterThanOrEqual(3);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    });
    const arret = semaine();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(semaine()).toBe(arret);
  });

  it('se commande au clavier : espace pour lancer ou arrêter, N pour une semaine', async () => {
    await lancer();
    await act(async () => {
      fireEvent.keyDown(window, { key: 'n' });
    });
    expect(semaine()).toBe(1);
    await act(async () => {
      fireEvent.keyDown(window, { key: ' ' });
    });
    expect(screen.getByRole('button', { name: '×1' }).getAttribute('aria-pressed')).toBe('true');
    await act(async () => {
      fireEvent.keyDown(window, { key: ' ' });
    });
    expect(screen.getByRole('button', { name: 'Pause' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('mémorise les réglages d’auto-pause', async () => {
    await lancer();
    fireEvent.click(screen.getByLabelText('Décision à prendre'));
    expect(
      JSON.parse(window.localStorage.getItem('tycoon:label:auto-pauses') ?? '{}').decision,
    ).toBe(false);
  });
});
