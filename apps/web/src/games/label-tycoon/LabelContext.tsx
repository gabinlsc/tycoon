import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CommandeJeu, GameConfig, ReponseJeu, SignalVue, VueJeu } from '@tycoon/label-tycoon';
import { creerMoteur } from './engine/client';
import type { MoteurLabel } from './engine/protocol';

export type EtatMoteur = 'chargement' | 'pret' | 'erreur';

export interface LabelContextValue {
  etat: EtatMoteur;
  /** Dernière vue du jeu, ou `null` tant qu'aucune partie n'est lancée. */
  vue: VueJeu | null;
  /** Signaux de la dernière commande (sorties, certifications, alertes…). */
  signaux: readonly SignalVue[];
  /** Dernier refus d'action, traduit, ou `null`. */
  refus: string | null;
  erreur: string | null;
  /** Envoie une commande et met à jour la vue ; renvoie la réponse brute. */
  envoyer(commande: CommandeJeu): Promise<ReponseJeu>;
  /** Fonde un nouveau label ; sans réglages, une carrière en difficulté normale. */
  nouvellePartie(graine: string, config?: GameConfig): Promise<ReponseJeu>;
}

const Context = createContext<LabelContextValue | null>(null);

export function useLabel(): LabelContextValue {
  const value = useContext(Context);
  if (!value) throw new Error('useLabel doit être utilisé dans <LabelProvider>');
  return value;
}

/**
 * Porte le moteur du jeu (worker en production) et l'état affiché. `fabrique` permet de fournir un
 * moteur local dans les tests.
 */
export function LabelProvider({
  children,
  fabrique = creerMoteur,
}: {
  children: ReactNode;
  fabrique?: () => Promise<MoteurLabel>;
}) {
  const moteur = useRef<MoteurLabel | null>(null);
  const [etat, setEtat] = useState<EtatMoteur>('chargement');
  const [vue, setVue] = useState<VueJeu | null>(null);
  const [signaux, setSignaux] = useState<readonly SignalVue[]>([]);
  const [refus, setRefus] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    let annule = false;
    fabrique()
      .then((m) => {
        if (annule) {
          m.arreter();
          return;
        }
        moteur.current = m;
        setEtat('pret');
      })
      .catch((e: unknown) => {
        if (annule) return;
        setErreur(e instanceof Error ? e.message : 'Le moteur du jeu n’a pas pu démarrer.');
        setEtat('erreur');
      });
    return () => {
      annule = true;
      moteur.current?.arreter();
      moteur.current = null;
    };
  }, [fabrique]);

  const envoyer = useCallback(async (commande: CommandeJeu): Promise<ReponseJeu> => {
    const m = moteur.current;
    if (!m) return { type: 'erreur', message: 'Le moteur n’est pas prêt.' };
    const reponse = await m.envoyer(commande);
    if (reponse.type === 'vue') {
      setVue(reponse.vue);
      setSignaux(reponse.signaux);
      setRefus(null);
    } else if (reponse.type === 'refus') {
      setRefus(reponse.message);
    } else if (reponse.type === 'erreur') {
      setErreur(reponse.message);
    }
    return reponse;
  }, []);

  const nouvellePartie = useCallback(
    (graine: string, config?: GameConfig) =>
      envoyer(
        config ? { type: 'nouvelle-partie', graine, config } : { type: 'nouvelle-partie', graine },
      ),
    [envoyer],
  );

  const value = useMemo<LabelContextValue>(
    () => ({ etat, vue, signaux, refus, erreur, envoyer, nouvellePartie }),
    [etat, vue, signaux, refus, erreur, envoyer, nouvellePartie],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
