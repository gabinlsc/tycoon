import { describe, expect, it } from 'vitest';
import { fillTemplate } from './evenements';

describe('textes d’événements', () => {
  it('affichent les montants en euros et non en centimes', () => {
    expect(fillTemplate('Une prime de {prime} centimes.', { prime: 300_000 })).toBe(
      'Une prime de 3 000 €.',
    );
    expect(fillTemplate('{nom} gagne {n}', { nom: 'Zed', n: 3 })).toBe('Zed gagne 3');
  });
});
