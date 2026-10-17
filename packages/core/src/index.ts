// Moteur de simulation générique, partagé entre les tycoons. Voir README.md.
export * from './rng';
// Les opérations sur l'argent sont regroupées sous `money` (money.add, money.split…) pour ne pas
// entrer en collision avec les fonctions numériques (clamp, min, max…) du module math.
export * as money from './money';
export type { Cents } from './money/cents';
export { cents } from './money/cents';
export * from './math';
export * from './hash';
