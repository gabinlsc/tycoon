import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  ACADEMIE,
  FONDATION,
  INFLUENCE,
  LabelPilot,
  type LabelSession,
  MUSEE,
  bonusRemuneration,
  labelGame,
  newGame,
  revenuMusee,
} from './index';

function institution(): LabelSession {
  const s = newGame('institution');
  s.engine.data.label.tier = 'institution';
  s.engine.data.label.tresorerie = money.euros(50_000_000_000);
  return s;
}

const agir = (s: LabelSession, action: Parameters<typeof labelGame.dispatch>[1]) => {
  const r = labelGame.dispatch(s, action);
  if (!r.ok) throw new Error(`refusé : ${r.rejection.code}`);
  return r.session;
};

describe('accès au palier Institution', () => {
  it('ferme tout avant le palier', () => {
    const s = newGame('tot');
    s.engine.data.label.tresorerie = money.euros(50_000_000_000);
    for (const action of [
      { type: 'regler-fondation', don: 0 },
      { type: 'ameliorer-academie' },
      { type: 'ameliorer-musee' },
      { type: 'influencer', regle: 'vivier' },
    ] as const) {
      const r = labelGame.dispatch(s, action);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.rejection.code).toBe('palier-insuffisant');
    }
  });
});

describe('fondation et influence', () => {
  it('l’influence monte seule, plus vite avec des dons et un musée, et ne dépasse pas le plafond', () => {
    const seule = labelGame.advance(institution(), 20).session.engine.data.institution.influence;
    let s = agir(institution(), { type: 'regler-fondation', don: money.euros(2_000_000) });
    s = agir(s, { type: 'ameliorer-musee' });
    const dons = labelGame.advance(s, 20).session.engine.data.institution;
    expect(seule).toBeGreaterThan(0);
    expect(dons.influence).toBeGreaterThan(seule);
    expect(dons.donne).toBe(money.euros(2_000_000) * 20);
    const longue = labelGame.advance(s, 400).session.engine.data.institution.influence;
    expect(longue).toBeLessThanOrEqual(INFLUENCE.max);
  });
  it('refuse un don hors limites', () => {
    const s = institution();
    for (const don of [-1, FONDATION.donMax + 1, 1.2])
      expect(labelGame.dispatch(s, { type: 'regler-fondation', don }).ok).toBe(false);
  });
  it('permet d’infléchir le marché : rémunération (temporaire) et vivier de talents', () => {
    let s = institution();
    s.engine.data.institution.influence = 100;
    expect(bonusRemuneration(s.engine.data, 0)).toBe(1);
    s = agir(s, { type: 'influencer', regle: 'remuneration' });
    expect(bonusRemuneration(s.engine.data, 1)).toBeGreaterThan(1);
    expect(bonusRemuneration(s.engine.data, INFLUENCE.rules.remuneration.weeks + 5)).toBe(1);
    expect(s.engine.data.institution.influence).toBe(100 - INFLUENCE.rules.remuneration.cost);
    const avant = s.engine.data.artistes.filter((a) => a.employeur === 'libre').length;
    s = agir(s, { type: 'influencer', regle: 'vivier' });
    expect(s.engine.data.artistes.filter((a) => a.employeur === 'libre').length).toBe(
      avant + INFLUENCE.rules.vivier.talents,
    );
  });
  it('refuse d’agir sans assez d’influence', () => {
    const s = institution();
    const r = labelGame.dispatch(s, { type: 'influencer', regle: 'remuneration' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejection.code).toBe('influence-insuffisante');
  });
});

describe('académie d’artistes', () => {
  it('se fonde, se règle, puis forme une promotion à chaque cycle financé', () => {
    let s = agir(institution(), { type: 'ameliorer-academie' });
    expect(s.engine.data.institution.academie?.niveau).toBe(1);
    s = agir(s, { type: 'regler-academie', genre: 'afro', budget: ACADEMIE.budgetFloor });
    const avant = s.engine.data.artistes.filter((a) => a.employeur === 'joueur').length;
    s = labelGame.advance(s, ACADEMIE.cycle + 1).session;
    const joueur = s.engine.data.artistes.filter((a) => a.employeur === 'joueur');
    expect(joueur.length).toBe(avant + 1);
    const diplome = joueur[joueur.length - 1];
    expect(diplome?.genre).toBe('afro');
    expect(diplome?.loyaute).toBeGreaterThanOrEqual(ACADEMIE.minLoyalty);
    expect(s.engine.data.contrats.some((c) => c.artisteId === diplome?.id)).toBe(true);
    expect(s.engine.data.institution.academie?.diplomes).toBe(1);
  });
  it('ne forme personne sans budget suffisant', () => {
    let s = agir(institution(), { type: 'ameliorer-academie' });
    s = agir(s, { type: 'regler-academie', genre: 'rap', budget: 0 });
    s = labelGame.advance(s, ACADEMIE.cycle * 2).session;
    expect(s.engine.data.institution.academie?.diplomes).toBe(0);
  });
  it('monte de niveau jusqu’au maximum', () => {
    let s = institution();
    for (let i = 0; i < ACADEMIE.max; i += 1) s = agir(s, { type: 'ameliorer-academie' });
    expect(labelGame.dispatch(s, { type: 'ameliorer-academie' }).ok).toBe(false);
    expect(s.engine.data.institution.academie?.niveau).toBe(ACADEMIE.max);
  });
  it('exige une académie avant de la régler, et un genre connu', () => {
    const s = institution();
    expect(labelGame.dispatch(s, { type: 'regler-academie', genre: 'rap', budget: 0 }).ok).toBe(
      false,
    );
    const t = agir(s, { type: 'ameliorer-academie' });
    expect(labelGame.dispatch(t, { type: 'regler-academie', genre: 'inconnu', budget: 0 }).ok).toBe(
      false,
    );
    expect(
      labelGame.dispatch(t, {
        type: 'regler-academie',
        genre: 'rap',
        budget: ACADEMIE.budgetMax + 1,
      }).ok,
    ).toBe(false);
  });
});

describe('musée du label', () => {
  it('monte de niveau et rapporte chaque année, plus avec des certifications', () => {
    let s = agir(institution(), { type: 'ameliorer-musee' });
    expect(revenuMusee(s.engine.data)).toBe(MUSEE.revenueYear);
    s.engine.data.projets.push({
      id: 77,
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
      qualite: 50,
      sortieLe: 0,
      s1: 0,
      hit: 0,
      viral: null,
      streams: 0,
      derniers: 0,
      certification: 'or',
    });
    expect(revenuMusee(s.engine.data)).toBe(MUSEE.revenueYear + MUSEE.perCertification);
    const avant = s.engine.data.label.tresorerie;
    s = labelGame.advance(s, MUSEE.week + 1).session;
    expect(s.engine.data.label.tresorerie - avant).toBeGreaterThan(MUSEE.revenueYear * 0.9);
    for (let i = 1; i < MUSEE.max; i += 1) s = agir(s, { type: 'ameliorer-musee' });
    expect(labelGame.dispatch(s, { type: 'ameliorer-musee' }).ok).toBe(false);
  });
});

describe('sauvegardes anciennes', () => {
  it('se chargent sans institution', () => {
    const p = new LabelPilot();
    p.handle({ type: 'nouvelle-partie', graine: 'a' });
    const r = p.handle({ type: 'sauvegarder' });
    if (r.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
    const partie = JSON.parse(r.sauvegarde) as { engine: { data: Record<string, unknown> } };
    const { institution: _i, ...reste } = partie.engine.data;
    void _i;
    partie.engine.data = reste;
    const lu = new LabelPilot().handle({ type: 'charger', sauvegarde: JSON.stringify(partie) });
    expect(lu.type === 'vue' && lu.vue.institution.musee.niveau).toBe(0);
  });
});
