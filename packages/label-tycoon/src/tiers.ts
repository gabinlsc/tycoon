import type { Phase } from '@tycoon/core';
import { TIERS, type CertificationLevel, type TierId } from './balance';
import { bestCertification } from './charts';
import { annualRevenue } from './finance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

const CERT_RANK: Record<CertificationLevel, number> = { or: 1, platine: 2, diamant: 3 };

export const tierRank = (tier: TierId): number => TIERS.findIndex((t) => t.id === tier);

/** Vrai si le label a au moins ce palier. */
export const tierAtLeast = (state: LabelState, tier: TierId): boolean =>
  tierRank(state.label.tier) >= tierRank(tier);

/** Palier le plus élevé que les ressources du label permettent d'atteindre, d'un seul cran à la fois. */
export function nextTier(state: LabelState): TierId | null {
  const next = TIERS[tierRank(state.label.tier) + 1];
  if (!next) return null;
  const cert = bestCertification(state);
  const certOk =
    !next.requiredCertification ||
    (cert !== null && CERT_RANK[cert] >= CERT_RANK[next.requiredCertification]);
  return state.label.reputation >= next.minReputation &&
    annualRevenue(state) >= next.minAnnualRevenue &&
    certOk
    ? next.id
    : null;
}

/** Phase « paliers » : monte d'un palier quand toutes les conditions sont réunies (jamais de recul). */
export const tiersPhase: Phase<LabelState, LabelSignal> = {
  name: 'paliers',
  run(state, ctx) {
    const next = nextTier(state);
    if (!next) return;
    state.label.tier = next;
    ctx.emit({ kind: 'palier', payload: { palier: next }, interrupt: true } as LabelSignal);
  },
};
