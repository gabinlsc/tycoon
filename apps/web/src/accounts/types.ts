export interface RecoveryCodeRecord {
  hash: string;
  used: boolean;
}

/** Compte tel qu'il est enregistré. Aucun e-mail, aucun mot de passe : un pseudo et des codes. */
export interface StoredAccount {
  id: string;
  pseudo: string;
  createdAt: string;
  salt: string;
  codes: RecoveryCodeRecord[];
}

/** Ce que l'interface a le droit de voir : jamais les empreintes. */
export interface Account {
  id: string;
  pseudo: string;
  createdAt: string;
  /** Nombre de codes de récupération encore utilisables. */
  codesLeft: number;
}

export interface SaveInfo {
  slug: string;
  updatedAt: string;
  bytes: number;
  /** Résumé lisible fourni par le jeu (partie la plus récente, nombre d'emplacements…). */
  resume?: string;
}

export type AccountErrorCode =
  'pseudo-invalide' | 'pseudo-pris' | 'code-invalide' | 'non-connecte' | 'stockage';

export class AccountError extends Error {
  readonly code: AccountErrorCode;
  constructor(code: AccountErrorCode, message: string) {
    super(message);
    this.name = 'AccountError';
    this.code = code;
  }
}

/**
 * Contrat du service de comptes. L'implémentation actuelle (LocalAccountStore) vit dans le
 * navigateur ; un serveur la remplacera sans toucher à l'interface, d'où des méthodes asynchrones.
 */
export interface AccountStore {
  /** Compte connecté sur ce navigateur, ou null. La connexion est automatique. */
  getSession(): Promise<Account | null>;
  isPseudoTaken(pseudo: string): Promise<boolean>;
  /** Crée le compte, le connecte, et renvoie les codes de récupération (affichés une seule fois). */
  create(pseudo: string): Promise<{ account: Account; codes: string[] }>;
  /** Reconnecte avec un pseudo et un code de récupération, qui est consommé. */
  recover(pseudo: string, code: string): Promise<Account>;
  /** Remplace tous les codes par un nouveau lot. Les anciens cessent de fonctionner. */
  regenerateCodes(): Promise<string[]>;
  signOut(): Promise<void>;
  /** Supprime le compte et toutes ses sauvegardes. */
  deleteAccount(): Promise<void>;

  loadSave<T>(slug: string): Promise<T | null>;
  writeSave(slug: string, data: unknown): Promise<void>;
  clearSave(slug: string): Promise<void>;
  listSaves(): Promise<SaveInfo[]>;
}
