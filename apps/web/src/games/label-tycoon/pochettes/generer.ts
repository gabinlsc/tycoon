/** Génération déterministe de pochettes : la même graine donne toujours la même pochette. */

export const MOTIFS = ['cercles', 'rayures', 'soleil', 'damier', 'vagues'] as const;
export type Motif = (typeof MOTIFS)[number];

export interface ParametresPochette {
  motif: Motif;
  /** Teintes HSL (0-359) du fond, de la forme principale et de l'accent. */
  teintes: readonly [number, number, number];
  /** Variantes numériques stables (0 à 1) pour placer les formes. */
  variantes: readonly [number, number, number, number];
}

/** Hachage FNV-1a 32 bits d'une chaîne. */
export function hacher(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i += 1) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Suite pseudo-aléatoire stable dérivée d'une graine (mulberry32). */
export function suite(graine: number): () => number {
  let a = graine >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Teinte de base favorite d'un genre : les pochettes d'un même genre se ressemblent. */
const TEINTE_GENRE: Readonly<Record<string, number>> = {
  rap: 275,
  drill: 215,
  trap: 330,
  afro: 28,
  rnb: 345,
  'pop-urbaine': 190,
  'electro-pop': 160,
  latino: 12,
  variete: 50,
  dancehall: 130,
};

export function parametresPochette(graine: string, genre: string): ParametresPochette {
  const rnd = suite(hacher(`${genre}:${graine}`));
  const base = TEINTE_GENRE[genre] ?? Math.floor(rnd() * 360);
  const decalage = Math.floor(rnd() * 60) - 30;
  const fond = (base + decalage + 360) % 360;
  return {
    motif: MOTIFS[Math.floor(rnd() * MOTIFS.length)] ?? 'cercles',
    teintes: [
      fond,
      (fond + 150 + Math.floor(rnd() * 60)) % 360,
      (fond + 40 + Math.floor(rnd() * 40)) % 360,
    ],
    variantes: [rnd(), rnd(), rnd(), rnd()],
  };
}

export const hsl = (teinte: number, s: number, l: number): string => `hsl(${teinte} ${s}% ${l}%)`;
