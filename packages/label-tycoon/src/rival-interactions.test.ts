import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  CONTRACT_END,
  RIVALS,
  RIVAL_INTERACTIONS,
  buyoutAsk,
  buyoutOffer,
  labelGame,
  newGame,
  rivalInteractions,
  scoutTalents,
} from './index';

const withArtist = (employeur = 'joueur') => {
  const s = newGame('ri');
  const d = s.engine.data;
  scoutTalents(d, Rng.fromSeed('i'), 'plateforme', 0);
  const a = d.artistes[0];
  if (!a) throw new Error('artiste attendu');
  a.employeur = employeur;
  a.fanbase = 3_000_000;
  return { s, d, a };
};

describe('débauchage', () => {
  it('un prédateur débauche un artiste dont le contrat est à échéance (jamais avant, jamais après la grâce)', () => {
    let poached = 0;
    for (let seed = 0; seed < 12; seed += 1) {
      const { d, a } = withArtist();
      d.contrats.push({
        id: 90,
        artisteId: a.id,
        clauses: {
          avance: cents(0),
          royaltiesArtisteBps: 4000,
          dureeAnnees: 1,
          exclusivite: false,
          part360Bps: 0,
          clauseRachat: cents(0),
        },
        signeLe: 0,
        echeance: 20,
        recette360: 0,
      });
      for (const r of d.rivaux) {
        r.personnalite = 'predateur';
        r.tresorerie = money.euros(800_000);
      }
      for (let t = 0; t < 20; t += 1)
        rivalInteractions(d, t, Rng.fromSeed(`b${seed}-${t}`), () => undefined);
      expect(d.artistes[0]?.employeur).toBe('joueur');
      const signals: string[] = [];
      for (let t = 20; t < 20 + CONTRACT_END.graceWeeks; t += 1)
        rivalInteractions(d, t, Rng.fromSeed(`p${seed}-${t}`), (x) => signals.push(x.kind));
      if (signals.includes('debauchage')) {
        poached += 1;
        expect(d.artistes[0]?.employeur.startsWith('rival:')).toBe(true);
        expect(d.contrats).toHaveLength(0);
      }
    }
    expect(poached).toBeGreaterThan(0);
  });
});

describe('offres de rachat', () => {
  it('un rival offre pour un artiste notoire ; accepter vend le contrat, refuser ne change rien', () => {
    const { s, d, a } = withArtist();
    d.contrats.push({
      id: 90,
      artisteId: a.id,
      clauses: {
        avance: cents(0),
        royaltiesArtisteBps: 4000,
        dureeAnnees: 2,
        exclusivite: false,
        part360Bps: 0,
        clauseRachat: cents(0),
      },
      signeLe: 0,
      echeance: 104,
      recette360: 0,
    });
    for (const r of d.rivaux) r.tresorerie = money.euros(50_000_000);
    for (let t = 1; t < 3000 && d.offresRachat.length === 0; t += 1)
      rivalInteractions(d, t, Rng.fromSeed(`o${t}`), () => undefined);
    const offer = d.offresRachat[0];
    if (!offer) throw new Error('offre attendue');
    expect(offer.prix).toBe(buyoutOffer(d, a.id));
    const before = s.engine.data.label.tresorerie;
    const yes = labelGame.dispatch(s, { type: 'accepter-rachat', offreId: offer.id });
    expect(yes.ok).toBe(true);
    if (!yes.ok) return;
    expect(yes.session.engine.data.label.tresorerie).toBe(before + offer.prix);
    expect(yes.session.engine.data.artistes[0]?.employeur).toBe(`rival:${offer.rivalId}`);
    const no = labelGame.dispatch(s, { type: 'refuser-rachat', offreId: offer.id });
    expect(no.ok && no.session.engine.data.artistes[0]?.employeur).toBe('joueur');
    expect(labelGame.dispatch(s, { type: 'accepter-rachat', offreId: 9999 })).toMatchObject({
      ok: false,
      rejection: { code: 'offre-introuvable' },
    });
  });

  it('le joueur peut racheter un artiste rival au prix exigé, avec un contrat standard', () => {
    const { s, d, a } = withArtist();
    const rival = d.rivaux[0];
    if (!rival) throw new Error('rival attendu');
    rival.personnalite = 'declin';
    a.employeur = `rival:${rival.id}`;
    d.label.tresorerie = money.euros(50_000_000);
    const r = labelGame.dispatch(s, { type: 'racheter-artiste', artisteId: a.id });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const out = r.session.engine.data;
    expect(out.artistes[0]?.employeur).toBe('joueur');
    expect(out.contrats).toHaveLength(1);
    expect(out.label.tresorerie).toBe(d.label.tresorerie - buyoutAsk(d, a.id));
    a.employeur = 'joueur';
    expect(labelGame.dispatch(s, { type: 'racheter-artiste', artisteId: a.id })).toMatchObject({
      ok: false,
      rejection: { code: 'pas-un-artiste-rival' },
    });
  });
});

describe('clash et évolution', () => {
  it('un clash donne du buzz aux deux artistes du même genre', () => {
    const { d, a } = withArtist();
    const rival = d.rivaux[0];
    if (!rival) throw new Error('rival attendu');
    d.artistes.push({ ...a, id: 777, employeur: `rival:${rival.id}`, hype: 0 });
    a.hype = 0;
    const signals: string[] = [];
    for (let t = 1; t < 5000 && !signals.includes('clash'); t += 1)
      rivalInteractions(d, t, Rng.fromSeed(`c${t}`), (x) => signals.push(x.kind));
    expect(signals).toContain('clash');
    expect(a.hype).toBeGreaterThanOrEqual(RIVAL_INTERACTIONS.clashHype);
  });

  it('un rival ruiné disparaît, libère son roster, puis un nouveau rival apparaît', () => {
    const { d, a } = withArtist();
    const rival = d.rivaux[0];
    if (!rival) throw new Error('rival attendu');
    a.employeur = `rival:${rival.id}`;
    rival.semainesNegatives = RIVALS.collapseWeeks;
    const count = d.rivaux.length;
    const signals: string[] = [];
    rivalInteractions(d, 10, Rng.fromSeed('e'), (x) => signals.push(x.kind));
    expect(signals).toContain('rival-disparu');
    expect(d.rivaux).toHaveLength(count - 1);
    expect(d.artistes[0]?.employeur).toBe('libre');
    rivalInteractions(d, 10 + RIVAL_INTERACTIONS.replacementDelay, Rng.fromSeed('e2'), (x) =>
      signals.push(x.kind),
    );
    expect(signals).toContain('rival-nouveau');
    expect(d.rivaux).toHaveLength(count);
  });

  it('un rival très riche devient une major', () => {
    const { d } = withArtist();
    const rival = d.rivaux.find((r) => r.personnalite !== 'major');
    if (!rival) throw new Error('rival non major attendu');
    rival.tresorerie = money.euros(900_000_000);
    rivalInteractions(d, 1, Rng.fromSeed('m'), () => undefined);
    expect(rival.personnalite).toBe('major');
  });
});
