import { useEffect } from 'react';
import { SITE } from '../config/site';

/** Titre d'onglet par page : « Page · Nom du site », ou le nom seul sur l'accueil. */
export function usePageTitle(page?: string): void {
  useEffect(() => {
    document.title = page
      ? `${page} · ${SITE.name}`
      : `${SITE.name} — six jeux de gestion à lancer dans ton navigateur`;
  }, [page]);
}
