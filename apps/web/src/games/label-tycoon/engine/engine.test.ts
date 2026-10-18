import { LabelPilot } from '@tycoon/label-tycoon';
import { describe, expect, it } from 'vitest';
import { creerMoteurWorker, type WorkerLike } from './client';
import { creerMoteurLocal } from './local';
import type { RequeteWorker } from './protocol';

describe('moteur local', () => {
  it('joue une partie par commandes, comme le ferait le worker', async () => {
    const moteur = creerMoteurLocal();
    const start = await moteur.envoyer({ type: 'nouvelle-partie', graine: 'web' });
    expect(start.type).toBe('vue');
    const next = await moteur.envoyer({ type: 'avancer', semaines: 3, arretSurSignal: false });
    expect(next.type === 'vue' && next.vue.semaine).toBe(3);
  });
});

/** Faux worker : il répond avec un vrai pilote, dans un ordre choisi par le test. */
function fauxWorker(order: 'normal' | 'inverse'): WorkerLike {
  const pilote = new LabelPilot();
  const queue: RequeteWorker[] = [];
  const worker: WorkerLike = {
    onmessage: null,
    onerror: null,
    terminate: () => undefined,
    postMessage(message) {
      queue.push(message);
      queueMicrotask(() => {
        const batch = queue.splice(0);
        for (const r of order === 'inverse' ? batch.reverse() : batch)
          worker.onmessage?.({ data: { id: r.id, reponse: pilote.handle(r.commande) } });
      });
    },
  };
  return worker;
}

describe('moteur sur worker', () => {
  it('relie chaque réponse à sa requête, même hors ordre', async () => {
    const moteur = creerMoteurWorker(fauxWorker('inverse'));
    await moteur.envoyer({ type: 'nouvelle-partie', graine: 'w1' });
    const [a, b] = await Promise.all([
      moteur.envoyer({ type: 'vue' }),
      moteur.envoyer({ type: 'action', action: { type: 'reperer', source: 'candidature' } }),
    ]);
    expect(a.type).toBe('vue');
    expect(b.type === 'vue' || b.type === 'refus').toBe(true);
  });

  it('transforme une erreur du worker en réponse d’erreur, et l’arrêt aussi', async () => {
    const worker: WorkerLike = {
      onmessage: null,
      onerror: null,
      terminate: () => undefined,
      postMessage: () => undefined,
    };
    const moteur = creerMoteurWorker(worker);
    const pending = moteur.envoyer({ type: 'vue' });
    worker.onerror?.({ message: 'boum' });
    expect(await pending).toEqual({ type: 'erreur', message: 'boum' });
    const second = moteur.envoyer({ type: 'vue' });
    moteur.arreter();
    expect((await second).type).toBe('erreur');
  });
});
