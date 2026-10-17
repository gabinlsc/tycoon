/**
 * Copie profonde d'une valeur JSON (objets simples, tableaux, primitives). Plus prévisible que
 * `structuredClone` : elle refuse tout ce qui n'est pas de la donnée simple, et ne dépend d'aucune
 * API de la plateforme.
 */
export function cloneJson<T>(value: T): T {
  return copy(value) as T;
}

function copy(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    const out = new Array<unknown>(value.length);
    for (let i = 0; i < value.length; i += 1) out[i] = copy(value[i]);
    return out;
  }
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(source)) out[key] = copy(source[key]);
  return out;
}
