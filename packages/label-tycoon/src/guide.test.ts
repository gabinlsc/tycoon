import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GLOSSAIRE } from './index';

const CHEMIN = resolve(process.cwd(), '../../docs/games/label-tycoon/guide.md');
const DEBUT = '<!-- glossaire:début -->';
const FIN = '<!-- glossaire:fin -->';

/** Le glossaire du guide, tel que le code le définit (même texte que les infobulles du jeu). */
function glossaireMarkdown(): string {
  return Object.values(GLOSSAIRE)
    .map((e) => `- **${e.terme}** : ${e.definition}`)
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .join('\n');
}

describe('guide du joueur', () => {
  it('reprend fidèlement le glossaire du jeu (UPDATE_GUIDE=1 pour le régénérer)', () => {
    const texte = readFileSync(CHEMIN, 'utf8');
    const a = texte.indexOf(DEBUT);
    const b = texte.indexOf(FIN);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    const attendu = `${DEBUT}\n\n${glossaireMarkdown()}\n\n${FIN}`;
    if (process.env['UPDATE_GUIDE'] === '1')
      writeFileSync(CHEMIN, texte.slice(0, a) + attendu + texte.slice(b + FIN.length));
    else expect(texte.slice(a, b + FIN.length)).toBe(attendu);
  });

  it('a un glossaire d’au moins trente notions', () => {
    expect(Object.keys(GLOSSAIRE).length).toBeGreaterThanOrEqual(30);
  });
});
