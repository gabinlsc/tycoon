import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useGameSave } from '../../accounts/AccountContext';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { LIBELLES_EMPLACEMENT, resumeSauvegarde, sauvegardeAutoDue } from './sauvegardes/regles';
import {
  EMPLACEMENTS,
  EMPLACEMENTS_MANUELS,
  type Emplacement,
  type SauvegardeLabel,
  type StockageParties,
  choisirStockage,
} from './sauvegardes/stockage';

export type { SauvegardeLabel } from './sauvegardes/stockage';

/** Ancienne sauvegarde unique, rangée dans le compte : migrée vers l'emplacement automatique. */
interface SauvegardeHeritee {
  version: 1;
  sauvegarde: string;
  semaine: number;
  label: string;
  enregistreLe: string;
}

type Contenu = Partial<Record<Emplacement, SauvegardeLabel>>;

interface Props {
  /** Stockage à utiliser (les tests injectent la mémoire) ; IndexedDB par défaut. */
  stockage?: StockageParties;
}

/**
 * Sauvegardes du jeu : une sauvegarde automatique toutes les 4 semaines et trois emplacements
 * manuels, rangés dans IndexedDB et isolés par compte. Sans compte, rien n'est enregistré et le
 * joueur en est averti.
 */
export function Persistance({ stockage: injecte }: Props) {
  const { status, account } = useAccount();
  const { vue, envoyer } = useLabel();
  const heritee = useGameSave<SauvegardeHeritee>('label-tycoon');
  const [stockage] = useState<StockageParties>(() => injecte ?? choisirStockage().stockage);
  const [contenu, setContenu] = useState<Contenu>({});
  const [message, setMessage] = useState<string | null>(null);
  const [confirmer, setConfirmer] = useState(false);
  const derniereAuto = useRef(-1);
  const compte = status === 'in' ? (account?.id ?? null) : null;

  const rafraichir = useCallback(async () => {
    if (!compte) return setContenu({});
    setContenu(await stockage.lister(compte).catch(() => ({})));
  }, [compte, stockage]);

  useEffect(() => {
    void rafraichir();
  }, [rafraichir]);

  // Migration de l'ancienne sauvegarde unique vers l'emplacement automatique.
  useEffect(() => {
    if (!compte || heritee.state !== 'ready' || !heritee.data) return;
    const ancienne = heritee.data;
    void (async () => {
      const present = await stockage.lire(compte, 'auto').catch(() => null);
      if (!present)
        await stockage.ecrire(compte, 'auto', {
          version: 1,
          sauvegarde: ancienne.sauvegarde,
          semaine: ancienne.semaine,
          label: ancienne.label,
          palier: '',
          tresorerie: 0,
          enregistreLe: ancienne.enregistreLe,
        });
      await heritee.clear();
      await rafraichir();
    })().catch(() => undefined);
  }, [compte, heritee, stockage, rafraichir]);

  const ecrire = useCallback(
    async (emplacement: Emplacement): Promise<boolean> => {
      if (!compte || !vue) return false;
      const reponse = await envoyer({ type: 'sauvegarder' });
      if (reponse.type !== 'sauvegarde') return false;
      try {
        await stockage.ecrire(compte, emplacement, {
          version: 1,
          sauvegarde: reponse.sauvegarde,
          semaine: vue.semaine,
          label: vue.label.nom,
          palier: vue.label.palier,
          tresorerie: vue.finances.tresorerie,
          enregistreLe: new Date().toISOString(),
        });
      } catch {
        setMessage('Sauvegarde impossible : le stockage du navigateur est refusé ou plein.');
        return false;
      }
      await rafraichir();
      return true;
    },
    [compte, vue, envoyer, stockage, rafraichir],
  );

  // Sauvegarde automatique toutes les 4 semaines.
  const semaine = vue?.semaine ?? -1;
  useEffect(() => {
    if (!compte || semaine < 0 || !sauvegardeAutoDue(semaine, derniereAuto.current)) return;
    derniereAuto.current = semaine;
    void ecrire('auto').then((ok) => {
      if (ok) setMessage(`Sauvegarde automatique (semaine ${semaine}).`);
    });
  }, [compte, semaine, ecrire]);

  const charger = async (emplacement: Emplacement) => {
    const s = contenu[emplacement];
    if (!s) return;
    const reponse = await envoyer({ type: 'charger', sauvegarde: s.sauvegarde });
    if (reponse.type === 'erreur') {
      setMessage(`Cette sauvegarde est illisible : ${reponse.message}`);
      return;
    }
    derniereAuto.current = s.semaine;
    setMessage(`${LIBELLES_EMPLACEMENT[emplacement]} chargée.`);
  };

  const effacer = async (emplacement: Emplacement) => {
    if (!compte) return;
    await stockage.effacer(compte, emplacement);
    await rafraichir();
  };

  if (status !== 'in') {
    if (vue)
      return (
        <p className="label-screen__soon">Pas de compte : cette partie ne sera pas sauvegardée.</p>
      );
    return status === 'out' ? (
      <p className="label-screen__soon">
        <Link to="/compte">Crée ton pseudo</Link> pour que ta partie soit sauvegardée.
      </p>
    ) : null;
  }

  const lignes = vue ? EMPLACEMENTS : EMPLACEMENTS.filter((e) => contenu[e]);
  if (!vue && lignes.length === 0) return null;

  return (
    <details className="label-save" open={!vue}>
      <summary>{vue ? 'Sauvegardes' : 'Reprendre une partie'}</summary>
      <ul className="label-list">
        {lignes.map((e) => {
          const s = contenu[e];
          const manuel = (EMPLACEMENTS_MANUELS as readonly string[]).includes(e);
          return (
            <li key={e}>
              <strong>{LIBELLES_EMPLACEMENT[e]}</strong> — {s ? resumeSauvegarde(s) : 'vide'}{' '}
              {vue && manuel ? (
                <Button
                  type="button"
                  tone="ghost"
                  onClick={() =>
                    void ecrire(e).then(
                      (ok) => ok && setMessage(`${LIBELLES_EMPLACEMENT[e]} enregistrée.`),
                    )
                  }
                >
                  Sauvegarder dans {LIBELLES_EMPLACEMENT[e].toLowerCase()}
                </Button>
              ) : null}{' '}
              {s ? (
                <>
                  <Button type="button" tone="green" onClick={() => void charger(e)}>
                    Charger {LIBELLES_EMPLACEMENT[e].toLowerCase()}
                  </Button>{' '}
                  {manuel ? (
                    <Button type="button" tone="ghost" onClick={() => void effacer(e)}>
                      Effacer {LIBELLES_EMPLACEMENT[e].toLowerCase()}
                    </Button>
                  ) : null}
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
      {vue ? (
        confirmer ? (
          <>
            <Button
              type="button"
              tone="ghost"
              onClick={() => {
                void envoyer({ type: 'nouvelle-partie', graine: Date.now().toString(36) });
                setConfirmer(false);
                derniereAuto.current = -1;
              }}
            >
              Oui, recommencer une partie
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
      <p role="status">{message ?? 'Sauvegarde automatique toutes les 4 semaines.'}</p>
    </details>
  );
}
