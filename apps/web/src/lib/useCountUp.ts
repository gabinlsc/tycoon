import { useEffect, useState } from 'react';

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

/**
 * Compte de 0 à `target` en `duration` ms une fois `active`, avec une décélération :
 * les chiffres s'affolent puis se posent, comme un compteur mécanique qui se cale.
 * En reduced-motion, la valeur finale est affichée immédiatement.
 */
export function useCountUp(target: number, active: boolean, duration = 1400): number {
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    if (!active) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, duration, reduced]);

  return value;
}
