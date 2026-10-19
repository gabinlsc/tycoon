// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { VueSucces } from '@tycoon/label-tycoon';
import { Coquille } from './Coquille';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';
import { allerAEcran } from './testNavigation';
import { avancement, filtrerSucces, formaterValeur } from './Succes';

afterEach(cleanup);

const succes = (
  id: string,
  obtenu: boolean,
  seuil = 10,
  valeur = 0,
  unite = 'nombre',
): VueSucces => ({
  id,
  titre: id,
  description: '',
  unite,
  seuil,
  obtenu,
  valeur,
});

describe('aides des succès', () => {
  it('filtre et place les obtenus en premier', () => {
    const l = [succes('a', false), succes('b', true), succes('c', false)];
    expect(filtrerSucces(l, 'obtenus').map((s) => s.id)).toEqual(['b']);
    expect(filtrerSucces(l, 'restants').map((s) => s.id)).toEqual(['a', 'c']);
    expect(filtrerSucces(l, 'tous').map((s) => s.id)).toEqual(['b', 'a', 'c']);
  });
  it('calcule l’avancement, y compris pour un rang', () => {
    expect(avancement(succes('a', false, 10, 4))).toBeCloseTo(0.4);
    expect(avancement(succes('a', true))).toBe(1);
    expect(avancement(succes('r', false, 10, 40, 'rang'))).toBeCloseTo(0.25);
    expect(avancement(succes('r', false, 10, 0, 'rang'))).toBe(0);
  });
  it('formate les valeurs selon l’unité', () => {
    expect(formaterValeur({ unite: 'rang', valeur: 0 })).toBe('aucune place');
    expect(formaterValeur({ unite: 'rang', valeur: 3 })).toBe('n° 3');
    expect(formaterValeur({ unite: 'palier', valeur: 0 })).toBe('palier 1');
  });
});

describe('écran Succès', () => {
  it('compte les succès et liste les records', async () => {
    render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    await allerAEcran(/Succès/);
    await screen.findByRole('heading', { name: 'Succès' });
    expect(screen.getByText(/succès obtenus/)).toBeTruthy();
    expect(document.querySelectorAll('.lt-succes').length).toBeGreaterThanOrEqual(50);
  });
});
