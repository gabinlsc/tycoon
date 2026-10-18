import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useGameSave } from '../../accounts/AccountContext';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

/** Ce qu'on range dans la sauvegarde du compte : la partie sérialisée par le moteur et un résumé. */
export interface SauvegardeLabel {
  version: 1;
  sauvegarde: string;
  semaine: number;
  label: string;
  enregistreLe: string;
}

/** Délai avant d'enregistrer après un changement : évite d'écrire à chaque semaine d'une avance rapide. */
export const DELAI_SAUVEGARDE_MS = 1500;

/**
 * Sauvegarde simple : la partie est enregistrée dans le compte (local au navigateur) peu après chaque
 * changement, et peut être reprise depuis l'écran de départ. Sans compte, rien n'est enregistré et le
 * joueur en est averti.
 */
export function Persistance() {
  const { status } = useAccount();
  const { vue, envoyer } = useLabel();
  const sauvegarde = useGameSave<SauvegardeLabel>('label-tycoon');
  const [etat, setEtat] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const derniere = useRef<number>(-1);
  const { save, data, state, clear } = sauvegarde;

  useEffect(() => {
    if (!vue || status !== 'in' || vue.semaine === derniere.current) return;
    const timer = setTimeout(() => {
      void envoyer({ type: 'sauvegarder' }).then(async (r) => {
        if (r.type !== 'sauvegarde') return;
        derniere.current = vue.semaine;
        await save({
          version: 1,
          sauvegarde: r.sauvegarde,
          semaine: vue.semaine,
          label: vue.label.nom,
          enregistreLe: new Date().toISOString(),
        });
        setEtat(`Partie sauvegardée (semaine ${vue.semaine}).`);
      });
    }, DELAI_SAUVEGARDE_MS);
    return () => clearTimeout(timer);
  }, [vue, status, envoyer, save]);

  if (!vue) {
    if (status === 'in' && state === 'ready' && data) {
      return (
        <div className="label-resume">
          <p>
            Une partie t’attend : <strong>{data.label}</strong>, semaine {data.semaine}.
          </p>
          <Button
            type="button"
            tone="green"
            onClick={() => void envoyer({ type: 'charger', sauvegarde: data.sauvegarde })}
          >
            Reprendre ma partie
          </Button>
        </div>
      );
    }
    return status === 'out' ? (
      <p className="label-screen__soon">
        <Link to="/compte">Crée ton pseudo</Link> pour que ta partie soit sauvegardée.
      </p>
    ) : null;
  }

  return (
    <div className="label-save">
      <span role="status">
        {status === 'in'
          ? (etat ?? 'La partie sera sauvegardée automatiquement.')
          : 'Pas de compte : cette partie ne sera pas sauvegardée.'}
      </span>
      {status === 'in' && data ? (
        confirmer ? (
          <>
            <Button
              type="button"
              tone="ghost"
              onClick={() => {
                void clear();
                void envoyer({ type: 'nouvelle-partie', graine: Date.now().toString(36) });
                setConfirmer(false);
                derniere.current = -1;
              }}
            >
              Oui, tout recommencer
            </Button>
            <Button type="button" tone="ghost" onClick={() => setConfirmer(false)}>
              Annuler
            </Button>
          </>
        ) : (
          <Button type="button" tone="ghost" onClick={() => setConfirmer(true)}>
            Recommencer
          </Button>
        )
      ) : null}
    </div>
  );
}
