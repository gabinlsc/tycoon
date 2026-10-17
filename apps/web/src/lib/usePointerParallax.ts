import { useEffect, useRef } from 'react';

/**
 * Pose les variables CSS --px et --py (de -0,5 à 0,5) selon la position du pointeur dans l'élément,
 * pour faire bouger légèrement son contenu (emblème qui suit la souris). Inactif sur tactile et
 * en reduced-motion.
 */
export function usePointerParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const canHover = window.matchMedia(
      '(hover: hover) and (prefers-reduced-motion: no-preference)',
    ).matches;
    if (!canHover) return;
    const onMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      node.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
      node.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
    };
    const onLeave = () => {
      node.style.setProperty('--px', '0');
      node.style.setProperty('--py', '0');
    };
    node.addEventListener('pointermove', onMove);
    node.addEventListener('pointerleave', onLeave);
    return () => {
      node.removeEventListener('pointermove', onMove);
      node.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}
