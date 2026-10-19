import type { VueJeu } from '@tycoon/label-tycoon';
import type { EcranId } from './ecrans';
import { type CibleMonde, Siege } from './siege/Siege';

export { ETAGES, etageDe } from './siege/Siege';
export type { CibleMonde } from './siege/Siege';

/** Le QG dessiné : le siège du label en coupe, un étage par bâtiment, les artistes à leur poste. */
export function Immeuble({
  vue,
  allerA,
  ouvrir,
}: {
  vue: VueJeu;
  allerA: (ecran: EcranId) => void;
  /** Si fourni, un clic ouvre la cible dans la scène au lieu de changer d'écran. */
  ouvrir?: (cible: CibleMonde) => void;
}) {
  return <Siege vue={vue} allerA={allerA} {...(ouvrir ? { ouvrir } : {})} />;
}
