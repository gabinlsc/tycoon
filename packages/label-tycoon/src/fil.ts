import type { Phase, Rng } from '@tycoon/core';
import { ERES } from './balance';
import type { LabelSignal } from './pipeline';
import type { LabelState } from './state';
import { FIL_TEMPLATES, fillTemplate } from './strings';
import { fr } from './strings/fr';

/** Une actu du Fil du label : titre et accroche déjà rédigés, avec le type de signal d'origine. */
export interface Actu {
  id: number;
  semaine: number;
  kind: string;
  importance: 1 | 2 | 3;
  titre: string;
  texte: string;
  /** Artiste concerné, pour le filtre et le lien dans l'interface. */
  artisteId: number | null;
}

export const FIL_LIMIT = 200;

type Payload = Readonly<Record<string, unknown>>;

/** Variables d'un gabarit, résolues à partir de la charge du signal et de l'état. */
export function filVars(state: LabelState, payload: Payload): Record<string, string | number> {
  const vars: Record<string, string | number> = {};
  const projet = state.projets.find((p) => p.id === Number(payload['projetId']));
  const artisteId = payload['artisteId'] ?? projet?.artisteId;
  const artist = state.artistes.find((a) => a.id === Number(artisteId));
  if (artist) vars['nom'] = artist.nomScene;
  const parent = state.artistes.find((a) => a.id === Number(payload['parentId']));
  if (parent) vars['parent'] = parent.nomScene;
  const rival = state.rivaux.find((r) => r.id === Number(payload['rivalId']));
  vars['rival'] = rival?.nom ?? 'Un label rival';
  if (typeof payload['categorie'] === 'string') vars['categorie'] = payload['categorie'];
  if (typeof payload['niveau'] === 'string') vars['niveau'] = payload['niveau'];
  if (typeof payload['palier'] === 'string')
    vars['palier'] = fr.tiers[payload['palier'] as keyof typeof fr.tiers] ?? payload['palier'];
  if (typeof payload['texte'] === 'string') vars['texte'] = payload['texte'];
  if (typeof payload['ere'] === 'string')
    vars['ere'] = ERES[payload['ere'] as keyof typeof ERES]?.nom ?? payload['ere'];
  if (typeof payload['ville'] === 'string') vars['ville'] = payload['ville'];
  if (typeof payload['genre'] === 'string')
    vars['genre'] =
      (fr.genres as Record<string, string | undefined>)[payload['genre']] ??
      state.sousGenres.find((g) => g.id === payload['genre'])?.nom ??
      payload['genre'];
  const n = payload['spectateurs'] ?? payload['restantes'];
  if (typeof n === 'number') vars['n'] = n;
  vars['nom'] ??= 'Un artiste du label';
  return vars;
}

/** Rédige une actu pour un signal, ou `null` si ce type de signal n'a pas de gabarit. */
export function composeActu(
  state: LabelState,
  rng: Rng,
  kind: string,
  payload: Payload,
  tick: number,
): Actu | null {
  const template = FIL_TEMPLATES[kind];
  if (!template) return null;
  const vars = filVars(state, payload);
  const last = state.filMemoire[kind];
  let index = rng.int(0, template.titres.length - 1);
  if (index === last && template.titres.length > 1) index = (index + 1) % template.titres.length;
  state.filMemoire[kind] = index;
  const actu: Actu = {
    id: state.nextId,
    semaine: tick,
    kind,
    importance: template.importance,
    titre: fillTemplate(template.titres[index] ?? '', vars),
    texte: fillTemplate(template.textes[rng.int(0, template.textes.length - 1)] ?? '', vars),
    artisteId: typeof payload['artisteId'] === 'number' ? payload['artisteId'] : null,
  };
  state.nextId += 1;
  return actu;
}

/** Phase « fil » : transforme les signaux du tick en actus, en gardant les plus récentes. */
export const filPhase: Phase<LabelState, LabelSignal> = {
  name: 'fil',
  run(state, ctx) {
    const signals = ctx.signalsThisTick?.() ?? [];
    if (signals.length === 0) return;
    const rng = ctx.rng('noms');
    for (const s of signals) {
      const actu = composeActu(state, rng, s.kind, s.payload ?? {}, ctx.tick);
      if (actu) state.fil.push(actu);
    }
    if (state.fil.length > FIL_LIMIT) state.fil.splice(0, state.fil.length - FIL_LIMIT);
  },
};
