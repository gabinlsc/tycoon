import { type Rejection } from '@tycoon/core';
import { type Strings, fr } from './fr';

export { fr, type Strings };

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
