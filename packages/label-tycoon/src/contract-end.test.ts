import { Rng, cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import { CONTRACT_END, labelGame, newGame, scoutTalents } from './index';
import type { Clauses } from './index';

const good: Clauses = {
  avance: money.euros(6000),
  royaltiesArtisteBps: 8000,
  dureeAnnees: 1,
  exclusivite: false,
  part360Bps: 0,
  clauseRachat: cents(0),
};

const signed = (over: Partial<Clauses> = {}) => {
  const session = newGame('fin');
  session.engine.data.label.tresorerie = money.euros(500_000);
  for (const r of session.engine.data.rivaux) r.personnalite = 'major';
  scoutTalents(session.engine.data, Rng.fromSeed('f'), 'plateforme', 0);
  const artist = session.engine.data.artistes[0];
  if (!artist) throw new Error('artiste attendu');
  const r = labelGame.dispatch(session, {
    type: 'signer',
    artisteId: artist.id,
    clauses: { ...good, ...over },
  });
  if (!r.ok) throw new Error('signature attendue');
  return { session: r.session, id: artist.id };
};

describe('fin de contrat', () => {
  it("signale l'échéance avec auto-pause, puis laisse partir après la grâce", () => {
    const { session, id } = signed();
    const echeance = session.engine.data.contrats[0]?.echeance ?? 0;
    const result = labelGame.advance(session, echeance + 1);
    expect(result.signals.some((s) => s.kind === 'fin-de-contrat')).toBe(true);
    const gone = labelGame.advance(session, echeance + CONTRACT_END.graceWeeks + 2).session;
    expect(gone.engine.data.contrats).toHaveLength(0);
    expect(gone.engine.data.artistes.find((a) => a.id === id)?.employeur).toBe('libre');
  });

  it('une renégociation acceptée renouvelle le contrat', () => {
    const { session, id } = signed();
    const r = labelGame.dispatch(session, {
      type: 'renegocier',
      artisteId: id,
      clauses: { ...good, dureeAnnees: 2 },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.session.engine.data.contrats[0]?.clauses.dureeAnnees).toBe(2);
    const refus = labelGame.dispatch(session, {
      type: 'renegocier',
      artisteId: id,
      clauses: { ...good, royaltiesArtisteBps: 1000, avance: cents(0), dureeAnnees: 6 },
    });
    expect(refus).toMatchObject({ ok: false, rejection: { code: 'offre-refusee' } });
  });

  it("la rupture coûte une pénalité et de l'affinité, et libère l'artiste", () => {
    const { session, id } = signed();
    const before = session.engine.data.label.tresorerie;
    const artistBefore = session.engine.data.artistes.find((a) => a.id === id)?.affinite ?? 0;
    const r = labelGame.dispatch(session, { type: 'rompre-contrat', artisteId: id });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const d = r.session.engine.data;
    expect(d.label.tresorerie).toBeLessThanOrEqual(before - good.avance);
    expect(d.artistes.find((a) => a.id === id)?.affinite).toBe(
      artistBefore - CONTRACT_END.breakAffinityLoss,
    );
    expect(d.contrats).toHaveLength(0);
  });

  it('libérer sans contrat est refusé', () => {
    const { session, id } = signed();
    const freed = labelGame.dispatch(session, { type: 'liberer-artiste', artisteId: id });
    expect(freed.ok).toBe(true);
    if (!freed.ok) return;
    expect(
      labelGame.dispatch(freed.session, { type: 'liberer-artiste', artisteId: id }),
    ).toMatchObject({
      ok: false,
      rejection: { code: 'contrat-introuvable' },
    });
  });
});
