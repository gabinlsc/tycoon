import { beforeEach, describe, expect, it } from 'vitest';
import { LocalAccountStore, type StorageLike } from './LocalAccountStore';
import { AccountError } from './types';
import { generateCodes, isWellFormedCode, normalizeCode } from './recoveryCodes';
import { pseudoKey, validatePseudo } from './pseudo';

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.map.set(key, value);
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
}

describe('pseudos', () => {
  it('valide la longueur et les caractères', () => {
    expect(validatePseudo('')).toBe('vide');
    expect(validatePseudo('ab')).toBe('court');
    expect(validatePseudo('a'.repeat(17))).toBe('long');
    expect(validatePseudo('jean dupont')).toBe('caracteres');
    expect(validatePseudo('Léo_42')).toBeNull();
  });

  it('refuse les pseudos réservés, même déguisés', () => {
    expect(validatePseudo('Admin')).toBe('reserve');
    expect(validatePseudo('Modérateur')).toBe('reserve');
    expect(validatePseudo('tycoon-hub')).toBe('reserve');
  });

  it('considère comme identiques les pseudos qui ne diffèrent que par accents, casse et séparateurs', () => {
    expect(pseudoKey('Léo_42')).toBe(pseudoKey('leo-42'));
  });
});

describe('codes de récupération', () => {
  it('génère des codes distincts, bien formés et lisibles', () => {
    const codes = generateCodes();
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) {
      expect(code).toMatch(/^[2-9A-HJKMNP-Z]{5}-[2-9A-HJKMNP-Z]{5}$/);
      expect(isWellFormedCode(code)).toBe(true);
    }
  });

  it('accepte la saisie en minuscules, avec ou sans tiret', () => {
    expect(normalizeCode('abcde-fghjk')).toBe('ABCDEFGHJK');
  });
});

describe('LocalAccountStore', () => {
  let storage: MemoryStorage;
  let store: LocalAccountStore;

  beforeEach(() => {
    storage = new MemoryStorage();
    store = new LocalAccountStore(storage);
  });

  it('crée un compte, connecte automatiquement et ne stocke aucun code en clair', async () => {
    const { account, codes } = await store.create('Gabin');
    expect(account.pseudo).toBe('Gabin');
    expect(account.codesLeft).toBe(8);
    expect((await store.getSession())?.id).toBe(account.id);
    // Un nouveau store sur le même stockage (= rechargement de la page) retrouve la session
    expect((await new LocalAccountStore(storage).getSession())?.pseudo).toBe('Gabin');
    const raw = storage.getItem('tycoon:accounts') ?? '';
    for (const code of codes) expect(raw).not.toContain(normalizeCode(code));
  });

  it('réserve le pseudo, accents et casse compris', async () => {
    await store.create('Léo');
    expect(await store.isPseudoTaken('LEO')).toBe(true);
    await expect(store.create('leo')).rejects.toMatchObject({ code: 'pseudo-pris' });
  });

  it('refuse un pseudo invalide', async () => {
    await expect(store.create('a')).rejects.toBeInstanceOf(AccountError);
  });

  it("reconnecte avec un code, qui ne sert qu'une fois", async () => {
    const { codes } = await store.create('Gabin');
    await store.signOut();
    expect(await store.getSession()).toBeNull();

    const code = codes[0] ?? '';
    const account = await store.recover('gabin', code.toLowerCase());
    expect(account.codesLeft).toBe(7);
    expect((await store.getSession())?.pseudo).toBe('Gabin');

    await store.signOut();
    await expect(store.recover('Gabin', code)).rejects.toMatchObject({ code: 'code-invalide' });
  });

  it('donne la même erreur pour un pseudo inconnu et un mauvais code', async () => {
    await store.create('Gabin');
    const wrongCode = store.recover('Gabin', 'AAAAA-AAAAA').catch((e: AccountError) => e.message);
    const unknown = store.recover('Inconnu', 'AAAAA-AAAAA').catch((e: AccountError) => e.message);
    expect(await wrongCode).toBe(await unknown);
  });

  it('régénère les codes et invalide les anciens', async () => {
    const { codes: oldCodes } = await store.create('Gabin');
    const fresh = await store.regenerateCodes();
    expect(fresh).toHaveLength(8);
    await store.signOut();
    await expect(store.recover('Gabin', oldCodes[0] ?? '')).rejects.toBeInstanceOf(AccountError);
    await expect(store.recover('Gabin', fresh[0] ?? '')).resolves.toMatchObject({
      pseudo: 'Gabin',
    });
  });

  it('isole les sauvegardes par compte et par jeu', async () => {
    await store.create('Alice');
    await store.writeSave('syndicate', { cash: 10 });
    await store.writeSave('club-owner', { cash: 20 });
    expect(await store.loadSave('syndicate')).toEqual({ cash: 10 });
    expect((await store.listSaves()).map((s) => s.slug).sort()).toEqual([
      'club-owner',
      'syndicate',
    ]);

    await store.signOut();
    await store.create('Bob');
    expect(await store.loadSave('syndicate')).toBeNull();
    expect(await store.listSaves()).toEqual([]);
  });

  it('efface une sauvegarde sans toucher aux autres', async () => {
    await store.create('Alice');
    await store.writeSave('a', 1);
    await store.writeSave('b', 2);
    await store.clearSave('a');
    expect(await store.loadSave('a')).toBeNull();
    expect(await store.loadSave('b')).toBe(2);
  });

  it('supprime le compte, ses sauvegardes et libère le pseudo', async () => {
    await store.create('Alice');
    await store.writeSave('a', 1);
    await store.deleteAccount();
    expect(await store.getSession()).toBeNull();
    expect(await store.isPseudoTaken('Alice')).toBe(false);
    expect(storage.getItem('tycoon:save:x')).toBeNull();
    const leftovers = Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((k) =>
      k?.startsWith('tycoon:save:'),
    );
    expect(leftovers).toEqual([]);
  });

  it('refuse les sauvegardes sans être connecté', async () => {
    await expect(store.writeSave('a', 1)).rejects.toBeInstanceOf(AccountError);
  });
});
