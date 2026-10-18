// @vitest-environment jsdom
import axe from 'axe-core';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { ECRANS } from './ecrans';
import { creerMoteurLocal } from './engine/local';
import { LabelProvider } from './LabelContext';

afterEach(cleanup);

/** Violations d'accessibilité d'un document (le contraste se vérifie à part : jsdom n'a pas de rendu). */
async function violations(racine: HTMLElement): Promise<string[]> {
  const r = await axe.run(racine, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  return r.violations.map(
    (v) => `${v.id} : ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(' ; ')})`,
  );
}

describe('le contrôle d’accessibilité détecte bien les défauts', () => {
  it('signale un bouton sans nom et une image sans texte alternatif', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<button></button><img src="x.png">';
    document.body.append(div);
    const trouves = await violations(div);
    div.remove();
    expect(trouves.some((v) => v.startsWith('button-name'))).toBe(true);
    expect(trouves.some((v) => v.startsWith('image-alt'))).toBe(true);
  });
});

describe('accessibilité des écrans', () => {
  it('n’a aucune violation détectable sur l’écran de départ', async () => {
    const { container } = render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    await screen.findByRole('button', { name: 'Nouvelle partie' });
    expect(await violations(container)).toEqual([]);
  });

  it('n’a aucune violation détectable sur aucun écran du jeu', async () => {
    const { container } = render(
      <LabelProvider fabrique={() => Promise.resolve(creerMoteurLocal())}>
        <Coquille />
      </LabelProvider>,
    );
    const b = await screen.findByRole('button', { name: 'Nouvelle partie' });
    await waitFor(() => expect((b as HTMLButtonElement).disabled).toBe(false));
    fireEvent.click(b);
    const nav = await screen.findByRole('navigation', { name: 'Écrans du jeu' });
    const trouves: string[] = [];
    for (const ecran of ECRANS) {
      const bouton = within(nav)
        .getAllByRole('button')
        .find((x) => x.textContent?.includes(ecran.titre));
      if (!bouton) {
        trouves.push(`écran « ${ecran.titre} » absent de la navigation`);
        continue;
      }
      fireEvent.click(bouton);
      await waitFor(() => expect(bouton.getAttribute('aria-current')).toBe('page'));
      for (const v of await violations(container)) trouves.push(`${ecran.titre} — ${v}`);
    }
    expect(trouves).toEqual([]);
  }, 120_000);
});
