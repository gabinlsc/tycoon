import type { Phase } from '@tycoon/core';
import type { LabelSignal } from './pipeline';
import { physicalWeek } from './pressing';
import type { LabelState } from './state';

/** Phase « tournées » : physique, puis concerts, tournées, merch et synchro à mesure qu'ils arrivent. */
export const livePhase: Phase<LabelState, LabelSignal> = {
  name: 'tournees',
  run(state, ctx) {
    physicalWeek(state, ctx.tick);
  },
};
