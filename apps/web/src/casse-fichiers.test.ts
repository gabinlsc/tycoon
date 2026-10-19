import { readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Tous les fichiers sources (.ts, .tsx) sous un dossier. */
function sources(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return sources(chemin);
    return /\.tsx?$/.test(nom) ? [chemin] : [];
  });
}

describe('noms de fichiers', () => {
  it('ne diffèrent jamais seulement par la casse (Windows et macOS confondraient les imports)', () => {
    const parBase = new Map<string, string[]>();
    for (const f of sources(resolve(process.cwd(), 'src'))) {
      const base = f.replace(/\.tsx?$/, '').toLowerCase();
      parBase.set(base, [...(parBase.get(base) ?? []), f]);
    }
    const collisions = [...parBase.values()].filter((l) => l.length > 1);
    expect(collisions).toEqual([]);
  });
});
