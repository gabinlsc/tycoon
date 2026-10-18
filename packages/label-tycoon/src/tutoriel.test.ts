import { cents, money } from '@tycoon/core';
import { describe, expect, it } from 'vitest';
import {
  type Acquittements,
  ETAPES_TUTORIEL,
  GRAINE_TUTORIEL,
  LabelPilot,
  type VueJeu,
  configTutoriel,
  etapeCourante,
  newGame,
} from './index';

function vue(p: LabelPilot, commande: Parameters<LabelPilot['handle']>[0]): VueJeu {
  const r = p.handle(commande);
  if (r.type !== 'vue') throw new Error(`vue attendue, reçu ${r.type} : ${JSON.stringify(r)}`);
  return r.vue;
}

describe('configuration du tutoriel', () => {
  it('impose son monde, quelle que soit la graine demandée', () => {
    const a = newGame('une', configTutoriel());
    const b = newGame('autre', configTutoriel());
    expect(JSON.stringify(a.engine.data)).toBe(JSON.stringify(b.engine.data));
    expect(a.engine.seed).toBe(GRAINE_TUTORIEL);
    expect(a.engine.data.config.mode).toBe('tutoriel');
  });
  it('est plus indulgent que la difficulté normale', () => {
    const d = configTutoriel().difficulty;
    expect(d.startingCash).toBeGreaterThan(1);
    expect(d.rivalAggression).toBeLessThan(1);
  });
});

describe('étapes', () => {
  it('sont au nombre de sept, uniques, et chacune a une consigne et un écran', () => {
    expect(ETAPES_TUTORIEL).toHaveLength(7);
    expect(new Set(ETAPES_TUTORIEL.map((e) => e.id)).size).toBe(7);
    for (const e of ETAPES_TUTORIEL) {
      expect(e.consigne.length).toBeGreaterThan(30);
      expect(e.manuelle === true || typeof e.fait === 'function').toBe(true);
    }
  });
  it('encadrent la partie par deux lectures et demandent une action entre les deux', () => {
    expect(ETAPES_TUTORIEL[0]?.manuelle).toBe(true);
    expect(ETAPES_TUTORIEL[ETAPES_TUTORIEL.length - 1]?.manuelle).toBe(true);
  });
});

describe('progression pendant une vraie partie', () => {
  it('avance étape par étape jusqu’au premier titre sorti', () => {
    const p = new LabelPilot();
    let v = vue(p, { type: 'nouvelle-partie', graine: 'x', config: configTutoriel() });
    const ack: Record<string, boolean> = {};
    const etape = (): number => etapeCourante(v, ack as Acquittements);

    expect(etape()).toBe(0);
    ack['bienvenue'] = true;
    expect(etape()).toBe(1);

    v = vue(p, { type: 'action', action: { type: 'reperer', source: 'open-mic' } });
    expect(v.suivis.length).toBeGreaterThan(0);
    expect(etape()).toBe(2);

    v = vue(p, { type: 'avancer', semaines: 2, arretSurSignal: false });
    expect(etape()).toBe(3);

    // Signature : on monte l'avance jusqu'à ce que le talent accepte.
    const suivi = v.suivis[0];
    if (!suivi) throw new Error('un talent suivi est attendu');
    let signe = false;
    for (const euros of [1500, 3000, 6000, 10_000, 15_000, 25_000]) {
      const r = p.handle({
        type: 'action',
        action: {
          type: 'signer',
          artisteId: suivi.id,
          clauses: {
            avance: cents(money.euros(euros)),
            royaltiesArtisteBps: 4500,
            dureeAnnees: 2,
            exclusivite: false,
            part360Bps: 0,
            clauseRachat: cents(0),
          },
        },
      });
      if (r.type === 'vue') {
        v = r.vue;
        signe = true;
        break;
      }
    }
    expect(signe).toBe(true);
    expect(etape()).toBe(4);

    v = vue(p, {
      type: 'action',
      action: {
        type: 'lancer-projet',
        artisteId: suivi.id,
        sortie: 'single',
        clip: 'aucun',
        studio: 20,
        producteur: 20,
        mixage: cents(money.euros(300)),
      },
    });
    expect(etape()).toBe(5);

    for (let i = 0; i < 12 && !v.projets.some((x) => x.statut === 'prete'); i += 1)
      v = vue(p, { type: 'avancer', semaines: 1, arretSurSignal: false });
    const projet = v.projets.find((x) => x.statut === 'prete');
    if (!projet) throw new Error('un projet prêt est attendu');
    v = vue(p, { type: 'action', action: { type: 'sortir-projet', projetId: projet.id } });
    expect(etape()).toBe(6);

    ack['fin'] = true;
    expect(etape()).toBe(ETAPES_TUTORIEL.length);
  });

  it('ne revient pas en arrière quand le talent signé quitte la liste de suivi', () => {
    const p = new LabelPilot();
    let v = vue(p, { type: 'nouvelle-partie', graine: 'x', config: configTutoriel() });
    v = vue(p, { type: 'action', action: { type: 'reperer', source: 'open-mic' } });
    v = vue(p, { type: 'avancer', semaines: 2, arretSurSignal: false });
    // Suivi vidé, mais deux semaines sont passées et un artiste est signé : l'étape « signer » est faite.
    const faux = { ...v, suivis: [], roster: [{ id: 1 }], projets: [] } as unknown as VueJeu;
    expect(etapeCourante(faux, { bienvenue: true })).toBe(4);
  });
  it('laisse les rivaux hors jeu pendant les premières semaines du tutoriel', () => {
    const p = new LabelPilot();
    vue(p, { type: 'nouvelle-partie', graine: 'x', config: configTutoriel() });
    const v = vue(p, { type: 'avancer', semaines: 14, arretSurSignal: false });
    expect(v.concurrence.affrontements.filter((a) => a.kind === 'signature-rivale')).toEqual([]);
  });
});
