import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ECRANS } from './ecrans';

const guide = readFileSync(
  resolve(process.cwd(), '../../docs/games/label-tycoon/guide.md'),
  'utf8',
);

describe('guide du joueur : écrans', () => {
  it('décrit chaque écran du jeu', () => {
    for (const e of ECRANS) expect(guide, e.titre).toContain(`**${e.titre}**`);
  });
});
