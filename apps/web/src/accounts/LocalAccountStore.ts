import { PSEUDO_MESSAGES, pseudoKey, validatePseudo } from './pseudo';
import { generateCodes, hashCode, isWellFormedCode, newSalt } from './recoveryCodes';
import {
  AccountError,
  type Account,
  type AccountStore,
  type SaveInfo,
  type StoredAccount,
} from './types';

/** Sous-ensemble de l'API Storage dont on a besoin : permet de tester avec une mémoire factice. */
export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const REGISTRY_KEY = 'tycoon:accounts';
const SESSION_KEY = 'tycoon:session';
const SAVE_PREFIX = 'tycoon:save:';

interface SaveEnvelope {
  version: 1;
  updatedAt: string;
  data: unknown;
}

/**
 * Comptes stockés dans le navigateur (localStorage).
 *
 * Limites assumées, à lever avec un serveur : un pseudo n'est réservé que sur cet appareil,
 * et un compte ne se retrouve pas depuis un autre navigateur. Les codes de récupération ne sont
 * jamais stockés en clair, seulement leur empreinte salée.
 */
export class LocalAccountStore implements AccountStore {
  constructor(private readonly storage: StorageLike) {}

  // ---- Stockage brut ----

  private readRegistry(): Record<string, StoredAccount> {
    try {
      const raw = this.storage.getItem(REGISTRY_KEY);
      return raw ? (JSON.parse(raw) as Record<string, StoredAccount>) : {};
    } catch {
      return {};
    }
  }

  private writeRegistry(registry: Record<string, StoredAccount>): void {
    try {
      this.storage.setItem(REGISTRY_KEY, JSON.stringify(registry));
    } catch {
      throw new AccountError(
        'stockage',
        "Impossible d'écrire dans le navigateur (stockage plein ou bloqué).",
      );
    }
  }

  private toAccount(stored: StoredAccount): Account {
    return {
      id: stored.id,
      pseudo: stored.pseudo,
      createdAt: stored.createdAt,
      codesLeft: stored.codes.filter((c) => !c.used).length,
    };
  }

  private currentStored(): { key: string; stored: StoredAccount } | null {
    const id = this.storage.getItem(SESSION_KEY);
    if (!id) return null;
    const registry = this.readRegistry();
    for (const [key, stored] of Object.entries(registry)) {
      if (stored.id === id) return { key, stored };
    }
    return null;
  }

  private requireCurrent(): { key: string; stored: StoredAccount } {
    const current = this.currentStored();
    if (!current) throw new AccountError('non-connecte', 'Tu dois être connecté.');
    return current;
  }

  private async buildCodes(
    salt: string,
  ): Promise<{ plain: string[]; records: StoredAccount['codes'] }> {
    const plain = generateCodes();
    const records = await Promise.all(
      plain.map(async (code) => ({ hash: await hashCode(code, salt), used: false })),
    );
    return { plain, records };
  }

  // ---- Comptes ----

  async getSession(): Promise<Account | null> {
    const current = this.currentStored();
    return current ? this.toAccount(current.stored) : null;
  }

  async isPseudoTaken(pseudo: string): Promise<boolean> {
    return pseudoKey(pseudo) in this.readRegistry();
  }

  async create(pseudo: string): Promise<{ account: Account; codes: string[] }> {
    const problem = validatePseudo(pseudo);
    if (problem) throw new AccountError('pseudo-invalide', PSEUDO_MESSAGES[problem]);

    const registry = this.readRegistry();
    const key = pseudoKey(pseudo);
    if (key in registry) throw new AccountError('pseudo-pris', 'Ce pseudo est déjà pris.');

    const salt = newSalt();
    const { plain, records } = await this.buildCodes(salt);
    const stored: StoredAccount = {
      id: crypto.randomUUID(),
      pseudo: pseudo.trim(),
      createdAt: new Date().toISOString(),
      salt,
      codes: records,
    };
    registry[key] = stored;
    this.writeRegistry(registry);
    this.storage.setItem(SESSION_KEY, stored.id);
    return { account: this.toAccount(stored), codes: plain };
  }

  async recover(pseudo: string, code: string): Promise<Account> {
    // Même message que le pseudo soit inconnu ou le code faux : on ne révèle pas quels pseudos existent
    const invalid = new AccountError('code-invalide', 'Pseudo ou code de récupération incorrect.');
    const registry = this.readRegistry();
    const key = pseudoKey(pseudo);
    const stored = registry[key];
    if (!stored || !isWellFormedCode(code)) throw invalid;

    const hash = await hashCode(code, stored.salt);
    const match = stored.codes.find((c) => !c.used && c.hash === hash);
    if (!match) throw invalid;

    match.used = true;
    this.writeRegistry(registry);
    this.storage.setItem(SESSION_KEY, stored.id);
    return this.toAccount(stored);
  }

  async regenerateCodes(): Promise<string[]> {
    const { key, stored } = this.requireCurrent();
    const { plain, records } = await this.buildCodes(stored.salt);
    const registry = this.readRegistry();
    registry[key] = { ...stored, codes: records };
    this.writeRegistry(registry);
    return plain;
  }

  async signOut(): Promise<void> {
    this.storage.removeItem(SESSION_KEY);
    return;
  }

  async deleteAccount(): Promise<void> {
    const { key, stored } = this.requireCurrent();
    const { [key]: _removed, ...registry } = this.readRegistry();
    void _removed;
    this.writeRegistry(registry);
    for (const slug of this.saveKeys(stored.id)) this.storage.removeItem(slug.storageKey);
    this.storage.removeItem(SESSION_KEY);
    return;
  }

  // ---- Sauvegardes, une par compte et par jeu ----

  private saveKey(accountId: string, slug: string): string {
    return `${SAVE_PREFIX}${accountId}:${slug}`;
  }

  private saveKeys(accountId: string): Array<{ storageKey: string; slug: string }> {
    const prefix = `${SAVE_PREFIX}${accountId}:`;
    const found: Array<{ storageKey: string; slug: string }> = [];
    for (let i = 0; i < this.storage.length; i += 1) {
      const storageKey = this.storage.key(i);
      if (storageKey?.startsWith(prefix))
        found.push({ storageKey, slug: storageKey.slice(prefix.length) });
    }
    return found;
  }

  async loadSave<T>(slug: string): Promise<T | null> {
    const { stored } = this.requireCurrent();
    try {
      const raw = this.storage.getItem(this.saveKey(stored.id, slug));
      if (!raw) return null;
      return (JSON.parse(raw) as SaveEnvelope).data as T;
    } catch {
      return null;
    }
  }

  async writeSave(slug: string, data: unknown): Promise<void> {
    const { stored } = this.requireCurrent();
    const envelope: SaveEnvelope = { version: 1, updatedAt: new Date().toISOString(), data };
    try {
      this.storage.setItem(this.saveKey(stored.id, slug), JSON.stringify(envelope));
    } catch {
      throw new AccountError('stockage', 'Sauvegarde impossible : stockage plein ou bloqué.');
    }
    return;
  }

  async clearSave(slug: string): Promise<void> {
    const { stored } = this.requireCurrent();
    this.storage.removeItem(this.saveKey(stored.id, slug));
    return;
  }

  async listSaves(): Promise<SaveInfo[]> {
    const { stored } = this.requireCurrent();
    const saves = this.saveKeys(stored.id).flatMap(({ storageKey, slug }) => {
      const raw = this.storage.getItem(storageKey);
      if (!raw) return [];
      try {
        const envelope = JSON.parse(raw) as SaveEnvelope;
        return [{ slug, updatedAt: envelope.updatedAt, bytes: raw.length }];
      } catch {
        return [];
      }
    });
    return saves;
  }
}
