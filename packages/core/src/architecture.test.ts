import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Garde-fou d'architecture. La règle ESLint interdit déjà ces usages, ce test les vérifie
 * indépendamment du lint (une désactivation locale d'une règle ne passerait pas ici).
 *
 * Règle : `core` et `label-tycoon` sont de la simulation pure. Pas de hasard ni d'horloge,
 * pas de DOM, pas de React.
 */
const PACKAGES_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REPO_ROOT = join(PACKAGES_DIR, '..');
const SIMULATION_PACKAGES = ['core', 'label-tycoon'];

const FORBIDDEN: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Math.random', pattern: /\bMath\.random\b/ },
  { label: 'Date.now', pattern: /\bDate\.now\b/ },
  { label: 'new Date', pattern: /\bnew\s+Date\b/ },
  { label: 'Date()', pattern: /(^|[^.\w])Date\s*\(/ },
  { label: 'performance', pattern: /\bperformance\./ },
  { label: 'crypto', pattern: /\bcrypto\.(getRandomValues|randomUUID|subtle)\b/ },
  { label: 'window', pattern: /\bwindow\./ },
  { label: 'document', pattern: /\bdocument\./ },
  { label: 'localStorage', pattern: /\b(localStorage|sessionStorage|indexedDB)\b/ },
  { label: 'navigator', pattern: /\bnavigator\./ },
  { label: 'import react', pattern: /from\s+['"]react(-dom|-router[\w-]*)?(\/[\w-]+)*['"]/ },
  { label: 'import node', pattern: /from\s+['"](node:[\w/]+|fs|path|os)['"]/ },
];

function sourceFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return []; // le paquet n'existe pas encore
  }
  return entries.flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return full.endsWith('.ts') && !full.endsWith('.test.ts') ? [full] : [];
  });
}

/** Retire les commentaires : on peut écrire « Math.random est interdit » dans une doc. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

describe('architecture : simulation pure', () => {
  const files = SIMULATION_PACKAGES.flatMap((pkg) => sourceFiles(join(PACKAGES_DIR, pkg, 'src')));

  it('trouve du code à vérifier', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const { label, pattern } of FORBIDDEN) {
    it(`n'utilise jamais ${label}`, () => {
      const offenders = files
        .filter((file) => pattern.test(stripComments(readFileSync(file, 'utf8'))))
        .map((file) => relative(REPO_ROOT, file));
      expect(offenders).toEqual([]);
    });
  }

  it("détecte bien une violation (le garde-fou n'est pas aveugle)", () => {
    const bad = 'const x = Math.random(); // Date.now()';
    expect(FORBIDDEN.some((f) => f.pattern.test(stripComments(bad)))).toBe(true);
    const commentOnly = '// interdit : Math.random et new Date()\n/* window.alert */ const y = 1;';
    expect(FORBIDDEN.some((f) => f.pattern.test(stripComments(commentOnly)))).toBe(false);
  });
});
