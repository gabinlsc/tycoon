/**
 * Sérialisation canonique : deux états égaux produisent exactement le même texte, quel que soit
 * l'ordre d'insertion des clés. C'est la base du hash d'état (déterminisme, replay, validation du
 * défi du jour).
 *
 * Règles : valeurs JSON uniquement (objets simples, tableaux, chaînes, booléens, nombres finis,
 * null). Clés d'objet triées. `-0` devient `0`. Sont refusés, avec le chemin fautif : `undefined`,
 * `NaN`, les infinis, les fonctions, les symboles, les BigInt, les `Map`, `Set`, `Date`, et toute
 * instance de classe. Ces valeurs n'ont pas de représentation stable, donc elles n'ont rien à
 * faire dans l'état de la simulation.
 */

function isPlainObject(value: object): boolean {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function describePath(path: readonly (string | number)[]): string {
  return path.length === 0
    ? '(racine)'
    : path.map((p) => (typeof p === 'number' ? `[${p}]` : `.${p}`)).join('');
}

/** Premier endroit de l'arbre qui n'est pas sérialisable de façon stable, ou `null`. */
export function findNonSerializable(
  value: unknown,
  path: readonly (string | number)[] = [],
  seen: object[] = [],
): string | null {
  if (value === null) return null;
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return null;
    case 'number':
      return Number.isFinite(value)
        ? null
        : `${describePath(path)} : nombre non fini (${String(value)})`;
    case 'object': {
      if (seen.includes(value)) return `${describePath(path)} : référence circulaire`;
      const next = [...seen, value];
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i += 1) {
          const problem = findNonSerializable(value[i], [...path, i], next);
          if (problem) return problem;
        }
        return null;
      }
      if (!isPlainObject(value)) {
        return `${describePath(path)} : instance de classe ou type non JSON (${value.constructor?.name ?? 'inconnu'})`;
      }
      for (const key of Object.keys(value)) {
        const problem = findNonSerializable(
          (value as Record<string, unknown>)[key],
          [...path, key],
          next,
        );
        if (problem) return problem;
      }
      return null;
    }
    default:
      return `${describePath(path)} : type interdit (${typeof value})`;
  }
}

/** Texte JSON canonique de `value`. Lève `TypeError` avec le chemin si la valeur n'est pas sérialisable. */
export function stableStringify(value: unknown): string {
  const problem = findNonSerializable(value);
  if (problem) throw new TypeError(`État non sérialisable : ${problem}`);
  return write(value);
}

function write(value: unknown): string {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      return value === 0 ? '0' : String(value);
    default: {
      if (Array.isArray(value)) return `[${value.map(write).join(',')}]`;
      const object = value as Record<string, unknown>;
      // Tri par unités de code UTF-16 : ordre défini par la norme, identique partout
      const keys = Object.keys(object).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      return `{${keys.map((key) => `${JSON.stringify(key)}:${write(object[key])}`).join(',')}}`;
    }
  }
}

/** Copie profonde canonique : tableaux et objets neufs, clés triées. */
export function canonicalClone<T>(value: T): T {
  return JSON.parse(stableStringify(value)) as T;
}
