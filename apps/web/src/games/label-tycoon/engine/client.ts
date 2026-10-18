import type { CommandeJeu, ReponseJeu } from '@tycoon/label-tycoon';
import type { MoteurLabel, ReponseWorker, RequeteWorker } from './protocol';

/** Forme minimale d'un Worker : de quoi le simuler dans les tests. */
export interface WorkerLike {
  postMessage(message: RequeteWorker): void;
  terminate(): void;
  onmessage: ((event: { data: ReponseWorker }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
}

/**
 * Moteur adossé à un Worker : chaque commande reçoit un identifiant et sa promesse est résolue par
 * la réponse correspondante, dans l'ordre d'arrivée ou non.
 */
export function creerMoteurWorker(worker: WorkerLike): MoteurLabel {
  let next = 1;
  const pending = new Map<number, (reponse: ReponseJeu) => void>();
  worker.onmessage = (event) => {
    const resolve = pending.get(event.data.id);
    if (!resolve) return;
    pending.delete(event.data.id);
    resolve(event.data.reponse);
  };
  worker.onerror = (event) => {
    const reponse: ReponseJeu = {
      type: 'erreur',
      message: event.message ?? 'Le moteur a rencontré une erreur.',
    };
    for (const resolve of pending.values()) resolve(reponse);
    pending.clear();
  };
  return {
    envoyer(commande: CommandeJeu) {
      return new Promise<ReponseJeu>((resolve) => {
        const id = next;
        next += 1;
        pending.set(id, resolve);
        worker.postMessage({ id, commande });
      });
    },
    arreter() {
      worker.terminate();
      const reponse: ReponseJeu = { type: 'erreur', message: 'Le moteur a été arrêté.' };
      for (const resolve of pending.values()) resolve(reponse);
      pending.clear();
    },
  };
}

/** Crée le moteur de production : un vrai Worker, ou le moteur local si les Workers manquent. */
export async function creerMoteur(): Promise<MoteurLabel> {
  if (typeof Worker === 'undefined') return (await import('./local')).creerMoteurLocal();
  const worker = new Worker(new URL('./moteur.worker.ts', import.meta.url), { type: 'module' });
  return creerMoteurWorker(worker as unknown as WorkerLike);
}
