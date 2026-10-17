const KEY = 'tycoon-intro-played';

/**
 * L'animation « d'impression » ne se joue qu'une fois par session, et jamais
 * si l'utilisateur préfère moins de mouvement. Le résultat est posé en attribut
 * sur <html> : le CSS n'a plus qu'à s'y accrocher.
 */
export function initIntro(): void {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let played = false;
  try {
    played = sessionStorage.getItem(KEY) === '1';
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* sessionStorage indisponible : on rejoue, sans conséquence */
  }
  root.dataset.intro = reduced || played ? 'skip' : 'play';
}
