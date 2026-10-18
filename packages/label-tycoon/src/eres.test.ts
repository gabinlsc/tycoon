import { money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  ERA_SCHEDULE,
  ERES,
  ERE_IDS,
  cyclicPopularity,
  ereA,
  initialEras,
  labelGame,
  newGame,
  programmeDEres,
  prochaineEre,
  scoutTalents,
} from './index';
import { Rng } from '@tycoon/core';
import { certificationFor, certificationThreshold } from './charts';

describe('programme d’ères', () => {
  const p = programmeDEres(Rng.fromSeed('eres'));
  it('commence par le streaming et enchaîne des ères de 8 à 12 ans, toujours différentes', () => {
    expect(p[0]).toEqual({ ere: 'streaming', debut: 0 });
    expect(p).toHaveLength(ERA_SCHEDULE.programmed);
    for (let i = 1; i < p.length; i += 1) {
      const duree = (p[i]?.debut ?? 0) - (p[i - 1]?.debut ?? 0);
      expect(duree).toBeGreaterThanOrEqual(ERA_SCHEDULE.weeks.min);
      expect(duree).toBeLessThanOrEqual(ERA_SCHEDULE.weeks.max);
      expect(p[i]?.ere).not.toBe(p[i - 1]?.ere);
    }
  });
  it('est déterminé par la graine seule', () => {
    expect(initialEras('a')).toEqual(initialEras('a'));
    expect(initialEras('a').programme).not.toEqual(initialEras('b').programme);
  });
  it('donne l’ère en vigueur à une semaine donnée', () => {
    const eras = initialEras('x');
    const deuxieme = eras.programme[1];
    if (!deuxieme) throw new Error('deuxième ère attendue');
    expect(ereA(eras, 0)).toBe('streaming');
    expect(ereA(eras, deuxieme.debut - 1)).toBe('streaming');
    expect(ereA(eras, deuxieme.debut)).toBe(deuxieme.ere);
  });
});

describe('règles des ères', () => {
  it('l’ère de départ est neutre et chaque ère change quelque chose', () => {
    const d = ERES.streaming;
    expect([d.streaming, d.physique, d.concerts, d.certification, d.viral, d.cycles]).toEqual([
      1, 1, 1, 1, 1, 1,
    ]);
    for (const id of ERE_IDS.filter((e) => e !== 'streaming')) {
      const r = ERES[id];
      expect(
        [r.streaming, r.physique, r.concerts, r.certification, r.viral, r.cycles].some(
          (x) => x !== 1,
        ),
      ).toBe(true);
      expect(r.indices).toHaveLength(ERA_SCHEDULE.hintsAt.length);
    }
  });
  it('modifie le seuil de certification et l’amplitude des cycles de genre', () => {
    expect(certificationThreshold('or', 'single', 1.25)).toBeGreaterThan(
      certificationThreshold('or', 'single'),
    );
    const streams = certificationThreshold('or', 'single') * 150;
    expect(certificationFor(streams, 'single')).toBe('or');
    expect(certificationFor(streams, 'single', 1.25)).toBeNull();
    const calme = cyclicPopularity(50, 1, 100, 0.5) - 50;
    const agite = cyclicPopularity(50, 1, 100, 1.5) - 50;
    expect(Math.abs(agite)).toBeGreaterThan(Math.abs(calme));
  });
});

describe('une partie qui traverse les ères', () => {
  const avecProgramme = () => {
    const s = newGame('eres-jeu');
    s.engine.data.eres.programme = [
      { ere: 'streaming', debut: 0 },
      { ere: 'direct', debut: 60 },
    ];
    s.engine.data.label.tresorerie = money.euros(1_000_000);
    return s;
  };
  it('annonce l’ère suivante par des indices, révèle son nom au dernier moment, puis bascule', () => {
    let s = avecProgramme();
    const signaux: { semaine: number; texte: string }[] = [];
    let changement = -1;
    for (let w = 0; w < 66; w += 1) {
      const r = labelGame.advance(s, 1);
      s = r.session;
      for (const x of r.signals) {
        if (x.kind === 'signal-ere')
          signaux.push({ semaine: w, texte: String(x.payload?.['texte']) });
        if (x.kind === 'changement-ere' && x.interrupt) changement = w;
      }
    }
    expect(signaux.map((x) => x.semaine)).toEqual([8, 34, 52]);
    expect(signaux.map((x) => x.texte)).toEqual(ERES.direct.indices);
    expect(changement).toBe(60);
    expect(s.engine.data.eres.courante).toBe('direct');
    expect(s.engine.data.fil.some((a) => a.kind === 'changement-ere')).toBe(true);
  });
  it('limite ce que le joueur sait de l’ère suivante', () => {
    const eras = avecProgramme().engine.data.eres;
    expect(prochaineEre(eras, 0)).toMatchObject({ dans: 60, indice: null, nom: null });
    expect(prochaineEre(eras, 20)?.indice).toBe(ERES.direct.indices[0]);
    expect(prochaineEre(eras, 40)?.indice).toBe(ERES.direct.indices[1]);
    expect(prochaineEre(eras, 54)?.indice).toBe(ERES.direct.indices[2]);
    expect(prochaineEre(eras, 54)?.nom).toBeNull();
    expect(prochaineEre(eras, 57)?.nom).toBe(ERES.direct.nom);
    expect(prochaineEre(eras, 61)).toBeNull();
  });
  it('change vraiment les revenus : le direct-to-fan paie mieux les concerts que le streaming', () => {
    const recette = (ere: 'streaming' | 'direct') => {
      let s = newGame('eres-concert');
      const d = s.engine.data;
      d.eres.programme = [{ ere, debut: 0 }];
      d.eres.courante = ere;
      const artiste = scoutTalents(d, Rng.fromSeed('c'), 'plateforme', 0)[0];
      if (!artiste) throw new Error('artiste attendu');
      artiste.employeur = 'joueur';
      artiste.fanbase = 300_000;
      artiste.hype = 60;
      d.concerts.push({
        id: 500,
        artisteId: artiste.id,
        salle: 'salle',
        prix: 20,
        date: 0,
        resolu: false,
        spectateurs: 0,
        recette: 0,
        tourneeId: null,
      });
      s = labelGame.advance(s, 1).session;
      return s.engine.data.concerts[0]?.recette ?? 0;
    };
    const base = recette('streaming');
    expect(base).toBeGreaterThan(0);
    expect(recette('direct')).toBeGreaterThan(base * 1.2);
  });
});
