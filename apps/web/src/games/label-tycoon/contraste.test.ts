import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Vitest se lance depuis apps/web.
const css = readFileSync(resolve(process.cwd(), 'src/styles/arcade/tokens.css'), 'utf8');

/** Valeurs des variables d'un bloc de tokens (`:root` ou thème sombre). */
function tokens(bloc: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const m of bloc.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g))
    out[m[1] ?? ''] = (m[2] ?? '').toLowerCase();
  return out;
}

const blocs = css.split(/\n(?=:root|@media)/);
const jour = tokens(blocs.find((b) => b.startsWith(':root {')) ?? '');
const nuit = {
  ...jour,
  ...tokens(blocs.find((b) => b.startsWith(":root[data-theme='dark']")) ?? ''),
};

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** Rapport de contraste WCAG entre deux couleurs. */
export const contraste = (a: string, b: string): number => {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (clair + 0.05) / (sombre + 0.05);
};

const AA_TEXTE = 4.5;

describe('contraste des couleurs (WCAG AA)', () => {
  it('lit bien les deux thèmes', () => {
    expect(jour['surface']).toBe('#ffffff');
    expect(nuit['surface']).toBe('#2e2275');
  });
  for (const [nom, t] of [
    ['jour', jour],
    ['nuit', nuit],
  ] as const) {
    it(`le texte reste lisible sur fond de page et de carte (thème ${nom})`, () => {
      for (const fond of ['surface', 'surface-2', 'sky-bottom', 'sky-top'] as const) {
        const f = t[fond] ?? '';
        // Le ciel du thème jour est un fond décoratif : le texte y est toujours posé sur une carte.
        if (nom === 'jour' && fond === 'sky-top') continue;
        expect(contraste(t['text'] ?? '', f), `texte sur ${fond}`).toBeGreaterThanOrEqual(AA_TEXTE);
      }
      for (const fond of ['surface', 'surface-2'] as const)
        for (const texte of ['text-soft', 'green-text', 'red-text'] as const)
          expect(
            contraste(t[texte] ?? '', t[fond] ?? ''),
            `${texte} sur ${fond}`,
          ).toBeGreaterThanOrEqual(AA_TEXTE);
    });
  }
  it('le texte des boutons colorés est lisible (foncé ou blanc selon la couleur)', () => {
    const outline = jour['outline'] ?? '';
    const fonds: Record<string, 'sombre' | 'blanc'> = {
      gold: 'sombre',
      green: 'sombre',
      blue: 'sombre',
      orange: 'sombre',
      pink: 'sombre',
      teal: 'sombre',
      red: 'blanc',
      purple: 'blanc',
    };
    for (const [nom, texte] of Object.entries(fonds))
      expect(
        contraste(texte === 'blanc' ? '#ffffff' : outline, jour[nom] ?? ''),
        `${nom}`,
      ).toBeGreaterThanOrEqual(AA_TEXTE);
  });
});
