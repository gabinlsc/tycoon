import { describe, expect, it } from 'vitest';
import { money } from '@tycoon/core';
import {
  HERITAGE,
  appliquerHeritage,
  bilanDeRegne,
  defaultConfig,
  initialState,
  labelGame,
  newGame,
  regneClosable,
  validerHeritage,
} from './index';
import type { HeritageDepart } from './index';
import { buildView } from './view';

const heritage = (over: Partial<HeritageDepart> = {}): HeritageDepart => ({
  generation: 2,
  ancetre: 'Ancien label',
  reputation: 8,
  bonus: [],
  ...over,
});

describe('bilan de règne', () => {
  it('ne se clôt qu’à un palier élevé ou après une longue carrière, jamais en bac à sable', () => {
    const s = newGame('h1');
    const d = s.engine.data;
    expect(regneClosable(d, 10)).toBe(false);
    expect(regneClosable(d, HERITAGE.minWeeks)).toBe(true);
    d.label.tier = 'groupe';
    expect(regneClosable(d, 10)).toBe(true);
    d.config.sandbox = true;
    expect(regneClosable(d, 1000)).toBe(false);
  });

  it('mesure chaque bonus et transmet seulement ceux qui sont atteints', () => {
    const s = newGame('h2');
    const d = s.engine.data;
    d.institution.donne = HERITAGE.bonus.fondation.don;
    d.stats['artiste-signe'] = HERITAGE.bonus.reseau.signatures - 1;
    const bilan = bilanDeRegne(d, 600);
    const par = Object.fromEntries(bilan.bonus.map((b) => [b.id, b.atteint]));
    expect(par).toEqual({ fondation: true, catalogue: false, prestige: false, reseau: false });
    expect(bilan.heritage.bonus).toEqual(['fondation']);
    expect(bilan.heritage.generation).toBe(2);
    expect(bilan.heritage.ancetre).toBe(d.label.nom);
  });

  it('transmet une réputation réduite et plafonnée', () => {
    const d = newGame('h3').engine.data;
    d.label.reputation = 100;
    expect(bilanDeRegne(d, 600).heritage.reputation).toBe(HERITAGE.reputationMax);
    d.label.reputation = 10;
    expect(bilanDeRegne(d, 600).heritage.reputation).toBe(1);
  });

  it('cumule les bonus des règnes précédents', () => {
    const config = { ...defaultConfig(), heritage: heritage({ generation: 2, bonus: ['reseau'] }) };
    const d = newGame('h4', config).engine.data;
    const bilan = bilanDeRegne(d, 100);
    expect(bilan.generation).toBe(2);
    expect(bilan.heritage.generation).toBe(3);
    expect(bilan.heritage.bonus).toContain('reseau');
    expect(bilan.bonus.find((b) => b.id === 'reseau')?.herite).toBe(true);
  });

  it('apparaît dans la vue', () => {
    const s = newGame('h5');
    const vue = buildView(s.engine.data, s.engine.tick);
    expect(vue.heritage.closable).toBe(false);
    expect(vue.heritage.bilan.label).toBe(s.engine.data.label.nom);
  });
});

describe('partie Héritage', () => {
  it('applique la réputation et chaque bonus au départ', () => {
    const base = initialState('h6', defaultConfig());
    const avec = initialState('h6', {
      ...defaultConfig(),
      heritage: heritage({ bonus: ['fondation', 'catalogue', 'prestige', 'reseau'] }),
    });
    expect(avec.label.reputation).toBe(
      base.label.reputation + 8 + HERITAGE.bonus.prestige.reputation,
    );
    expect(avec.label.tresorerie).toBe(base.label.tresorerie + HERITAGE.bonus.catalogue.tresorerie);
    expect(avec.institution.influence).toBe(HERITAGE.bonus.fondation.influence);
    const genre = Object.keys(avec.label.credibilite)[0] ?? '';
    expect(avec.label.credibilite[genre]).toBe(
      (base.label.credibilite[genre] ?? 0) + HERITAGE.bonus.reseau.credibilite,
    );
  });

  it('applique l’héritage une seule fois à l’état', () => {
    const d = initialState('h7', defaultConfig());
    const avant = d.label.tresorerie;
    appliquerHeritage(d, heritage({ bonus: ['catalogue'] }));
    expect(d.label.tresorerie - avant).toBe(HERITAGE.bonus.catalogue.tresorerie);
  });

  it('refuse un héritage mal formé ou hors carrière', () => {
    expect(validerHeritage(heritage({ generation: 1 }))).not.toBeNull();
    expect(validerHeritage(heritage({ reputation: 99 }))).not.toBeNull();
    expect(validerHeritage(heritage({ bonus: ['inconnu' as never] }))).not.toBeNull();
    expect(validerHeritage(heritage({ bonus: ['reseau', 'reseau'] }))).not.toBeNull();
    expect(() =>
      newGame('h8', { ...defaultConfig('normal', 'scenario'), heritage: heritage() }),
    ).toThrow();
    expect(() =>
      newGame('h8', { ...defaultConfig(), sandbox: true, heritage: heritage() }),
    ).toThrow();
  });

  it('reste déterministe et se rejoue', () => {
    const config = { ...defaultConfig(), heritage: heritage({ bonus: ['catalogue'] }) };
    const run = () => labelGame.advance(newGame('h9', config), 30).session.engine.data.label;
    expect(run()).toEqual(run());
    expect(run().tresorerie).not.toBe(money.euros(0));
  });
});
