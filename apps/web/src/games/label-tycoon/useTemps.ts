import { useCallback, useEffect, useRef, useState } from 'react';
import { useLabel } from './LabelContext';
import { useReglagesPause } from './useReglagesPause';
import { DELAI_MS, LIBELLES_PAUSE, type Vitesse, pauseDeclenchee } from './temps';

/** Contrôle du temps : vitesse, avance semaine par semaine, auto-pauses réglables. */
export function useTemps() {
  const { vue, envoyer } = useLabel();
  const [vitesse, setVitesse] = useState<Vitesse>(0);
  const { reglages, basculer } = useReglagesPause();
  const [motif, setMotif] = useState<string | null>(null);
  const reglagesRef = useRef(reglages);
  reglagesRef.current = reglages;
  const enCours = useRef(false);
  const phaseCeremonie = useRef(vue?.ceremonie?.phase ?? null);

  const unePas = useCallback(async (): Promise<boolean> => {
    if (enCours.current) return false;
    enCours.current = true;
    try {
      const reponse = await envoyer({ type: 'avancer', semaines: 1, arretSurSignal: false });
      if (reponse.type !== 'vue') return true;
      const declenche = pauseDeclenchee(reponse.signaux, reglagesRef.current);
      if (reponse.vue.finances.faillite) {
        setMotif('Faillite : la partie est terminée.');
        return true;
      }
      const phase = reponse.vue.ceremonie?.phase ?? null;
      const soireeDesPrix = phase === 'resultats' && phaseCeremonie.current === 'nominations';
      phaseCeremonie.current = phase;
      if (soireeDesPrix) {
        setMotif('Pause : c’est le soir des Trophées');
        return true;
      }
      if (declenche) {
        setMotif(
          `Pause : ${declenche === 'autre' ? 'événement important' : LIBELLES_PAUSE[declenche].toLowerCase()}`,
        );
        return true;
      }
      return false;
    } finally {
      enCours.current = false;
    }
  }, [envoyer]);

  const pause = useCallback(() => setVitesse(0), []);
  const regler = useCallback((v: Vitesse) => {
    setMotif(null);
    setVitesse(v);
  }, []);
  const semaine = useCallback(async () => {
    setVitesse(0);
    setMotif(null);
    await unePas();
  }, [unePas]);

  useEffect(() => {
    if (vitesse === 0 || !vue || vue.finances.faillite) return;
    const timer = setTimeout(() => {
      void unePas().then((arreter) => {
        if (arreter) setVitesse(0);
      });
    }, DELAI_MS[vitesse]);
    return () => clearTimeout(timer);
  }, [vitesse, vue, unePas]);

  return { vitesse, reglages, motif, regler, pause, semaine, basculer };
}
