import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { VueJeu } from '@tycoon/label-tycoon';
import { MoteurAudio, type PreferencesAudio, type Son, lirePreferences } from './moteurAudio';

/** Un seul moteur audio pour tout le jeu ; l'interface s'y abonne pour afficher les réglages. */
const moteur = new MoteurAudio(lirePreferences());
const abonnes = new Set<() => void>();
let instantane = moteur.preferences;

const sAbonner = (cb: () => void): (() => void) => {
  abonnes.add(cb);
  return () => abonnes.delete(cb);
};

export const jouer = (son: Son): void => moteur.jouer(son);
export const activerAudio = (): void => moteur.activer();

export function reglerAudio(prefs: PreferencesAudio): void {
  moteur.regler(prefs);
  instantane = moteur.preferences;
  abonnes.forEach((cb) => cb());
}

/** Préférences audio courantes et fonction pour les changer. */
export function useAudio(): { prefs: PreferencesAudio; regler: (p: PreferencesAudio) => void } {
  const prefs = useSyncExternalStore(sAbonner, () => instantane);
  return { prefs, regler: reglerAudio };
}

/**
 * Branche l'audio sur le jeu : réveille le contexte au premier geste, joue un clic sur les boutons
 * du jeu et réagit à ce qui change dans la vue (signature, disque, trophée, alerte…).
 */
export function useAudioDuJeu(vue: VueJeu | null): void {
  useEffect(() => {
    const geste = () => activerAudio();
    const clic = (e: MouseEvent) => {
      const cible = e.target;
      if (cible instanceof Element && cible.closest('.lt-app button, .lt-app [role="tab"]'))
        jouer('clic');
    };
    document.addEventListener('pointerdown', geste, { once: true });
    document.addEventListener('keydown', geste, { once: true });
    document.addEventListener('click', clic, true);
    return () => {
      document.removeEventListener('pointerdown', geste);
      document.removeEventListener('keydown', geste);
      document.removeEventListener('click', clic, true);
    };
  }, []);

  const avant = useRef<{ roster: number; fil: number; succes: number; tresorerie: number } | null>(
    null,
  );
  useEffect(() => {
    if (!vue) {
      avant.current = null;
      return;
    }
    const maintenant = {
      roster: vue.roster.length,
      fil: vue.fil[0]?.id ?? 0,
      succes: vue.tousSucces.filter((s) => s.obtenu).length,
      tresorerie: vue.finances.tresorerie,
    };
    const prev = avant.current;
    avant.current = maintenant;
    if (!prev) return;
    if (maintenant.roster > prev.roster) jouer('signature');
    for (const a of vue.fil.filter((x) => x.id > prev.fil)) {
      const son = sonDeLActu(a.kind);
      if (son) jouer(son);
    }
    if (maintenant.succes > prev.succes) jouer('succes');
    if (maintenant.tresorerie - prev.tresorerie >= 1_000_000) jouer('piece');
  }, [vue]);
}

/** Bruitage associé à un type d'actu, ou `null` si elle reste silencieuse. */
export function sonDeLActu(kind: string): Son | null {
  if (kind === 'certification') return 'disque';
  if (kind === 'prix-remporte' || kind === 'label-de-l-annee') return 'trophee';
  if (kind === 'palier') return 'succes';
  if (
    kind.startsWith('alerte') ||
    kind.startsWith('amende') ||
    kind === 'proces' ||
    kind === 'artiste-parti' ||
    kind === 'vague-piratage'
  )
    return 'alerte';
  return null;
}
