import { useCallback, useState } from 'react';

const keyFor = (slug: string) => `tycoon:intro:${slug}`;

function alreadySeen(slug: string): boolean {
  try {
    return sessionStorage.getItem(keyFor(slug)) === '1';
  } catch {
    return false;
  }
}

/**
 * L'introduction d'un jeu ne se joue qu'une fois par session et par jeu, et jamais en
 * `prefers-reduced-motion`. `replay` permet de la revoir à la demande.
 */
export function useGameIntro(slug: string) {
  const [playing, setPlaying] = useState(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return !reduced && !alreadySeen(slug);
  });

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(keyFor(slug), '1');
    } catch {
      /* sessionStorage indisponible : l'intro se rejouera, sans conséquence */
    }
    setPlaying(false);
  }, [slug]);

  const replay = useCallback(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(true);
  }, []);

  return { playing, finish, replay };
}
