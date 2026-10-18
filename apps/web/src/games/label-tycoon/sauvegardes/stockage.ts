/** Emplacements de sauvegarde : un automatique (toutes les 4 semaines) et trois manuels. */
export const EMPLACEMENTS = ['auto', 'manuel-1', 'manuel-2', 'manuel-3'] as const;
export type Emplacement = (typeof EMPLACEMENTS)[number];

export const EMPLACEMENTS_MANUELS = ['manuel-1', 'manuel-2', 'manuel-3'] as const;

/** Une partie rangée dans un emplacement : la sérialisation du moteur et un résumé lisible. */
export interface SauvegardeLabel {
  version: 1;
  /** Partie sérialisée par le moteur (JSON). */
  sauvegarde: string;
  semaine: number;
  label: string;
  palier: string;
  /** Trésorerie en centimes. */
  tresorerie: number;
  enregistreLe: string;
}

export const estEmplacement = (valeur: string): valeur is Emplacement =>
  (EMPLACEMENTS as readonly string[]).includes(valeur);

/**
 * Stockage des parties d'un compte. Les sauvegardes sont isolées par compte : un compte ne voit
 * jamais celles d'un autre. Les méthodes sont asynchrones pour pouvoir brancher IndexedDB, puis un
 * serveur, sans toucher à l'interface.
 */
export interface StockageParties {
  lire(compte: string, emplacement: Emplacement): Promise<SauvegardeLabel | null>;
  ecrire(compte: string, emplacement: Emplacement, sauvegarde: SauvegardeLabel): Promise<void>;
  effacer(compte: string, emplacement: Emplacement): Promise<void>;
  /** Tout ce que le compte possède, par emplacement. */
  lister(compte: string): Promise<Partial<Record<Emplacement, SauvegardeLabel>>>;
}

const cle = (compte: string, emplacement: Emplacement): string => `${compte}:${emplacement}`;

/** Stockage en mémoire : tests, et repli quand IndexedDB est indisponible (navigation privée). */
export function creerStockageMemoire(): StockageParties {
  const donnees = new Map<string, SauvegardeLabel>();
  return {
    lire: (compte, e) => Promise.resolve(donnees.get(cle(compte, e)) ?? null),
    ecrire(compte, e, s) {
      donnees.set(cle(compte, e), s);
      return Promise.resolve();
    },
    effacer(compte, e) {
      donnees.delete(cle(compte, e));
      return Promise.resolve();
    },
    lister(compte) {
      const out: Partial<Record<Emplacement, SauvegardeLabel>> = {};
      for (const e of EMPLACEMENTS) {
        const s = donnees.get(cle(compte, e));
        if (s) out[e] = s;
      }
      return Promise.resolve(out);
    },
  };
}

const BASE = 'tycoon-label';
const MAGASIN = 'parties';

function ouvrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(BASE, 1);
    requete.onupgradeneeded = () => requete.result.createObjectStore(MAGASIN);
    requete.onsuccess = () => resolve(requete.result);
    requete.onerror = () => reject(requete.error ?? new Error('IndexedDB indisponible'));
  });
}

function transaction<T>(
  mode: IDBTransactionMode,
  action: (magasin: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return ouvrir().then(
    (base) =>
      new Promise<T>((resolve, reject) => {
        const requete = action(base.transaction(MAGASIN, mode).objectStore(MAGASIN));
        requete.onsuccess = () => {
          base.close();
          resolve(requete.result);
        };
        requete.onerror = () => {
          base.close();
          reject(requete.error ?? new Error('Échec IndexedDB'));
        };
      }),
  );
}

/** Stockage persistant dans IndexedDB : plus large que localStorage et hors des limites du compte. */
export function creerStockageIndexedDB(): StockageParties {
  return {
    async lire(compte, e) {
      const valeur = await transaction<unknown>('readonly', (m) => m.get(cle(compte, e)));
      return (valeur as SauvegardeLabel | undefined) ?? null;
    },
    async ecrire(compte, e, s) {
      await transaction('readwrite', (m) => m.put(s, cle(compte, e)));
    },
    async effacer(compte, e) {
      await transaction('readwrite', (m) => m.delete(cle(compte, e)));
    },
    async lister(compte) {
      const out: Partial<Record<Emplacement, SauvegardeLabel>> = {};
      for (const e of EMPLACEMENTS) {
        const valeur = await transaction<unknown>('readonly', (m) => m.get(cle(compte, e)));
        if (valeur) out[e] = valeur as SauvegardeLabel;
      }
      return out;
    },
  };
}

/** IndexedDB quand il est disponible, la mémoire de la session sinon. */
export function choisirStockage(): { stockage: StockageParties; persistant: boolean } {
  if (typeof indexedDB === 'undefined')
    return { stockage: creerStockageMemoire(), persistant: false };
  return { stockage: creerStockageIndexedDB(), persistant: true };
}
