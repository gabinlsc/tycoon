import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { LocalAccountStore, type StorageLike } from './LocalAccountStore';
import type { Account, AccountStore, SaveInfo } from './types';

type Status = 'loading' | 'out' | 'in';

interface AccountContextValue {
  status: Status;
  account: Account | null;
  /** Faux si le navigateur bloque le stockage : le compte ne survivra pas à la fermeture de l'onglet. */
  persistent: boolean;
  store: AccountStore;
  /** Codes générés mais pas encore confirmés « notés » : ils ne seront plus jamais affichés ensuite. */
  pendingCodes: string[] | null;
  confirmCodes: () => void;
  createAccount: (pseudo: string) => Promise<string[]>;
  recover: (pseudo: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  regenerateCodes: () => Promise<string[]>;
  deleteAccount: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AccountContext = createContext<AccountContextValue | null>(null);

/** Mémoire de secours quand localStorage est inaccessible (navigation privée stricte, stockage bloqué). */
function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function pickStorage(): { storage: StorageLike; persistent: boolean } {
  try {
    const probe = '__tycoon_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return { storage: window.localStorage, persistent: true };
  } catch {
    return { storage: memoryStorage(), persistent: false };
  }
}

/**
 * Fournit le compte connecté à toute l'application. La connexion est automatique : au chargement,
 * on relit la session du navigateur. Un autre onglet qui se connecte ou se déconnecte est suivi
 * grâce à l'évènement `storage`.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const [{ store, persistent }] = useState(() => {
    const { storage, persistent: ok } = pickStorage();
    return { store: new LocalAccountStore(storage) as AccountStore, persistent: ok };
  });
  const [status, setStatus] = useState<Status>('loading');
  const [account, setAccount] = useState<Account | null>(null);
  const [pendingCodes, setPendingCodes] = useState<string[] | null>(null);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const current = await store.getSession();
    if (!alive.current) return;
    setAccount(current);
    setStatus(current ? 'in' : 'out');
  }, [store]);

  useEffect(() => {
    alive.current = true;
    void refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith('tycoon:')) void refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      alive.current = false;
      window.removeEventListener('storage', onStorage);
    };
  }, [refresh]);

  const value = useMemo<AccountContextValue>(
    () => ({
      status,
      account,
      persistent,
      store,
      pendingCodes,
      confirmCodes: () => setPendingCodes(null),
      async createAccount(pseudo) {
        const { account: created, codes } = await store.create(pseudo);
        setAccount(created);
        setStatus('in');
        setPendingCodes(codes);
        return codes;
      },
      async recover(pseudo, code) {
        const recovered = await store.recover(pseudo, code);
        setAccount(recovered);
        setStatus('in');
      },
      async signOut() {
        await store.signOut();
        setPendingCodes(null);
        setAccount(null);
        setStatus('out');
      },
      async regenerateCodes() {
        const codes = await store.regenerateCodes();
        await refresh();
        setPendingCodes(codes);
        return codes;
      },
      async deleteAccount() {
        await store.deleteAccount();
        setPendingCodes(null);
        setAccount(null);
        setStatus('out');
      },
      refresh,
    }),
    [status, account, persistent, store, pendingCodes, refresh],
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount doit être utilisé dans <AccountProvider>');
  return ctx;
}

interface GameSave<T> {
  /** `anonymous` : personne n'est connecté, rien n'est sauvegardé. */
  state: 'loading' | 'ready' | 'anonymous';
  data: T | null;
  save: (data: T) => Promise<void>;
  clear: () => Promise<void>;
}

/**
 * Sauvegarde d'un jeu pour le compte connecté. C'est le seul point d'entrée des jeux vers
 * leurs données : chaque jeu ne voit que sa propre sauvegarde, identifiée par son slug.
 */
export function useGameSave<T>(slug: string): GameSave<T> {
  const { status, account, store } = useAccount();
  const [data, setData] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const accountId = account?.id;

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    setData(null);
    if (status !== 'in') return;
    void store.loadSave<T>(slug).then((value) => {
      if (cancelled) return;
      setData(value);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [status, accountId, slug, store]);

  const save = useCallback(
    async (next: T) => {
      await store.writeSave(slug, next);
      setData(next);
    },
    [store, slug],
  );
  const clear = useCallback(async () => {
    await store.clearSave(slug);
    setData(null);
  }, [store, slug]);

  const state =
    status === 'in'
      ? loaded
        ? 'ready'
        : 'loading'
      : status === 'loading'
        ? 'loading'
        : 'anonymous';
  return { state, data, save, clear };
}

export type { SaveInfo };
