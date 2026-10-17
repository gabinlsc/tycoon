import { useEffect, useRef } from 'react';

/**
 * Léger parallaxe vertical : l'élément remonte à `speed` fois la vitesse du défilement.
 * Un seul écouteur passif, écriture dans requestAnimationFrame, et rien du tout en reduced-motion.
 * On écrit dans une variable CSS plutôt que dans `style.transform` pour laisser le CSS composer.
 */
export function useParallax<T extends HTMLElement>(speed = 0.12) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      // Au-delà d'un écran, l'effet n'est plus visible : on le fige.
      const offset = Math.min(window.scrollY, window.innerHeight) * speed;
      node.style.setProperty('--parallax-y', `${-offset.toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [speed]);

  return ref;
}
