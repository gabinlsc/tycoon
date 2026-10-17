import { describe, expect, it } from 'vitest';
import { validateEmail } from './validateEmail';

describe('validateEmail', () => {
  it('accepte des adresses courantes', () => {
    for (const ok of ['a@b.fr', ' gabin@exemple.com ', 'prenom.nom+tag@sous.domaine.org']) {
      expect(validateEmail(ok)).toBeNull();
    }
  });

  it('signale une adresse vide', () => {
    expect(validateEmail('   ')).toBe('vide');
  });

  it('refuse les adresses mal formées', () => {
    for (const bad of ['abc', 'a@b', 'a@@b.fr', 'a b@c.fr', '@b.fr', 'a@b..fr', 'a@.fr']) {
      expect(validateEmail(bad)).toBe('invalide');
    }
  });
});
