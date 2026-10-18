import { LabelPilot } from '@tycoon/label-tycoon';
import type { MoteurLabel } from './protocol';

/** Moteur exécuté dans le thread courant : pour les tests et en repli si les Workers sont absents. */
export function creerMoteurLocal(): MoteurLabel {
  const pilote = new LabelPilot();
  return {
    envoyer: (commande) => Promise.resolve(pilote.handle(commande)),
    arreter: () => undefined,
  };
}
