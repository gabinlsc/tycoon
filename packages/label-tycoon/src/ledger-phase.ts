import type { Phase } from '@tycoon/core';
import { financePhase } from './finance';
import { loansWeek } from './loans';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';

/** Phase « finances » : échéances des prêts, puis frais courants, clôture et alerte de trésorerie. */
export const ledgerPhase: Phase<LabelState, LabelSignal> = {
  name: 'finances',
  run(state, ctx) {
    loansWeek(state, ctx.emit);
    financePhase.run(state, ctx);
  },
};
