/**
 * Codes de récupération : 10 caractères tirés d'un alphabet sans caractères ambigus
 * (ni 0, 1, I, L, O), soit environ 49 bits d'entropie par code. Affichés « XXXXX-XXXXX ».
 */
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 10;
export const CODE_COUNT = 8;

/** Tirage uniforme dans l'alphabet : on rejette les octets qui biaiseraient le modulo. */
function randomChars(count: number): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = '';
  while (out.length < count) {
    const bytes = crypto.getRandomValues(new Uint8Array(count * 2));
    for (const byte of bytes) {
      if (byte < limit && out.length < count) out += ALPHABET.charAt(byte % ALPHABET.length);
    }
  }
  return out;
}

export function formatCode(raw: string): string {
  return `${raw.slice(0, 5)}-${raw.slice(5)}`;
}

/** Ce que l'utilisateur tape : majuscules, sans tiret ni espace. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isWellFormedCode(input: string): boolean {
  const code = normalizeCode(input);
  return code.length === CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));
}

/** Génère `count` codes distincts, déjà formatés pour l'affichage. */
export function generateCodes(count = CODE_COUNT): string[] {
  const codes = new Set<string>();
  while (codes.size < count) codes.add(randomChars(CODE_LENGTH));
  return [...codes].map(formatCode);
}

/** Empreinte SHA-256 d'un code, salée par compte : on ne stocke jamais le code en clair. */
export async function hashCode(code: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${normalizeCode(code)}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newSalt(): string {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
