import { hashState, money } from '@tycoon/core';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  DIFFICULTY_BOUNDS,
  DIFFICULTY_PRESETS,
  LABEL_NAME_MAX,
  LABEL_STREAMS,
  PHASE_ORDER,
  TIERS,
  buildPipeline,
  defaultConfig,
  describeRejection,
  fr,
  initialState,
  labelGame,
  newGame,
  newId,
  validateConfig,
} from './index';
import type { GameConfig, LabelPhase } from './index';

describe('nouvelle partie', () => {
  it('démarre en home-studio avec le budget de départ', () => {
    const { engine } = newGame('graine');
    expect(engine.tick).toBe(0);
    expect(engine.data.label).toMatchObject({
      nom: 'Mon label',
      tier: 'home-studio',
      tresorerie: money.euros(10_000),
      reputation: 5,
    });
    expect(engine.data.nextId).toBe(1);
  });

  it('est déterministe : même graine et mêmes réglages, même hash', () => {
    expect(hashState(newGame('x').engine)).toBe(hashState(newGame('x').engine));
    expect(hashState(newGame('x').engine)).not.toBe(hashState(newGame('y').engine));
  });

  it('une trésorerie est toujours un entier de centimes (propriété)', () => {
    fc.assert(
      fc.property(
        fc.double({
          min: DIFFICULTY_BOUNDS.startingCash.min,
          max: DIFFICULTY_BOUNDS.startingCash.max,
          noNaN: true,
        }),
        (multiplier) => {
          const config: GameConfig = {
            ...defaultConfig(),
            difficulty: { ...DIFFICULTY_PRESETS.normal, startingCash: multiplier },
          };
          return Number.isSafeInteger(initialState('t', config).label.tresorerie);
        },
      ),
    );
  });

  it('la difficulté change le budget de départ, du plus facile au plus difficile', () => {
    const cash = (preset: 'facile' | 'normal' | 'difficile') =>
      initialState('t', defaultConfig(preset)).label.tresorerie;
    expect(cash('facile')).toBe(money.euros(20_000));
    expect(cash('difficile')).toBe(money.euros(5_000));
    expect(cash('facile')).toBeGreaterThan(cash('normal'));
    expect(cash('normal')).toBeGreaterThan(cash('difficile'));
  });

  it("le bac à sable donne de l'argent illimité", () => {
    const state = initialState('t', { ...defaultConfig('normal', 'bac-a-sable'), sandbox: true });
    expect(state.label.tresorerie).toBeGreaterThan(money.euros(100_000_000));
  });

  it('refuse des réglages hors bornes', () => {
    for (const key of Object.keys(DIFFICULTY_BOUNDS) as Array<keyof typeof DIFFICULTY_BOUNDS>) {
      const tooHigh: GameConfig = {
        ...defaultConfig(),
        difficulty: { ...DIFFICULTY_PRESETS.normal, [key]: DIFFICULTY_BOUNDS[key].max + 1 },
      };
      expect(validateConfig(tooHigh)).toContain(key);
      expect(() => initialState('t', tooHigh)).toThrow(RangeError);
    }
    const nan: GameConfig = {
      ...defaultConfig(),
      difficulty: { ...DIFFICULTY_PRESETS.normal, rivalAggression: Number.NaN },
    };
    expect(validateConfig(nan)).not.toBeNull();
    expect(validateConfig(defaultConfig())).toBeNull();
  });

  it('ne partage aucune référence avec les réglages fournis', () => {
    const config = defaultConfig();
    const state = initialState('t', config);
    config.difficulty.startingCash = 99;
    expect(state.config.difficulty.startingCash).toBe(1);
  });

  it("garde les réglages dans l'état (ils sont sauvegardés et hachés)", () => {
    const hard = newGame('x', defaultConfig('difficile'));
    expect(hard.engine.data.config.difficulty).toEqual(DIFFICULTY_PRESETS.difficile);
    expect(hashState(hard.engine)).not.toBe(hashState(newGame('x').engine));
  });

  it('attribue des identifiants uniques et croissants', () => {
    const state = initialState('t', defaultConfig());
    expect([newId(state), newId(state), newId(state)]).toEqual([1, 2, 3]);
    expect(state.nextId).toBe(4);
  });
});

describe('simulation de base', () => {
  it('avance de 52 semaines sans erreur et de façon déterministe', () => {
    const a = labelGame.advance(newGame('s'), 52).session;
    const b = labelGame.advance(newGame('s'), 52).session;
    expect(a.engine.tick).toBe(52);
    expect(hashState(a.engine)).toBe(hashState(b.engine));
  });

  it('déclare un flux aléatoire par système, tous distincts', () => {
    expect(new Set(LABEL_STREAMS).size).toBe(LABEL_STREAMS.length);
    const { engine } = newGame('s');
    for (const stream of LABEL_STREAMS) expect(engine.streams[stream]).toBeDefined();
  });
});

describe('renommer le label', () => {
  it("renomme et journalise l'action", () => {
    const result = labelGame.dispatch(newGame('r'), {
      type: 'renommer-label',
      nom: '  Encre & Vinyle  ',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.engine.data.label.nom).toBe('Encre & Vinyle');
      expect(result.session.journal).toHaveLength(1);
    }
  });

  it('refuse un nom vide ou trop long, avec un message en français', () => {
    const empty = labelGame.dispatch(newGame('r'), { type: 'renommer-label', nom: '   ' });
    expect(empty).toMatchObject({ ok: false, rejection: { code: 'nom-vide' } });
    if (!empty.ok) expect(describeRejection(empty.rejection)).toBe('Donne un nom à ton label.');

    const long = labelGame.dispatch(newGame('r'), {
      type: 'renommer-label',
      nom: 'x'.repeat(LABEL_NAME_MAX + 1),
    });
    expect(long).toMatchObject({
      ok: false,
      rejection: { code: 'nom-trop-long', params: { max: LABEL_NAME_MAX } },
    });
    if (!long.ok) expect(describeRejection(long.rejection)).toContain(String(LABEL_NAME_MAX));
  });

  it('compte les caractères Unicode, pas les unités UTF-16', () => {
    const nom = '🎵'.repeat(LABEL_NAME_MAX);
    expect(labelGame.dispatch(newGame('r'), { type: 'renommer-label', nom }).ok).toBe(true);
  });

  it('se rejoue au même hash', () => {
    let session = newGame('rj');
    session = labelGame.advance(session, 5).session;
    const result = labelGame.dispatch(session, { type: 'renommer-label', nom: 'Nouveau nom' });
    if (!result.ok) throw new Error('attendu');
    session = labelGame.advance(result.session, 5).session;
    const replayed = labelGame.replay(
      'rj',
      initialState('rj', defaultConfig()),
      session.journal,
      session.engine.tick,
    );
    expect(hashState(replayed.engine)).toBe(hashState(session.engine));
  });
});

describe('pipeline', () => {
  const phase = (name: string): LabelPhase => ({ name, run: () => undefined });

  it("range les phases dans l'ordre du jeu, quel que soit l'ordre de déclaration", () => {
    const ordered = buildPipeline({
      finances: phase('finances'),
      marche: phase('marche'),
      streams: phase('streams'),
    });
    expect(ordered.map((p) => p.name)).toEqual(['marche', 'streams', 'finances']);
  });

  it('refuse une phase inconnue ou enregistrée sous un autre nom', () => {
    expect(() => buildPipeline({ inconnue: phase('inconnue') } as never)).toThrow(RangeError);
    expect(() => buildPipeline({ marche: phase('autre') })).toThrow(RangeError);
  });

  it("suit l'ordre du GDD et n'a pas de doublon", () => {
    expect(PHASE_ORDER[0]).toBe('echeances-evenements');
    expect(PHASE_ORDER[PHASE_ORDER.length - 1]).toBe('fil');
    expect(new Set(PHASE_ORDER).size).toBe(PHASE_ORDER.length);
    expect(PHASE_ORDER.indexOf('finances')).toBeLessThan(PHASE_ORDER.indexOf('tirage-evenements'));
  });

  it("le jeu enregistre les phases d'événements aux bonnes places", () => {
    expect(labelGame.simulation.definition.phases.map((p) => p.name)).toEqual([
      'echeances-evenements',
      'marche',
      'rivaux',
      'production',
      'streams',
      'classements',
      'artistes',
      'personnel',
      'finances',
      'tirage-evenements',
    ]);
  });
});

describe('équilibrage et textes', () => {
  it("les paliers sont croissants en réputation et en chiffre d'affaires", () => {
    for (let i = 1; i < TIERS.length; i += 1) {
      expect(TIERS[i]?.minReputation).toBeGreaterThan(TIERS[i - 1]?.minReputation ?? 0);
      expect(TIERS[i]?.minAnnualRevenue).toBeGreaterThan(TIERS[i - 1]?.minAnnualRevenue ?? 0);
    }
    expect(TIERS.map((t) => t.id)).toEqual(['home-studio', 'independant', 'etabli', 'major']);
  });

  it('chaque palier a un nom affichable', () => {
    for (const tier of TIERS) expect(fr.tiers[tier.id].length).toBeGreaterThan(0);
  });

  it('les préréglages sont dans les bornes', () => {
    for (const preset of Object.values(DIFFICULTY_PRESETS)) {
      expect(validateConfig({ mode: 'carriere', difficulty: preset })).toBeNull();
    }
  });

  it('describeRejection a un repli sûr pour un code inconnu', () => {
    expect(describeRejection({ code: 'jamais-vu' })).toBe('Action refusée (jamais-vu).');
  });

  it("tous les codes de refus du moteur d'événements ont un texte", () => {
    for (const code of [
      'decision-introuvable',
      'choix-inconnu',
      'choix-indisponible',
      'action-inconnue',
      'nom-vide',
    ]) {
      expect(describeRejection({ code, params: { type: 'x' } })).not.toContain('Action refusée (');
    }
  });
});
