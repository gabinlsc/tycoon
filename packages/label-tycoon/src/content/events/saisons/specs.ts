import type { EventText } from '../../../strings/evenements';
import type { EvenementSpec } from './moteur';
import { FESTIVALS } from './festivals';
import { FETES } from './fetes';
import { RENTREE } from './rentree';
import { TECHNOLOGIES } from './technologies';
import { TURBULENCES } from './turbulences';

export const EVENEMENTS_SAISONNIERS_SPECS: readonly EvenementSpec[] = [
  ...FESTIVALS,
  ...RENTREE,
  ...FETES,
  ...TURBULENCES,
  ...TECHNOLOGIES,
];

/** Textes des événements saisonniers, fusionnés avec ceux des autres événements. */
export const TEXTES_SAISONNIERS = textes(EVENEMENTS_SAISONNIERS_SPECS);

/** Titres, accroches et libellés de choix de toutes les spécifications. */
function textes(specs: readonly EvenementSpec[]): Record<string, EventText> {
  return Object.fromEntries(
    specs.map((s) => [
      s.id,
      {
        titre: s.titre,
        texte: s.texte,
        ...(s.choix ? { choix: Object.fromEntries(s.choix.map((c) => [c.id, c.texte])) } : {}),
      },
    ]),
  );
}
