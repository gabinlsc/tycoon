import type { VueJeu } from '@tycoon/label-tycoon';
import { describe, expect, it } from 'vitest';
import { conseilDeMax } from './conseil';

const vue = (extra: Record<string, unknown>) =>
  ({
    semaine: 10,
    finances: { tresorerie: 1000 },
    decisions: [],
    roster: [],
    ...extra,
  }) as unknown as VueJeu;

const artiste = (extra: Record<string, unknown>) => ({
  nom: 'Taylar Zweft',
  moral: 80,
  contrat: null,
  enProduction: true,
  ...extra,
});

describe('conseilDeMax', () => {
  it('alerte sur une trésorerie négative avant tout', () => {
    expect(conseilDeMax(vue({ finances: { tresorerie: -5 }, decisions: [{}] }))?.ecran).toBe(
      'finances',
    );
  });
  it('envoie vers la boîte quand des décisions attendent', () => {
    expect(conseilDeMax(vue({ decisions: [{}] }))?.ecran).toBe('boite');
  });
  it('pousse à signer un premier artiste', () => {
    expect(conseilDeMax(vue({}))?.ecran).toBe('reperage');
  });
  it('signale un artiste à bout, un contrat proche ou un artiste oisif', () => {
    expect(conseilDeMax(vue({ roster: [artiste({ moral: 10 })] }))?.texte).toContain('à bout');
    expect(
      conseilDeMax(vue({ roster: [artiste({ contrat: { echeance: 15 } })] }))?.texte,
    ).toContain('contrat');
    expect(conseilDeMax(vue({ roster: [artiste({ enProduction: false })] }))?.ecran).toBe('studio');
  });
  it('se tait quand tout va bien', () => {
    expect(conseilDeMax(vue({ roster: [artiste({})] }))).toBeNull();
  });
});
