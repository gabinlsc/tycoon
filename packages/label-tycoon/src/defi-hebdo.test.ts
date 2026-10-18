import { describe, expect, it } from 'vitest';
import {
  CONTRAINTES,
  LabelPilot,
  PLAFOND_ECURIE_REDUITE,
  type ContrainteId,
  configDefi,
  contrainteDeLaSemaine,
  estDefiHebdo,
  graineDuDefi,
  labelGame,
  newGame,
  rosterCap,
  scoutTalents,
  semaineDuDefi,
  semaineValide,
  validerSoumission,
} from './index';
import { Rng } from '@tycoon/core';

/** Première semaine de 2026 à 2030 dont la contrainte est celle demandée. */
function semaineAvec(id: ContrainteId): string {
  for (let annee = 2026; annee <= 2035; annee += 1)
    for (let n = 1; n <= 52; n += 1) {
      const semaine = `${annee}-S${String(n).padStart(2, '0')}`;
      if (contrainteDeLaSemaine(semaine).id === id) return semaine;
    }
  throw new Error(`aucune semaine pour ${id}`);
}

describe('identifiant de semaine', () => {
  it('suit la semaine ISO, y compris autour du nouvel an', () => {
    expect(semaineDuDefi(new Date('2026-01-01T12:00:00Z'))).toBe('2026-S01');
    expect(semaineDuDefi(new Date('2020-12-31T12:00:00Z'))).toBe('2020-S53');
    expect(semaineDuDefi(new Date('2021-01-03T23:59:00Z'))).toBe('2020-S53');
    expect(semaineDuDefi(new Date('2021-01-04T00:00:00Z'))).toBe('2021-S01');
    expect(semaineDuDefi(new Date('2024-12-30T08:00:00Z'))).toBe('2025-S01');
    expect(semaineDuDefi(new Date('2026-10-18T08:00:00Z'))).toBe('2026-S42');
  });
  it('reconnaît seulement les semaines qui existent', () => {
    expect(semaineValide('2026-S42')).toBe(true);
    expect(semaineValide('2020-S53')).toBe(true);
    expect(semaineValide('2021-S53')).toBe(false);
    expect(semaineValide('2026-S00')).toBe(false);
    expect(semaineValide('2026-S54')).toBe(false);
    expect(semaineValide('2026-42')).toBe(false);
    expect(estDefiHebdo('2026-S42')).toBe(true);
    expect(estDefiHebdo('2026-10-18')).toBe(false);
  });
});

describe('contrainte de la semaine', () => {
  it('est la même pour tous et touche toutes les contraintes au fil des semaines', () => {
    expect(contrainteDeLaSemaine('2026-S42')).toEqual(contrainteDeLaSemaine('2026-S42'));
    const vues = new Set<string>();
    for (let n = 1; n <= 52; n += 1)
      vues.add(contrainteDeLaSemaine(`2027-S${String(n).padStart(2, '0')}`).id);
    expect([...vues].sort()).toEqual(Object.keys(CONTRAINTES).sort());
  });
  it('impose un genre précis pour « un seul genre »', () => {
    const c = contrainteDeLaSemaine(semaineAvec('un-genre'));
    expect(c.genre).toBeTruthy();
  });
  it('règle la difficulté pour budget serré et rivaux aguerris', () => {
    const normal = configDefi('2026-10-18').difficulty;
    expect(configDefi(semaineAvec('budget-serre')).difficulty.startingCash).toBe(
      normal.startingCash * 0.5,
    );
    expect(configDefi(semaineAvec('rivaux-aguerris')).difficulty.rivalAggression).toBeGreaterThan(
      normal.rivalAggression,
    );
    expect(configDefi(semaineAvec('sans-emprunt')).difficulty).toEqual(normal);
  });
});

const partie = (semaine: string) => newGame(graineDuDefi(semaine), configDefi(semaine));

describe('contraintes respectées en jeu', () => {
  it('sans crédit : aucun prêt', () => {
    const s = partie(semaineAvec('sans-emprunt'));
    s.engine.data.label.tier = 'etabli';
    expect(
      labelGame.dispatch(s, { type: 'emprunter', montant: 100_000, semaines: 52 }),
    ).toMatchObject({
      ok: false,
      rejection: { code: 'contrainte-sans-emprunt' },
    });
  });
  it('sans scène : aucun concert', () => {
    const s = partie(semaineAvec('sans-concerts'));
    expect(
      labelGame.dispatch(s, { type: 'organiser-concert', artisteId: 1, salle: 'club', prix: 10 }),
    ).toMatchObject({ ok: false, rejection: { code: 'contrainte-sans-concerts' } });
  });
  it('écurie réduite : trois artistes au plus', () => {
    const s = partie(semaineAvec('roster-reduit'));
    s.engine.data.label.tier = 'major';
    expect(rosterCap(s.engine.data)).toBe(PLAFOND_ECURIE_REDUITE);
    expect(rosterCap(newGame('libre').engine.data)).toBeGreaterThan(0);
  });
  it('un seul genre : on ne signe que le genre de la semaine', () => {
    const semaine = semaineAvec('un-genre');
    const s = partie(semaine);
    scoutTalents(s.engine.data, Rng.fromSeed('g'), 'plateforme', 0);
    const genre = contrainteDeLaSemaine(semaine).genre;
    const autre = s.engine.data.artistes.find((a) => a.genre !== genre);
    if (!autre) throw new Error('artiste d’un autre genre attendu');
    expect(
      labelGame.dispatch(s, {
        type: 'signer',
        artisteId: autre.id,
        clauses: {
          avance: 0 as never,
          royaltiesArtisteBps: 5500,
          dureeAnnees: 2,
          exclusivite: false,
          part360Bps: 0,
          clauseRachat: 0 as never,
        },
      }),
    ).toMatchObject({ ok: false, rejection: { code: 'contrainte-un-genre' } });
  });
  it('un défi du jour n’a aucune contrainte', () => {
    const s = partie('2026-10-18');
    expect(rosterCap(s.engine.data)).toBeGreaterThan(0);
    expect(
      labelGame.dispatch(s, { type: 'organiser-concert', artisteId: 1, salle: 'club', prix: 10 }),
    ).not.toMatchObject({ rejection: { code: 'contrainte-sans-concerts' } });
  });
});

describe('défi de la semaine rejoué', () => {
  it('se valide par rejeu comme un défi du jour, avec son titre de partage', () => {
    const semaine = '2026-S42';
    const p = new LabelPilot();
    p.handle({
      type: 'nouvelle-partie',
      graine: graineDuDefi(semaine),
      config: configDefi(semaine),
    });
    p.handle({ type: 'action', action: { type: 'renommer-label', nom: 'Neon Dust' } });
    p.handle({ type: 'avancer', semaines: 52, arretSurSignal: false });
    const r = p.handle({ type: 'soumettre-defi' });
    if (r.type !== 'soumission') throw new Error('soumission attendue');
    expect(r.soumission.date).toBe(semaine);
    expect(validerSoumission(r.soumission)).toMatchObject({ statut: 'valide', date: semaine });
    const vue = p.handle({ type: 'vue' });
    if (vue.type !== 'vue') throw new Error('vue attendue');
    expect(vue.vue.defi?.type).toBe('semaine');
    expect(vue.vue.defi?.contrainte?.nom).toBeTruthy();
    expect(vue.vue.defi?.partage).toContain('Défi de la semaine 2026-S42');
  });
  it('refuse un journal qui enfreint la contrainte de la semaine', () => {
    const semaine = semaineAvec('sans-concerts');
    const brut = {
      version: 1,
      date: semaine,
      semaines: 52,
      scoreAnnonce: 0,
      journal: [
        { tick: 0, action: { type: 'organiser-concert', artisteId: 1, salle: 'club', prix: 10 } },
      ],
    };
    expect(validerSoumission(brut)).toMatchObject({ statut: 'refuse', code: 'action-refusee' });
  });
  it('refuse un identifiant qui n’est ni un jour ni une semaine', () => {
    expect(
      validerSoumission({
        version: 1,
        date: '2026-S60',
        semaines: 52,
        scoreAnnonce: 0,
        journal: [],
      }),
    ).toMatchObject({ statut: 'refuse', code: 'date' });
  });
});
