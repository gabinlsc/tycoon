// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GLOSSAIRE } from '@tycoon/label-tycoon';
import { Infobulle, InfobulleCalcul, Terme, partsAbsolues } from './Infobulle';

afterEach(cleanup);

describe('infobulle', () => {
  it('s’ouvre au focus et se ferme avec Échap, en restant reliée au déclencheur', () => {
    render(<Infobulle contenu="explication">Mot</Infobulle>);
    const bouton = screen.getByRole('button', { name: 'Mot' });
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.focus(bouton);
    const bulle = screen.getByRole('tooltip');
    expect(bouton.getAttribute('aria-describedby')).toBe(bulle.id);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('s’ouvre au survol et au clic', () => {
    render(<Infobulle contenu="x">Mot</Infobulle>);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});

describe('glossaire', () => {
  it('affiche la définition d’un terme connu, et le texte brut sinon', () => {
    render(
      <>
        <Terme id="hype" />
        <Terme id="inconnu">brut</Terme>
      </>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Hype' }));
    expect(screen.getByRole('tooltip').textContent).toContain(GLOSSAIRE['hype']?.definition ?? '');
    expect(screen.getByText('brut')).toBeTruthy();
  });
  it('définit chaque notion avec un terme et une définition non vides', () => {
    for (const [id, e] of Object.entries(GLOSSAIRE)) {
      expect(e.terme.length, id).toBeGreaterThan(1);
      expect(e.definition.length, id).toBeGreaterThan(20);
    }
  });
});

describe('infobulle de calcul', () => {
  it('liste les termes traduits avec leur contribution signée', () => {
    render(
      <InfobulleCalcul
        argent
        termes={[
          { cle: 'tresorerie', contribution: 1_000_000 },
          { cle: 'dettes', contribution: -250_000 },
        ]}
      >
        Valeur
      </InfobulleCalcul>,
    );
    fireEvent.focus(screen.getByRole('button'));
    const bulle = screen.getByRole('tooltip');
    expect(bulle.textContent).toContain('Trésorerie');
    expect(bulle.textContent).toContain('Dettes');
    expect(bulle.textContent).toMatch(/\+10\s?000\s€/);
    expect(bulle.textContent).toMatch(/-2\s?500\s€/);
  });
  it('calcule des parts qui totalisent 1 (ou 0 sans contribution)', () => {
    const parts = partsAbsolues([
      { cle: 'a', contribution: 30 },
      { cle: 'b', contribution: -10 },
    ]);
    expect(parts[0]).toBeCloseTo(0.75);
    expect(parts.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(partsAbsolues([{ cle: 'a', contribution: 0 }])).toEqual([0]);
  });
});
