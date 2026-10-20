// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  type EtatRecompenses,
  BONUS_MENSUEL,
  depenser,
  gainDuJour,
  reclamerMensuel,
  reclamerQuotidien,
  veille,
} from './recompenses';

const vide: EtatRecompenses = { pieces: 0, serie: 0, dernierJour: null, moisReclames: [] };

describe('récompenses quotidiennes', () => {
  it('calcule la veille, y compris au changement de mois et d’année', () => {
    expect(veille('2026-03-01')).toBe('2026-02-28');
    expect(veille('2027-01-01')).toBe('2026-12-31');
  });

  it('ne se réclame qu’une fois par jour', () => {
    const e = reclamerQuotidien(vide, '2026-10-20', 'gratuit');
    expect(e?.pieces).toBe(10);
    expect(e && reclamerQuotidien(e, '2026-10-20', 'gratuit')).toBeNull();
  });

  it('enchaîne la série jour après jour jusqu’au gros lot du septième jour', () => {
    let e: EtatRecompenses = vide;
    const jours = ['16', '17', '18', '19', '20', '21', '22'];
    for (const j of jours) e = reclamerQuotidien(e, `2026-10-${j}`, 'gratuit') ?? e;
    expect(e.serie).toBe(7);
    expect(e.pieces).toBe(10 + 15 + 20 + 25 + 30 + 40 + 100);
    expect(gainDuJour(e, '2026-10-23', 'gratuit')).toBe(10);
  });

  it('repart de zéro quand un jour est manqué', () => {
    const a = reclamerQuotidien(vide, '2026-10-16', 'gratuit');
    const b = a && reclamerQuotidien(a, '2026-10-17', 'gratuit');
    const c = b && reclamerQuotidien(b, '2026-10-20', 'gratuit');
    expect(c?.serie).toBe(1);
  });

  it('multiplie le gain selon l’offre', () => {
    expect(reclamerQuotidien(vide, '2026-10-20', 'pro')?.pieces).toBe(20);
    expect(reclamerQuotidien(vide, '2026-10-20', 'legende')?.pieces).toBe(30);
  });
});

describe('bonus mensuel et dépenses', () => {
  it('se réclame une fois par mois, plus gros avec l’offre', () => {
    const e = reclamerMensuel(vide, '2026-10', 'legende');
    expect(e?.pieces).toBe(BONUS_MENSUEL.legende);
    expect(e && reclamerMensuel(e, '2026-10', 'legende')).toBeNull();
    expect(e && reclamerMensuel(e, '2026-11', 'legende')).not.toBeNull();
  });

  it('refuse une dépense au-delà du solde', () => {
    expect(depenser({ ...vide, pieces: 50 }, 80)).toBeNull();
    expect(depenser({ ...vide, pieces: 50 }, 20)?.pieces).toBe(30);
  });
});
