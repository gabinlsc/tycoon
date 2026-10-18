import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { PRODUCTION, RELEASE_TYPES, labelGame, newGame, projectCost, scoutTalents } from './index';
import type { LabelAction } from './index';

const signedArtist = () => {
  const session = newGame('prod');
  session.engine.data.label.tresorerie = money.euros(500_000);
  scoutTalents(session.engine.data, Rng.fromSeed('p'), 'plateforme', 0);
  const artist = session.engine.data.artistes[0];
  if (!artist) throw new Error('artiste attendu');
  artist.employeur = 'joueur';
  return { session, id: artist.id };
};

const launch = (id: number, over: Partial<LabelAction> = {}): LabelAction =>
  ({
    type: 'lancer-projet',
    artisteId: id,
    sortie: 'single',
    clip: 'aucun',
    studio: 50,
    producteur: 60,
    mixage: money.euros(800),
    ...over,
  }) as LabelAction;

describe('lancement de projet', () => {
  it('débite le coût total et crée un projet en production', () => {
    const { session, id } = signedArtist();
    const before = session.engine.data.label.tresorerie;
    const r = labelGame.dispatch(session, launch(id));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.session.engine.data;
    expect(d.label.tresorerie).toBe(before - projectCost('single', 'aucun', 50, money.euros(800)));
    expect(d.projets[0]).toMatchObject({ statut: 'production', qualite: null, type: 'single' });
  });

  it('refuse un artiste non signé, un studio saturé et des fonds insuffisants', () => {
    const { session, id } = signedArtist();
    const art = session.engine.data.artistes[0];
    if (art) art.employeur = 'libre';
    expect(labelGame.dispatch(session, launch(id))).toMatchObject({
      ok: false,
      rejection: { code: 'artiste-non-signe' },
    });
    if (art) art.employeur = 'joueur';
    let s = session;
    for (let i = 0; i < PRODUCTION.capacity; i += 1) {
      const r = labelGame.dispatch(s, launch(id));
      if (r.ok) s = r.session;
    }
    expect(labelGame.dispatch(s, launch(id))).toMatchObject({
      ok: false,
      rejection: { code: 'studio-sature' },
    });
    const poor = signedArtist();
    poor.session.engine.data.label.tresorerie = cents(10);
    expect(labelGame.dispatch(poor.session, launch(poor.id))).toMatchObject({
      ok: false,
      rejection: { code: 'fonds-insuffisants' },
    });
  });
});

describe('déroulé', () => {
  it('termine le projet avec une qualité bornée, avec auto-pause, puis le fait sortir', () => {
    const { session, id } = signedArtist();
    const started = labelGame.dispatch(session, launch(id));
    if (!started.ok) throw new Error('lancement attendu');
    const fin = started.session.engine.data.projets[0]?.fin ?? 0;
    const done = labelGame.advance(started.session, fin + 1);
    const p = done.session.engine.data.projets[0];
    expect(p?.statut).toBe('prete');
    expect(p?.qualite).toBeGreaterThanOrEqual(0);
    expect(p?.qualite).toBeLessThanOrEqual(100);
    expect(done.signals.some((s) => s.kind === 'projet-termine')).toBe(true);
    const out = labelGame.dispatch(done.session, { type: 'sortir-projet', projetId: p?.id ?? 0 });
    expect(out.ok && out.session.engine.data.projets[0]?.statut).toBe('sortie');
    expect(
      labelGame.dispatch(started.session, { type: 'sortir-projet', projetId: p?.id ?? 0 }),
    ).toMatchObject({
      ok: false,
      rejection: { code: 'projet-pas-pret' },
    });
  });

  it("un album dure plus longtemps et coûte plus cher qu'un single, rejouable à l'identique", () => {
    expect(RELEASE_TYPES.album.semaines).toBeGreaterThan(RELEASE_TYPES.single.semaines);
    expect(projectCost('album', 'aucun', 50, 0)).toBeGreaterThan(
      projectCost('single', 'aucun', 50, 0),
    );
    const run = () => {
      const { session, id } = signedArtist();
      const r = labelGame.dispatch(session, launch(id, { sortie: 'ep' } as never));
      if (!r.ok) throw new Error('lancement attendu');
      return labelGame.advance(r.session, 40).session.engine.data.projets[0];
    };
    expect(run()).toEqual(run());
  });
});
