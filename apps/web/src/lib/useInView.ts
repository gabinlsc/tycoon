import { useEffect, useRef, useState } from 'react';

/**
 * Devient vrai (et le reste) dès que l'élément entre dans le viewport.
 * Sans IntersectionObserver ou en reduced-motion, l'élément est considéré visible tout de suite :
 * le contenu n'est jamais caché derrière une animation qui ne se jouerait pas.
 */
export function useInView<T extends Element>(threshold = 0.1) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
