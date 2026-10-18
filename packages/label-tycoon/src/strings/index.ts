import { type Rejection } from '@tycoon/core';
import { EVENT_TEXTS, fillTemplate } from './evenements';
import { type Strings, fr } from './fr';

export { fr, type Strings };
export { EVENT_TEXTS, type EventText, fillTemplate } from './evenements';
export { FIL_TEMPLATES, type FilTemplate } from './fil';
export { OBJECTIF_TEXTES, RECORD_TEXTES, SUCCES_TEXTES } from './succes';

/** Chaînes actives. Une seule langue pour la V1 ; l'indirection prépare la traduction. */
export const strings: Strings = fr;

/** Message lisible pour un refus d'action, avec un repli sûr si le code est inconnu. */
export function describeRejection(rejection: Rejection, s: Strings = strings): string {
  const table = s.refus as Record<string, ((params: never) => string) | undefined>;
  const template = table[rejection.code];
  return template
    ? template((rejection.params ?? {}) as never)
    : `Action refusée (${rejection.code}).`;
}

/** Libellé d'un terme d'explication, avec la clé brute en repli pour ne jamais afficher un blanc. */
export function termLabel(key: string, s: Strings = strings): string {
  const table = s.explications as Record<string, string | undefined>;
  return table[key] ?? key;
}

/** Titre, texte et libellés de choix d'un événement, variables remplies. */
export function describeEvent(
  id: string,
  vars: Readonly<Record<string, string | number>>,
): { titre: string; texte: string; choix: Record<string, string> } | undefined {
  const text = EVENT_TEXTS[id];
  if (!text) return undefined;
  return {
    titre: fillTemplate(text.titre, vars),
    texte: fillTemplate(text.texte, vars),
    choix: { ...text.choix },
  };
}
