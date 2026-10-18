import { type Consequence, type EventContext, type Vars, cents, clamp, money } from '@tycoon/core';
import { genreKeys } from '../../../market';
import { tierRank } from '../../../tiers';
import type { LabelState } from '../../../state';
import { fr } from '../../../strings/fr';
import {
  type LabelEvent,
  about,
  affinity,
  cash,
  fatigue,
  fans,
  hype,
  loyalty,
  moral,
  pickArtist,
  reputation,
  roster,
  sizedCost,
  target,
} from '../helpers';
import { type SaisonId, saisonActive } from '../../../saisons';

/** Un effet d'événement saisonnier, décrit en données. Les montants sont donnés à l'échelle d'un petit label. */
export type Effet =
  | { t: 'cash'; euros: number }
  | { t: 'reputation'; v: number }
  | { t: 'hype' | 'moral' | 'fatigue' | 'loyaute' | 'affinite'; v: number }
  | { t: 'fans'; pct: number }
  | { t: 'tousHype'; v: number }
  | { t: 'genre'; v: number }
  | { t: 'streaming'; pct: number };

export interface ChoixSpec {
  id: string;
  texte: string;
  effets: Effet[];
  /** Coût minimal de trésorerie (euros, à l'échelle du label) pour que le choix soit proposé. */
  exige?: number;
}

export interface EvenementSpec {
  id: string;
  saison: SaisonId;
  titre: string;
  texte: string;
  /** Poids de tirage pendant la saison. */
  poids?: number;
  cooldown?: number;
  /** Cible tirée au hasard : un artiste du roster, un genre, ou rien. */
  cible?: 'artiste' | 'genre';
  effets?: Effet[];
  choix?: ChoixSpec[];
  /** Choix pris à l'échéance (le dernier choix par défaut). */
  defaut?: string;
}

/** Échelle des montants selon le palier du label : un événement coûte ce qu'un label de cette taille peut payer. */
const ECHELLE = [1, 2, 4, 10, 40, 120, 400] as const;
export const echelle = (d: LabelState): number => ECHELLE[tierRank(d.label.tier)] ?? 1;

const montant = (d: LabelState, euros: number): number =>
  Math.round(money.euros(euros) * echelle(d));

function appliquer(d: LabelState, vars: Vars, effets: readonly Effet[]) {
  const out: Consequence[] = [];
  const a = target(d, vars);
  for (const e of effets) {
    switch (e.t) {
      case 'cash': {
        const m = montant(d, Math.abs(e.euros));
        out.push(cash(d, e.euros >= 0 ? m : -sizedCost(d, m)));
        break;
      }
      case 'reputation':
        out.push(reputation(d, e.v));
        break;
      case 'tousHype':
        for (const r of roster(d)) out.push(hype(r, e.v));
        break;
      case 'genre': {
        const g = d.marche.genres[String(vars['genre'])];
        if (g) g.base = clamp(g.base + e.v, 5, 95);
        out.push({ kind: 'genre', params: { genre: String(vars['genre']), delta: e.v } });
        break;
      }
      case 'streaming':
        d.marche.facteurStreaming = clamp(d.marche.facteurStreaming * (1 + e.pct / 100), 0.6, 1.5);
        out.push({ kind: 'remuneration-streaming', params: { pct: e.pct } });
        break;
      case 'fans':
        if (a) out.push(fans(a, Math.round((a.fanbase * e.pct) / 100)));
        break;
      case 'hype':
        if (a) out.push(hype(a, e.v));
        break;
      case 'moral':
        if (a) out.push(moral(a, e.v));
        break;
      case 'fatigue':
        if (a) out.push(fatigue(a, e.v));
        break;
      case 'loyaute':
        if (a) out.push(loyalty(a, e.v));
        break;
      case 'affinite':
        if (a) out.push(affinity(a, e.v));
        break;
    }
  }
  return out;
}

const besoinArtiste = (effets: readonly Effet[]): boolean =>
  effets.some((e) => ['hype', 'moral', 'fatigue', 'loyaute', 'affinite', 'fans'].includes(e.t));

/** Transforme une spécification en événement du moteur. */
export function evenement(spec: EvenementSpec): LabelEvent {
  const cible =
    spec.cible ??
    (besoinArtiste([...(spec.effets ?? []), ...(spec.choix ?? []).flatMap((c) => c.effets)])
      ? 'artiste'
      : undefined);
  const poids = spec.poids ?? 2;
  return {
    id: spec.id,
    category: 'saisons',
    weight: (d, tick) => (saisonActive(spec.saison, d, tick) ? poids : 0),
    when: (d, tick) =>
      saisonActive(spec.saison, d, tick) && (cible !== 'artiste' || roster(d).length > 0),
    cooldown: spec.cooldown ?? 52,
    prepare: (d: LabelState, ctx: EventContext) => {
      if (cible === 'artiste') {
        const a = pickArtist(d, ctx);
        return a ? about(a) : null;
      }
      if (cible === 'genre') {
        const ids = genreKeys(d.marche);
        if (ids.length === 0) return null;
        const genre = ctx.rng('marche').pick(ids);
        const nom =
          (fr.genres as Record<string, string | undefined>)[genre] ??
          d.sousGenres.find((s) => s.id === genre)?.nom ??
          genre;
        return { genre, genreNom: nom };
      }
      return {};
    },
    ...(spec.effets ? { apply: (d, _c, vars) => appliquer(d, vars, spec.effets ?? []) } : {}),
    ...(spec.choix
      ? {
          choices: spec.choix.map((c) => ({
            id: c.id,
            ...(c.exige !== undefined
              ? { when: (d: LabelState) => d.label.tresorerie >= montant(d, c.exige ?? 0) }
              : {}),
            apply: (d: LabelState, _ctx: EventContext, vars: Vars) => appliquer(d, vars, c.effets),
          })),
          defaultChoice: spec.defaut ?? spec.choix[spec.choix.length - 1]?.id ?? '',
        }
      : {}),
  };
}

export { cents };
