import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  FESTIVALS_MAISON,
  LabelPilot,
  type LabelSession,
  PLATEFORME,
  STUDIOS_SYNCHRO,
  labelGame,
  newGame,
  portee,
  repartirStreaming,
  revenuFestival,
  synchroCachet,
  synchroChance,
} from './index';

function conglomerat(): LabelSession {
  const s = newGame('conglo');
  s.engine.data.label.tier = 'conglomerat';
  s.engine.data.label.tresorerie = money.euros(5_000_000_000);
  return s;
}

const agir = (s: LabelSession, action: Parameters<typeof labelGame.dispatch>[1]) => {
  const r = labelGame.dispatch(s, action);
  if (!r.ok) throw new Error(`refusé : ${r.rejection.code}`);
  return r.session;
};

describe('accès au palier Conglomérat', () => {
  it('ferme la plateforme, les studios et les festivals avant le palier', () => {
    const s = newGame('tot');
    s.engine.data.label.tresorerie = money.euros(5_000_000_000);
    for (const type of [
      'creer-plateforme',
      'acheter-studio-synchro',
      'acheter-festival',
    ] as const) {
      const r = labelGame.dispatch(s, { type });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.rejection.code).toBe('palier-insuffisant');
    }
  });
});

describe('plateforme maison', () => {
  it('se lance une fois, contre paiement', () => {
    let s = conglomerat();
    const avant = s.engine.data.label.tresorerie;
    s = agir(s, { type: 'creer-plateforme' });
    expect(s.engine.data.plateforme).toMatchObject({ abonnes: 0, exclusivite: 0 });
    expect(s.engine.data.label.tresorerie).toBe(avant - PLATEFORME.creationCost);
    expect(labelGame.dispatch(s, { type: 'creer-plateforme' }).ok).toBe(false);
  });
  it('refuse les réglages hors limites', () => {
    const s = agir(conglomerat(), { type: 'creer-plateforme' });
    for (const [exclusivite, budget] of [
      [101, 0],
      [-1, 0],
      [50, PLATEFORME.budgetMax + 1],
      [50.5, 0],
    ] as const)
      expect(labelGame.dispatch(s, { type: 'regler-plateforme', exclusivite, budget }).ok).toBe(
        false,
      );
    expect(
      labelGame.dispatch(newGame('x'), { type: 'regler-plateforme', exclusivite: 0, budget: 0 }).ok,
    ).toBe(false);
  });
  const abonnesApres = (exclusivite: number, budget: number, semaines = 52) => {
    let s = agir(conglomerat(), { type: 'creer-plateforme' });
    s = agir(s, { type: 'regler-plateforme', exclusivite, budget });
    return labelGame.advance(s, semaines).session.engine.data.plateforme?.abonnes ?? 0;
  };
  it('gagne des abonnés avec du budget, davantage avec de l’exclusivité', () => {
    expect(abonnesApres(0, 0)).toBe(0);
    const budget = money.euros(2_000_000);
    const sans = abonnesApres(0, budget);
    const avec = abonnesApres(100, budget);
    expect(sans).toBeGreaterThan(0);
    expect(avec).toBeGreaterThan(sans);
  });
  it('ne dépasse jamais le marché potentiel', () => {
    expect(abonnesApres(100, PLATEFORME.budgetMax, 520)).toBeLessThanOrEqual(PLATEFORME.market);
  });
  it('rapporte des abonnements nets des coûts à partir d’une certaine taille', () => {
    let s = agir(conglomerat(), { type: 'creer-plateforme' });
    if (s.engine.data.plateforme) s.engine.data.plateforme.abonnes = 8_000_000;
    s = labelGame.advance(s, 1).session;
    const marge = ((PLATEFORME.arpuYear - PLATEFORME.costYear) * 8_000_000) / 52;
    expect(s.engine.data.plateforme?.cumul).toBeGreaterThan(marge * 0.9);
  });
});

describe('arbitrage catalogue / plateforme', () => {
  it('sans plateforme, tout va au marché externe', () => {
    expect(repartirStreaming(newGame('x').engine.data, 1000)).toEqual({
      externe: 1000,
      plateforme: 0,
    });
  });
  it('l’exclusivité coûte tant que la plateforme est petite, et rapporte plus quand elle est grande', () => {
    const s = agir(conglomerat(), { type: 'creer-plateforme' });
    const d = s.engine.data;
    if (!d.plateforme) throw new Error('plateforme attendue');
    d.plateforme.exclusivite = 100;
    d.plateforme.abonnes = 0;
    const petite = repartirStreaming(d, 1000);
    expect(petite.externe + petite.plateforme).toBe(0);
    d.plateforme.abonnes = PLATEFORME.reachSubscribers;
    const grande = repartirStreaming(d, 1000);
    expect(grande.externe).toBe(0);
    expect(grande.plateforme).toBe(Math.round(1000 * PLATEFORME.exclusiveRevenueFactor));
    d.plateforme.exclusivite = 50;
    d.plateforme.abonnes = PLATEFORME.reachSubscribers / 2;
    const mi = repartirStreaming(d, 1000);
    expect(mi.externe).toBe(500);
    expect(portee(d.plateforme)).toBeCloseTo(0.5);
  });
});

describe('studios de synchro', () => {
  it('s’achètent par niveau, jusqu’au maximum, et multiplient chances et cachets', () => {
    let s = conglomerat();
    expect(synchroChance(s.engine.data)).toBe(1);
    expect(synchroCachet(s.engine.data)).toBe(1);
    for (let i = 0; i < STUDIOS_SYNCHRO.max; i += 1)
      s = agir(s, { type: 'acheter-studio-synchro' });
    expect(labelGame.dispatch(s, { type: 'acheter-studio-synchro' }).ok).toBe(false);
    expect(synchroChance(s.engine.data)).toBe(
      1 + STUDIOS_SYNCHRO.max * STUDIOS_SYNCHRO.chancePerLevel,
    );
    expect(synchroCachet(s.engine.data)).toBeCloseTo(
      1 + STUDIOS_SYNCHRO.max * STUDIOS_SYNCHRO.cachetPerLevel,
    );
  });
  it('rapportent un revenu passif sur le catalogue de qualité', () => {
    let s = agir(conglomerat(), { type: 'acheter-studio-synchro' });
    s.engine.data.projets.push({
      id: 900,
      artisteId: 1,
      type: 'single',
      clip: 'aucun',
      studio: 1,
      producteur: 1,
      mixage: 0,
      debut: 0,
      fin: 0,
      retard: 0,
      statut: 'sortie',
      qualite: 80,
      sortieLe: 0,
      s1: 0,
      hit: 0,
      viral: null,
      streams: 0,
      derniers: 0,
      certification: null,
    });
    const avant = s.engine.data.finances.semaine.revenus['synchro'] ?? 0;
    s = labelGame.advance(s, 1).session;
    const rapport = s.engine.data.finances.semaines[s.engine.data.finances.semaines.length - 1];
    expect(rapport?.revenus['synchro']).toBeGreaterThanOrEqual(
      avant + STUDIOS_SYNCHRO.passivePerRelease,
    );
  });
});

describe('festivals possédés', () => {
  it('s’achètent, puis rapportent chaque année à la semaine du festival', () => {
    let s = conglomerat();
    s = agir(s, { type: 'acheter-festival' });
    expect(s.engine.data.festivalsPossedes).toBe(1);
    expect(revenuFestival(s.engine.data)).toBeGreaterThan(0);
    const avant = s.engine.data.label.tresorerie;
    s = labelGame.advance(s, FESTIVALS_MAISON.week + 1).session;
    expect(s.engine.data.label.tresorerie - avant).toBeGreaterThan(
      revenuFestival(s.engine.data) * 0.9,
    );
  });
  it('sont limités', () => {
    let s = conglomerat();
    for (let i = 0; i < FESTIVALS_MAISON.max; i += 1) s = agir(s, { type: 'acheter-festival' });
    expect(labelGame.dispatch(s, { type: 'acheter-festival' }).ok).toBe(false);
  });
});

describe('sauvegardes anciennes', () => {
  it('se chargent avec des valeurs neutres pour les champs ajoutés depuis', () => {
    const p = new LabelPilot();
    p.handle({ type: 'nouvelle-partie', graine: 'ancienne' });
    const r = p.handle({ type: 'sauvegarder' });
    if (r.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
    const partie = JSON.parse(r.sauvegarde) as { engine: { data: Record<string, unknown> } };
    const { sousLabels, cadres, plateforme, studiosSynchro, festivalsPossedes, ...ancien } =
      partie.engine.data;
    void [sousLabels, cadres, plateforme, studiosSynchro, festivalsPossedes];
    partie.engine.data = ancien;
    const q = new LabelPilot();
    const lu = q.handle({ type: 'charger', sauvegarde: JSON.stringify(partie) });
    expect(lu.type).toBe('vue');
    if (lu.type === 'vue') {
      expect(lu.vue.groupe.sousLabels).toEqual([]);
      expect(lu.vue.conglomerat.plateforme).toBeNull();
    }
    expect(q.handle({ type: 'avancer', semaines: 3, arretSurSignal: false }).type).toBe('vue');
  });
});
