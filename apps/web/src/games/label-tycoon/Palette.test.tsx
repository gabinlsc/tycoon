import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Palette } from './Palette';

afterEach(cleanup);

describe('Palette de commandes', () => {
  it('filtre les écrans et ouvre celui choisi avec Entrée', () => {
    const ouvrir = vi.fn();
    const fermer = vi.fn();
    render(<Palette fermer={fermer} ouvrir={ouvrir} estFerme={() => false} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Aller à un écran' }), {
      target: { value: 'finance' },
    });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(ouvrir).toHaveBeenCalledWith('finances');
    expect(fermer).toHaveBeenCalled();
  });

  it('refuse un écran verrouillé', () => {
    const ouvrir = vi.fn();
    render(<Palette fermer={vi.fn()} ouvrir={ouvrir} estFerme={() => true} />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(ouvrir).not.toHaveBeenCalled();
  });

  it('se ferme avec Échap', () => {
    const fermer = vi.fn();
    render(<Palette fermer={fermer} ouvrir={vi.fn()} estFerme={() => false} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(fermer).toHaveBeenCalled();
  });
});
