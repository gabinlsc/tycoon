import { describe, expect, it } from 'vitest';
import { type CommandeJeu, LabelPilot, type ReponseJeu } from './index';

const vue = (r: ReponseJeu) => {
  if (r.type !== 'vue') throw new Error(`vue attendue, reçu ${r.type}`);
  return r;
};

describe('pilote sans worker', () => {
  it('démarre une partie et renvoie une vue cohérente', () => {
    const pilot = new LabelPilot();
    const r = vue(pilot.handle({ type: 'nouvelle-partie', graine: 'p1' }));
    expect(r.vue.semaine).toBe(0);
    expect(r.vue.date).toEqual({ annee: 1, mois: 1, semaineDuMois: 1 });
    expect(r.vue.label.palier).toBe('Home-studio');
    expect(r.vue.finances.tresorerie).toBeGreaterThan(0);
    expect(r.vue.roster).toEqual([]);
  });

  it('refuse toute commande sans partie, sans lever', () => {
    const pilot = new LabelPilot();
    for (const c of [
      { type: 'vue' },
      { type: 'avancer', semaines: 1 },
      { type: 'sauvegarder' },
    ] as CommandeJeu[])
      expect(pilot.handle(c).type).toBe('erreur');
  });

  it('avance, renvoie les signaux et s’arrête sur une auto-pause', () => {
    const pilot = new LabelPilot();
    pilot.handle({ type: 'nouvelle-partie', graine: 'p2' });
    const week = vue(pilot.handle({ type: 'avancer', semaines: 1 }));
    expect(week.vue.semaine).toBe(1);
    expect(week.semainesJouees).toBe(1);
    const long = vue(pilot.handle({ type: 'avancer', semaines: 52 }));
    expect(long.semainesJouees).toBeLessThanOrEqual(52);
    if (long.interrompu) expect(long.signaux.some((s) => s.interrupt)).toBe(true);
    const free = vue(pilot.handle({ type: 'avancer', semaines: 10, arretSurSignal: false }));
    expect(free.semainesJouees).toBe(10);
  });

  it('applique une action, ou renvoie un refus traduit', () => {
    const pilot = new LabelPilot();
    pilot.handle({ type: 'nouvelle-partie', graine: 'p3' });
    const ok = vue(
      pilot.handle({ type: 'action', action: { type: 'reperer', source: 'candidature' } }),
    );
    expect(ok.vue.suivis.length).toBeGreaterThan(0);
    const refused = pilot.handle({
      type: 'action',
      action: { type: 'reperer', source: 'zzz' as never },
    });
    expect(refused).toMatchObject({ type: 'refus', code: 'source-inconnue' });
    expect(refused.type === 'refus' && refused.message.length).toBeGreaterThan(5);
  });

  it('ne montre que des fourchettes pour les talents suivis (jamais les attributs cachés)', () => {
    const pilot = new LabelPilot();
    pilot.handle({ type: 'nouvelle-partie', graine: 'p4' });
    const r = vue(
      pilot.handle({ type: 'action', action: { type: 'reperer', source: 'plateforme' } }),
    );
    for (const s of r.vue.suivis) {
      expect(Object.keys(s.fourchettes).sort()).toEqual([
        'charisme',
        'flow',
        'plume',
        'scene',
        'voix',
      ]);
      expect(JSON.stringify(s)).not.toMatch(/potentiel|ethique|loyaute/);
    }
  });

  it('sauvegarde et recharge une partie à l’identique', () => {
    const a = new LabelPilot();
    a.handle({ type: 'nouvelle-partie', graine: 'p5' });
    a.handle({ type: 'avancer', semaines: 20, arretSurSignal: false });
    const save = a.handle({ type: 'sauvegarder' });
    if (save.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
    const b = new LabelPilot();
    expect(vue(b.handle({ type: 'charger', sauvegarde: save.sauvegarde })).vue).toEqual(
      vue(a.handle({ type: 'vue' })).vue,
    );
    const next = (p: LabelPilot) =>
      vue(p.handle({ type: 'avancer', semaines: 15, arretSurSignal: false })).vue;
    expect(next(b)).toEqual(next(a));
    expect(b.handle({ type: 'charger', sauvegarde: '{"x":1}' }).type).toBe('erreur');
    expect(b.handle({ type: 'charger', sauvegarde: 'pas du json' }).type).toBe('erreur');
  });

  it('s’arrête de jouer une fois en faillite', () => {
    const pilot = new LabelPilot();
    pilot.handle({ type: 'nouvelle-partie', graine: 'p6' });
    for (let i = 0; i < 40; i += 1)
      pilot.handle({ type: 'avancer', semaines: 52, arretSurSignal: false });
    const r = vue(pilot.handle({ type: 'vue' }));
    if (r.vue.finances.faillite) {
      const before = r.vue.semaine;
      expect(vue(pilot.handle({ type: 'avancer', semaines: 5 })).vue.semaine).toBe(before);
    }
  });
});

describe('évaluation d’une offre', () => {
  it('renvoie la réaction de l’artiste sans rien modifier', () => {
    const pilot = new LabelPilot();
    pilot.handle({ type: 'nouvelle-partie', graine: 'p7' });
    const found = vue(
      pilot.handle({ type: 'action', action: { type: 'reperer', source: 'plateforme' } }),
    );
    const id = found.vue.suivis[0]?.id ?? 0;
    const clauses = {
      avance: 0,
      royaltiesArtisteBps: 1000,
      dureeAnnees: 6,
      exclusivite: true,
      part360Bps: 5000,
      clauseRachat: 0,
    } as never;
    const bad = pilot.handle({ type: 'evaluer-offre', artisteId: id, clauses });
    expect(bad).toMatchObject({ type: 'reaction', reaction: 'mecontent' });
    const generous = pilot.handle({
      type: 'evaluer-offre',
      artisteId: id,
      clauses: {
        avance: 5_000_000,
        royaltiesArtisteBps: 9000,
        dureeAnnees: 1,
        exclusivite: false,
        part360Bps: 0,
        clauseRachat: 0,
      } as never,
    });
    expect(
      generous.type === 'reaction' && ['interesse', 'enthousiaste'].includes(generous.reaction),
    ).toBe(true);
    expect(
      pilot.handle({
        type: 'evaluer-offre',
        artisteId: id,
        clauses: { ...(clauses as object), dureeAnnees: 99 } as never,
      }).type,
    ).toBe('refus');
    expect(pilot.handle({ type: 'evaluer-offre', artisteId: 999999, clauses }).type).toBe('erreur');
    expect(vue(pilot.handle({ type: 'vue' })).vue.suivis[0]?.negociation).toBeNull();
  });
  it('expose un repère d’avance arrondi, jamais la valeur exacte', () => {
    const pilot = new LabelPilot();
    pilot.handle({ type: 'nouvelle-partie', graine: 'p8' });
    const found = vue(
      pilot.handle({ type: 'action', action: { type: 'reperer', source: 'plateforme' } }),
    );
    for (const s of found.vue.suivis) expect(s.avanceIndicative % 50_000).toBe(0);
  });
});

describe('estimation d’une sortie', () => {
  const signed = () => {
    const source = new LabelPilot();
    source.handle({ type: 'nouvelle-partie', graine: 'est' });
    source.handle({ type: 'action', action: { type: 'reperer', source: 'plateforme' } });
    const save = source.handle({ type: 'sauvegarder' });
    if (save.type !== 'sauvegarde') throw new Error('sauvegarde attendue');
    const s = JSON.parse(save.sauvegarde) as {
      engine: { data: { artistes: { id: number; employeur: string }[] } };
    };
    const a = s.engine.data.artistes[0];
    if (!a) throw new Error('artiste attendu');
    a.employeur = 'joueur';
    const pilot = new LabelPilot();
    pilot.handle({ type: 'charger', sauvegarde: JSON.stringify(s) });
    return { pilot, id: a.id };
  };

  it('donne une fourchette de qualité, un coût et une durée, qui croissent avec le budget', () => {
    const { pilot, id } = signed();
    const ask = (over: Record<string, unknown>) => {
      const r = pilot.handle({
        type: 'estimer-sortie',
        artisteId: id,
        sortie: 'single',
        clip: 'aucun',
        studio: 20,
        producteur: 40,
        mixage: 50_000,
        ...over,
      } as never);
      if (r.type !== 'estimation') throw new Error(`estimation attendue, reçu ${r.type}`);
      return r;
    };
    const base = ask({});
    expect(base.qualite[0]).toBeLessThanOrEqual(base.qualite[1]);
    expect(base.qualite[0]).toBeGreaterThanOrEqual(0);
    expect(base.qualite[1]).toBeLessThanOrEqual(100);
    expect(base.capacite).toBeGreaterThan(0);
    const mieux = ask({ producteur: 90, mixage: 150_000 });
    expect(mieux.qualite[1]).toBeGreaterThan(base.qualite[1]);
    expect(mieux.cout).toBeGreaterThan(base.cout);
    expect(ask({ sortie: 'album' }).semaines).toBeGreaterThan(base.semaines);
    expect(ask({ clip: 'gros' }).cout).toBeGreaterThan(base.cout);
    expect(
      pilot.handle({
        type: 'estimer-sortie',
        artisteId: 99999,
        sortie: 'single',
        clip: 'aucun',
        studio: 1,
        producteur: 1,
        mixage: 0,
      }).type,
    ).toBe('erreur');
  });
});
