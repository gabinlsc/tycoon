import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { graineDuDefi } from '@tycoon/label-tycoon';
import { useAccount, useGameSave } from '../../accounts/AccountContext';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { configDepuisPartie } from './partie';
import { exporterFichier, importerFichier, nomFichier, validerPartie } from './sauvegardes/fichier';
import {
  LIBELLES_EMPLACEMENT,
  type MetadonneesCompte,
  metadonneesCompte,
  resumeSauvegarde,
  sauvegardeAutoDue,
} from './sauvegardes/regles';
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

const estHeritee = (d: SauvegardeHeritee | MetadonneesCompte | null): d is SauvegardeHeritee =>
  d !== null && typeof (d as Partial<SauvegardeHeritee>).sauvegarde === 'string';

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
  const { vue, envoyer, nouvellePartie } = useLabel();
  const heritee = useGameSave<SauvegardeHeritee | MetadonneesCompte>('label-tycoon');
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
  const {
    state: etatHeritage,
    data: donneesHeritees,
    clear: effacerHeritage,
    save: ecrireCompte,
  } = heritee;
  useEffect(() => {
    if (!compte || etatHeritage !== 'ready' || !donneesHeritees) return;
    // Le compte ne garde plus ici que des métadonnées : seule l'ancienne forme contient une partie.
    if (!estHeritee(donneesHeritees)) return;
    const ancienne = donneesHeritees;
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
      await effacerHeritage();
      await rafraichir();
    })().catch(() => undefined);
  }, [compte, etatHeritage, donneesHeritees, effacerHeritage, stockage, rafraichir]);

  // Les métadonnées des sauvegardes remontent dans la page de compte.
  const publiee = useRef<string | null>(null);
  useEffect(() => {
    if (!compte || etatHeritage !== 'ready') return;
    const meta = metadonneesCompte(contenu);
    const empreinte = JSON.stringify(meta);
    if (publiee.current === empreinte) return;
    // Tant que l'ancienne sauvegarde n'est pas migrée, on ne l'écrase pas.
    if (estHeritee(donneesHeritees)) return;
    publiee.current = empreinte;
    if (meta) void ecrireCompte(meta).catch(() => undefined);
    else if (donneesHeritees) void effacerHeritage().catch(() => undefined);
  }, [compte, etatHeritage, donneesHeritees, contenu, ecrireCompte, effacerHeritage]);

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
    const verdict = validerPartie(s.sauvegarde);
    if (!verdict.ok) {
      setMessage(
        `${LIBELLES_EMPLACEMENT[emplacement]} est illisible (${verdict.erreur}). Ta partie en cours n’est pas touchée.`,
      );
      return;
    }
    const reponse = await envoyer({ type: 'charger', sauvegarde: s.sauvegarde });
    if (reponse.type === 'erreur') {
      setMessage(`Cette sauvegarde est illisible : ${reponse.message}`);
      return;
    }
    derniereAuto.current = s.semaine;
    setMessage(`${LIBELLES_EMPLACEMENT[emplacement]} chargée.`);
  };

  const exporter = (emplacement: Emplacement) => {
    const s = contenu[emplacement];
    if (!s) return;
    const url = URL.createObjectURL(new Blob([exporterFichier(s)], { type: 'application/json' }));
    const lien = document.createElement('a');
    lien.href = url;
    lien.download = nomFichier(s);
    lien.click();
    URL.revokeObjectURL(url);
    setMessage(`${LIBELLES_EMPLACEMENT[emplacement]} exportée.`);
  };

  const importer = async (emplacement: Emplacement, fichier: File | undefined) => {
    if (!compte || !fichier) return;
    const texte = await new Promise<string>((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resolve(String(lecteur.result));
      lecteur.onerror = () => reject(lecteur.error ?? new Error('lecture impossible'));
      lecteur.readAsText(fichier);
    }).catch(() => null);
    if (texte === null) return setMessage('Import impossible : le fichier n’a pas pu être lu.');
    const lu = importerFichier(texte);
    if (!lu.ok) return setMessage(`Import refusé : ${lu.erreur}.`);
    try {
      await stockage.ecrire(compte, emplacement, lu.sauvegarde);
    } catch {
      return setMessage('Import impossible : le stockage du navigateur est refusé ou plein.');
    }
    await rafraichir();
    setMessage(`Partie importée dans ${LIBELLES_EMPLACEMENT[emplacement].toLowerCase()}.`);
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

  const lignes = EMPLACEMENTS.filter(
    (e) => vue || contenu[e] || (EMPLACEMENTS_MANUELS as readonly string[]).includes(e),
  );

  return (
    <details className="label-save" open={!vue}>
      <summary>{vue ? 'Sauvegardes' : 'Reprendre ou importer une partie'}</summary>
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
                  <Button type="button" tone="ghost" onClick={() => exporter(e)}>
                    Exporter {LIBELLES_EMPLACEMENT[e].toLowerCase()}
                  </Button>{' '}
                  {manuel ? (
                    <Button type="button" tone="ghost" onClick={() => void effacer(e)}>
                      Effacer {LIBELLES_EMPLACEMENT[e].toLowerCase()}
                    </Button>
                  ) : null}
                </>
              ) : null}
              {manuel ? (
                <label className="label-field">
                  Importer un fichier dans {LIBELLES_EMPLACEMENT[e].toLowerCase()}
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={(ev) => {
                      void importer(e, ev.target.files?.[0]);
                      ev.target.value = '';
                    }}
                  />
                </label>
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
                void nouvellePartie(
                  vue.partie.defiDate !== null
                    ? graineDuDefi(vue.partie.defiDate)
                    : Date.now().toString(36),
                  configDepuisPartie(vue.partie),
                );
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
