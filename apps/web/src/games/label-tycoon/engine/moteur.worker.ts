import { LabelPilot } from '@tycoon/label-tycoon';
import type { ReponseWorker, RequeteWorker } from './protocol';

/** Point d'entrée du Worker : un pilote par worker, une réponse par requête. */
const pilote = new LabelPilot();
const scope = self as unknown as {
  onmessage: ((event: { data: RequeteWorker }) => void) | null;
  postMessage(message: ReponseWorker): void;
};

scope.onmessage = (event) => {
  const { id, commande } = event.data;
  scope.postMessage({ id, reponse: pilote.handle(commande) });
};
