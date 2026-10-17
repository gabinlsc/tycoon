import { Rng, type Seed } from '@tycoon/core';
import { WORLD } from './balance/world';
import { generateCityName, normalizeForCompare, uniqueName } from './naming';

/**
 * Éléments du monde fixés au départ de la partie, déduits de la seule graine.
 * Ils utilisent un générateur dédié (et non les flux de la simulation) : le monde est donc le même
 * pour toute partie de même graine, y compris au rejeu, sans consommer le moindre tirage de la partie.
 */
export interface World {
  villes: string[];
}

export function generateWorld(seed: Seed): World {
  const rng = Rng.fromSeed(`${String(seed)}\u0000monde`);
  const taken = new Set<string>();
  const villes: string[] = [];
  for (let i = 0; i < WORLD.cityCount; i += 1) {
    const city = uniqueName(() => generateCityName(rng), taken);
    taken.add(normalizeForCompare(city));
    villes.push(city);
  }
  return { villes };
}
