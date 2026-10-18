import { type Action, type ActionHandler, type ResolveEventAction, reject } from '@tycoon/core';
import { LABEL_NAME_MAX } from './balance';
import type { LabelSignal } from './pipeline';
import type { BreakAction, ReleaseAction, RenegotiateAction } from './contract-end';
import type { LaunchAction, ReleaseAction as ReleaseProjectAction } from './production';
import type { ApplyFestivalAction } from './festivals';
import type { TourAction } from './tours';
import type { ConcertAction } from './concerts';
import type { PressAction } from './pressing';
import type { BuildAction } from './buildings';
import type { ConfigureAction } from './delegation';
import type { FireAction, HireAction } from './staff';
import type { StudyAction } from './forecast';
import type { AuctionAction } from './auction';
import type { SignAction } from './contracts';
import type { ProposeAction } from './negotiation';
import type {
  DropProspectAction,
  FireScoutAction,
  HireScoutAction,
  ScoutAction,
  TrialAction,
} from './scouting';
import type { LabelState } from './state';

export interface RenameLabelAction extends Action {
  readonly type: 'renommer-label';
  readonly nom: string;
}

/** Toutes les actions du joueur. Une action = une entrée du journal, rejouable. */
export type LabelAction =
  | RenameLabelAction
  | ResolveEventAction
  | ScoutAction
  | DropProspectAction
  | TrialAction
  | HireScoutAction
  | FireScoutAction
  | SignAction
  | ProposeAction
  | AuctionAction
  | RenegotiateAction
  | BreakAction
  | ReleaseAction
  | LaunchAction
  | ReleaseProjectAction
  | StudyAction
  | HireAction
  | FireAction
  | ConfigureAction
  | BuildAction
  | PressAction
  | ConcertAction
  | TourAction
  | ApplyFestivalAction;

export const renameLabel: ActionHandler<LabelState, RenameLabelAction, LabelSignal> = {
  validate(_state, action) {
    const nom = action.nom.trim();
    if (nom === '') return reject('nom-vide');
    if ([...nom].length > LABEL_NAME_MAX) return reject('nom-trop-long', { max: LABEL_NAME_MAX });
    return null;
  },
  apply(state, action) {
    state.label.nom = action.nom.trim();
  },
};
