import { cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  GROUPE,
  type LabelSession,
  cadreDe,
  fourchetteNiveau,
  integriteConnue,
  labelGame,
  newGame,
  prixRachatRival,
  sousLabelsMax,
} from './index';

/** Un groupe riche, avec son vivier de cadres déjà tiré. */
function groupe(): LabelSession {
  const s = newGame('groupe');
  s.engine.data.label.tier = 'groupe';
  s.engine.data.label.tresorerie = money.euros(500_000_000);
  return labelGame.advance(s, 1).session;
}

const agir = (s: LabelSession, action: Parameters<typeof labelGame.dispatch>[1]) => {
  const r = labelGame.dispatch(s, action);
  if (!r.ok) throw new Error(`refusé : ${r.rejection.code}`);
  return r.session;
};

const creer = (s: LabelSession, genre = 'rap') =>
  agir(s, { type: 'creer-sous-label', genre, nom: `Filiale ${genre}` });

describe('accès au palier Groupe', () => {
  it('refuse de créer un sous-label avant le palier Groupe', () => {
    const s = newGame('tot');
    s.engine.data.label.tresorerie = money.euros(500_000_000);
    const r = labelGame.dispatch(s, { type: 'creer-sous-label', genre: 'rap', nom: 'X' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejection.code).toBe('palier-insuffisant');
    expect(sousLabelsMax(s.engine.data)).toBe(0);
  });
  it('ouvre le plafond de sous-labels avec le palier', () => {
    const s = groupe();
    expect(sousLabelsMax(s.engine.data)).toBe(GROUPE.maxSubLabels['groupe']);
    s.engine.data.label.tier = 'institution';
    expect(sousLabelsMax(s.engine.data)).toBe(GROUPE.maxSubLabels['institution']);
  });
});

describe('sous-labels', () => {
  it('se créent contre paiement, un par genre, dans la limite du palier', () => {
    let s = groupe();
    const avant = s.engine.data.label.tresorerie;
    s = creer(s, 'rap');
    expect(s.engine.data.sousLabels).toHaveLength(1);
    expect(s.engine.data.label.tresorerie).toBe(avant - GROUPE.creationCost);
    expect(
      labelGame.dispatch(s, { type: 'creer-sous-label', genre: 'rap', nom: 'Bis' }),
    ).toMatchObject({ ok: false });
    s = creer(creer(s, 'afro'), 'trap');
    const r = labelGame.dispatch(s, { type: 'creer-sous-label', genre: 'rnb', nom: 'Trop' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.rejection.code).toBe('trop-de-sous-labels');
  });
  it('refusent un nom vide, un genre inconnu ou une caisse trop légère', () => {
    const s = groupe();
    for (const action of [
      { type: 'creer-sous-label', genre: 'rap', nom: '  ' },
      { type: 'creer-sous-label', genre: 'inconnu', nom: 'A' },
    ] as const)
      expect(labelGame.dispatch(s, action).ok).toBe(false);
    s.engine.data.label.tresorerie = money.euros(1000);
    expect(labelGame.dispatch(s, { type: 'creer-sous-label', genre: 'rap', nom: 'A' }).ok).toBe(
      false,
    );
  });
  it('se ferment en libérant leur cadre', () => {
    let s = creer(groupe());
    const id = s.engine.data.sousLabels[0]?.id ?? 0;
    const candidat = s.engine.data.cadres.find((c) => !c.embauche);
    s = agir(s, { type: 'nommer-cadre', sousLabelId: id, cadreId: candidat?.id ?? 0 });
    s = agir(s, { type: 'fermer-sous-label', sousLabelId: id });
    expect(s.engine.data.sousLabels).toHaveLength(0);
    expect(s.engine.data.cadres.some((c) => c.id === candidat?.id)).toBe(false);
  });
});

describe('cadres', () => {
  it('forment un vivier de candidats, renouvelé', () => {
    const s = groupe();
    expect(s.engine.data.cadres.filter((c) => !c.embauche)).toHaveLength(GROUPE.poolSize);
  });
  it('se nomment à la tête d’un sous-label ; le remplacé quitte l’entreprise', () => {
    let s = creer(groupe());
    const id = s.engine.data.sousLabels[0]?.id ?? 0;
    const [a, b] = s.engine.data.cadres;
    s = agir(s, { type: 'nommer-cadre', sousLabelId: id, cadreId: a?.id ?? 0 });
    expect(s.engine.data.sousLabels[0]?.cadreId).toBe(a?.id);
    s = agir(s, { type: 'nommer-cadre', sousLabelId: id, cadreId: b?.id ?? 0 });
    expect(s.engine.data.cadres.some((c) => c.id === a?.id)).toBe(false);
    expect(cadreDe(s.engine.data, b?.id ?? null)?.embauche).toBe(true);
  });
  it('ne laissent voir qu’une fourchette du niveau, qui se resserre avec le service', () => {
    const s = groupe();
    const c = { ...(s.engine.data.cadres[0] as (typeof s.engine.data.cadres)[number]) };
    c.niveau = 60;
    c.decalage = 15;
    c.depuis = 0;
    const [bas0, haut0] = fourchetteNiveau(c, 0);
    expect(haut0 - bas0).toBeGreaterThan(20);
    expect(bas0 <= 60 && 60 <= haut0).toBe(true);
    const [basN, hautN] = fourchetteNiveau(c, 200);
    expect([basN, hautN]).toEqual([60, 60]);
    expect(integriteConnue(c, 10)).toBeNull();
    expect(integriteConnue(c, GROUPE.integrityKnownAfter)).toBe(c.integrite);
  });
});

describe('enveloppes et rendements', () => {
  const lancer = (niveau: number, avecCadre: boolean) => {
    let s = creer(groupe(), 'pop-urbaine');
    const marche = s.engine.data.marche.genres['pop-urbaine'];
    if (marche) marche.popularite = 50;
    const id = s.engine.data.sousLabels[0]?.id ?? 0;
    if (avecCadre) {
      const c = s.engine.data.cadres.find((x) => !x.embauche);
      if (!c) throw new Error('cadre attendu');
      Object.assign(c, { niveau, integrite: 90, style: 'prudent' });
      s = agir(s, { type: 'nommer-cadre', sousLabelId: id, cadreId: c.id });
    }
    s = agir(s, { type: 'regler-enveloppe', sousLabelId: id, montant: money.euros(300_000) });
    return labelGame.advance(s, 52).session.engine.data.sousLabels[0];
  };
  it('rapportent plus avec un bon cadre qu’avec un mauvais, et peu sans cadre', () => {
    const bon = lancer(85, true);
    const mauvais = lancer(25, true);
    const seul = lancer(0, false);
    const marge = (x: typeof bon) => (x ? x.rapporte / x.investi : 0);
    expect(marge(bon)).toBeGreaterThan(1);
    expect(marge(bon)).toBeGreaterThan(marge(mauvais));
    expect(marge(mauvais)).toBeGreaterThan(marge(seul));
    expect(marge(seul)).toBeLessThan(1);
  });
  it('saturent : une enveloppe démesurée rapporte moins par euro', () => {
    const s = creer(groupe(), 'rap');
    const sl = s.engine.data.sousLabels[0];
    if (!sl) throw new Error('sous-label attendu');
    const c = s.engine.data.cadres[0];
    if (c) {
      c.embauche = true;
      sl.cadreId = c.id;
    }
    sl.enveloppe = money.euros(100_000);
    const petit = labelGame.advance(s, 1).session.engine.data.sousLabels[0];
    sl.enveloppe = GROUPE.envelopeMax;
    const grand = labelGame.advance(s, 1).session.engine.data.sousLabels[0];
    expect((petit?.rapporte ?? 0) / (petit?.investi ?? 1)).toBeGreaterThan(
      (grand?.rapporte ?? 0) / (grand?.investi ?? 1),
    );
  });
  it('refusent une enveloppe hors limites', () => {
    const s = creer(groupe());
    const id = s.engine.data.sousLabels[0]?.id ?? 0;
    for (const montant of [-1, GROUPE.envelopeMax + 1, 1.5])
      expect(labelGame.dispatch(s, { type: 'regler-enveloppe', sousLabelId: id, montant }).ok).toBe(
        false,
      );
  });
  it('sont déterministes', () => {
    expect(JSON.stringify(lancer(70, true))).toBe(JSON.stringify(lancer(70, true)));
  });
});

describe('détournement', () => {
  it('un cadre peu intègre finit par détourner : démasqué, renvoyé, fonds perdus', () => {
    let s = creer(groupe(), 'rap');
    const id = s.engine.data.sousLabels[0]?.id ?? 0;
    const c = s.engine.data.cadres.find((x) => !x.embauche);
    if (!c) throw new Error('cadre attendu');
    Object.assign(c, { integrite: 5 });
    s = agir(s, { type: 'nommer-cadre', sousLabelId: id, cadreId: c.id });
    s = agir(s, { type: 'regler-enveloppe', sousLabelId: id, montant: money.euros(200_000) });
    let signal = false;
    for (let i = 0; i < 600 && !signal; i += 1) {
      const r = labelGame.advance(s, 1);
      s = r.session;
      signal = r.signals.some((x) => x.kind === 'detournement' && x.interrupt);
    }
    expect(signal).toBe(true);
    expect(s.engine.data.sousLabels[0]?.cadreId).toBeNull();
    expect(s.engine.data.cadres.some((x) => x.id === c.id)).toBe(false);
  });
});

describe('rachat de rival', () => {
  it('coûte le prix demandé, retire le rival et reprend ses artistes dans la limite du plafond', () => {
    const s = groupe();
    const d = s.engine.data;
    const rival = d.rivaux[0];
    if (!rival) throw new Error('un rival est attendu');
    const prix = prixRachatRival(d, rival.id);
    const avant = d.label.tresorerie;
    const artistes = d.artistes.filter((a) => a.employeur === `rival:${rival.id}`).length;
    const r = labelGame.dispatch(s, { type: 'racheter-rival', rivalId: rival.id });
    if (!r.ok) throw new Error(r.rejection.code);
    const d2 = r.session.engine.data;
    expect(d2.rivaux.some((x) => x.id === rival.id)).toBe(false);
    expect(d2.label.tresorerie).toBe(avant - cents(prix));
    expect(d2.artistes.filter((a) => a.employeur === 'joueur')).toHaveLength(artistes);
    expect(d2.remplacements.length).toBeGreaterThan(d.remplacements.length);
  });
  it('est réservé au palier Groupe et à qui peut payer', () => {
    const s = groupe();
    const id = s.engine.data.rivaux[0]?.id ?? 0;
    s.engine.data.label.tresorerie = money.euros(10);
    expect(labelGame.dispatch(s, { type: 'racheter-rival', rivalId: id }).ok).toBe(false);
    const t = newGame('x');
    expect(labelGame.dispatch(t, { type: 'racheter-rival', rivalId: id }).ok).toBe(false);
  });
});
