import {
  type ReponseValidation,
  type SoumissionDefi,
  validerSoumission,
} from '@tycoon/label-tycoon';

export interface EntreeClassement {
  pseudo: string;
  score: number;
}

/**
 * Contrat du serveur de défis (voir `docs/games/label-tycoon/defi-api.md`). L'interface ne parle
 * qu'à cette interface : le serveur simulé d'aujourd'hui sera remplacé par un vrai serveur sans
 * toucher au jeu.
 */
export interface ServeurDefi {
  /** Envoie un défi terminé ; le serveur rejoue la partie et répond par le score validé ou un refus. */
  soumettre(soumission: SoumissionDefi): Promise<ReponseValidation>;
  /** Meilleurs scores validés d'un jour, du plus haut au plus bas. */
  classement(date: string): Promise<EntreeClassement[]>;
}

const TAILLE_CLASSEMENT = 10;

interface Stockage {
  getItem(cle: string): string | null;
  setItem(cle: string, valeur: string): void;
}

const cle = (date: string): string => `tycoon:label:defi-mock:${date}`;

function lire(stockage: Stockage, date: string): EntreeClassement[] {
  try {
    const brut = stockage.getItem(cle(date));
    const liste: unknown = brut ? JSON.parse(brut) : [];
    return Array.isArray(liste)
      ? liste.filter(
          (e): e is EntreeClassement =>
            typeof e?.pseudo === 'string' && typeof e?.score === 'number',
        )
      : [];
  } catch {
    return [];
  }
}

/** Fusionne un score dans un classement : un seul score par pseudo (le meilleur), dix places. */
export function inscrire(
  classement: readonly EntreeClassement[],
  nouveau: EntreeClassement,
): EntreeClassement[] {
  const autres = classement.filter((e) => e.pseudo !== nouveau.pseudo);
  const ancien = classement.find((e) => e.pseudo === nouveau.pseudo);
  const retenu = ancien && ancien.score >= nouveau.score ? ancien : nouveau;
  return [...autres, retenu].sort((a, b) => b.score - a.score).slice(0, TAILLE_CLASSEMENT);
}

/**
 * Serveur simulé, dans le navigateur : il valide avec le même code de rejeu qu'un vrai serveur,
 * mais ne garde que les scores de cet appareil.
 */
export function creerServeurSimule(stockage: Stockage = window.localStorage): ServeurDefi {
  return {
    soumettre(soumission) {
      const reponse = validerSoumission(soumission);
      if (reponse.statut === 'valide') {
        try {
          stockage.setItem(
            cle(reponse.date),
            JSON.stringify(
              inscrire(lire(stockage, reponse.date), {
                pseudo: soumission.pseudo?.trim() || 'Anonyme',
                score: reponse.score,
              }),
            ),
          );
        } catch {
          /* stockage indisponible : le score est validé mais ne sera pas mémorisé */
        }
      }
      return Promise.resolve(reponse);
    },
    classement: (date) => Promise.resolve(lire(stockage, date)),
  };
}

/** Client d'un vrai serveur : `POST /defi/soumissions` et `GET /defi/classement?date=`. */
export function creerServeurHttp(
  base: string,
  appel: typeof fetch = (...args) => fetch(...args),
): ServeurDefi {
  return {
    async soumettre(soumission) {
      const r = await appel(`${base}/defi/soumissions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(soumission),
      });
      // Un refus de validation est une réponse normale (HTTP 200 ou 422) : on lit toujours le corps.
      return (await r.json()) as ReponseValidation;
    },
    async classement(date) {
      const r = await appel(`${base}/defi/classement?date=${encodeURIComponent(date)}`);
      if (!r.ok) throw new Error(`Classement indisponible (${r.status})`);
      return (await r.json()) as EntreeClassement[];
    },
  };
}
