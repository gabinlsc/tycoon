// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VueActu, VueDecision, VueJeu } from '@tycoon/label-tycoon';
import {
  DUREE_NOTIFICATION,
  NOTIFICATIONS_MAX,
  Notifications,
  nouvellesNotifications,
} from './Notifications';

const actu = (id: number, kind = 'sortie', importance: 1 | 2 | 3 = 2): VueActu => ({
  id,
  semaine: 1,
  titre: `Actu ${id}`,
  texte: 'Texte',
  importance,
  kind,
});
const decision = (instanceId: number): VueDecision => ({
  instanceId,
  eventId: 'caprice',
  titre: `Décision ${instanceId}`,
  texte: '',
  echeance: 4,
  choix: [],
  parDefaut: '',
});
type V = Pick<VueJeu, 'fil' | 'decisions'>;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('nouvelles notifications', () => {
  it('ne garde que les actus importantes et nouvelles, et les décisions apparues', () => {
    const n = nouvellesNotifications(
      { actu: 5, decisions: new Set([1]) },
      {
        fil: [actu(7, 'certification'), actu(6, 'x', 1), actu(4)],
        decisions: [decision(1), decision(2)],
      },
    );
    expect(n.map((x) => x.id)).toEqual(['decision-2', 'actu-7']);
    expect(n[1]?.ton).toBe('or');
  });
});

describe('notifications à l’écran', () => {
  it('surgissent quand la vue change, mènent à l’écran, puis disparaissent seules', () => {
    const allerA = vi.fn();
    const vide: V = { fil: [actu(1)], decisions: [] };
    const { rerender } = render(<Notifications vue={vide} allerA={allerA} />);
    expect(screen.queryByText('Actu 1')).toBeNull(); // l'historique n'est pas rejoué
    rerender(
      <Notifications
        vue={{ fil: [actu(2, 'certification'), actu(1)], decisions: [] }}
        allerA={allerA}
      />,
    );
    expect(screen.getByText('Actu 2')).toBeTruthy();
    act(() => vi.advanceTimersByTime(DUREE_NOTIFICATION + 10));
    expect(screen.queryByText('Actu 2')).toBeNull();
    rerender(
      <Notifications
        vue={{ fil: [actu(3), actu(2), actu(1)], decisions: [decision(9)] }}
        allerA={allerA}
      />,
    );
    fireEvent.click(screen.getByText('Décision 9'));
    expect(allerA).toHaveBeenCalledWith('boite');
  });

  it('n’en montre jamais plus que le maximum', () => {
    const { rerender } = render(
      <Notifications vue={{ fil: [], decisions: [] }} allerA={() => undefined} />,
    );
    const fil = Array.from({ length: 6 }, (_, i) => actu(10 - i));
    rerender(<Notifications vue={{ fil, decisions: [] }} allerA={() => undefined} />);
    expect(document.querySelectorAll('.lt-toast')).toHaveLength(NOTIFICATIONS_MAX);
  });
});
