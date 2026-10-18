import type { Phase } from '@tycoon/core';
import type { LabelSignal } from './pipeline';
import { concertsWeek } from './concerts';
import { festivalsWeek } from './festivals';
import { physicalWeek } from './pressing';
import type { LabelState } from './state';

/** Phase « tournées » : physique, puis concerts, tournées, merch et synchro à mesure qu'ils arrivent. */
export const livePhase: Phase<LabelState, LabelSignal> = {
  name: 'tournees',
  run(state, ctx) {
    physicalWeek(state, ctx.tick);
    concertsWeek(state, ctx.tick, ctx.emit);
    festivalsWeek(state, ctx.tick, ctx.rng('tournees'), ctx.emit);
  },
};
