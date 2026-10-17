/** Générateur pseudo-aléatoire mulberry32 : rapide, 32 bits, entièrement déterminé par la graine. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Tirage gaussien (Box-Muller) à partir d'un générateur uniforme dans [0, 1). */
export function gaussian(rand: () => number): number {
  const u = 1 - rand(); // évite log(0)
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
