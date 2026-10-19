import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Lock, Search } from 'lucide-react';
import { ECRANS, poleDe, type EcranId } from './ecrans';
import { ICONES_ECRANS } from './icones';

type Entree = { id: EcranId; titre: string; description: string; pole: string; ferme: boolean };

const normaliser = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Palette de commandes : on tape quelques lettres, Entrée ouvre l'écran. */
export function Palette({
  fermer,
  ouvrir,
  estFerme,
}: {
  fermer: () => void;
  ouvrir: (id: EcranId) => void;
  estFerme: (id: EcranId) => boolean;
}) {
  const [requete, setRequete] = useState('');
  const [actif, setActif] = useState(0);
  const champ = useRef<HTMLInputElement>(null);
  useEffect(() => champ.current?.focus(), []);

  const entrees = useMemo<Entree[]>(() => {
    const q = normaliser(requete.trim());
    return ECRANS.map((e) => ({
      id: e.id,
      titre: e.titre,
      description: e.description,
      pole: poleDe(e.id).titre,
      ferme: estFerme(e.id),
    })).filter((e) => !q || normaliser(`${e.titre} ${e.pole} ${e.description}`).includes(q));
  }, [requete, estFerme]);

  const choisirRef = useRef<(e: Entree | undefined) => void>(() => {});
  const choisir = (e: Entree | undefined) => {
    if (!e || e.ferme) return;
    ouvrir(e.id);
    fermer();
  };

  choisirRef.current = choisir;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
      else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActif((a) => Math.min(a + 1, entrees.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActif((a) => Math.max(a - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        choisirRef.current(entrees[actif]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [entrees, actif, fermer]);

  return (
    <div
      className="lt-palette"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && fermer()}
    >
      <div
        className="lt-palette__boite"
        role="dialog"
        aria-modal="true"
        aria-label="Palette de commandes"
      >
        <label className="lt-palette__champ">
          <Search aria-hidden="true" size={20} />
          <input
            ref={champ}
            type="text"
            value={requete}
            placeholder="Aller à…"
            aria-label="Aller à un écran"
            onChange={(e) => {
              setRequete(e.target.value);
              setActif(0);
            }}
          />
          <kbd>Échap</kbd>
        </label>
        <ul className="lt-palette__liste" role="listbox" aria-label="Écrans">
          {entrees.map((e, i) => {
            const Icone = ICONES_ECRANS[e.id];
            return (
              <li key={e.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  tabIndex={-1}
                  aria-selected={i === actif}
                  aria-disabled={e.ferme}
                  className={`lt-palette__ligne${i === actif ? ' is-actif' : ''}${e.ferme ? ' is-ferme' : ''}`}
                  onMouseEnter={() => setActif(i)}
                  onClick={() => choisir(e)}
                >
                  <Icone aria-hidden="true" size={20} strokeWidth={2.4} />
                  <span className="lt-palette__titre">{e.titre}</span>
                  <span className="lt-palette__pole">{e.pole}</span>
                  {e.ferme ? (
                    <Lock aria-hidden="true" size={14} />
                  ) : i === actif ? (
                    <CornerDownLeft aria-hidden="true" size={14} />
                  ) : null}
                </button>
              </li>
            );
          })}
          {entrees.length === 0 ? <li className="lt-palette__vide">Rien ne correspond.</li> : null}
        </ul>
      </div>
    </div>
  );
}

const RACCOURCIS: ReadonlyArray<readonly [string, string]> = [
  ['Ctrl + K', 'Palette de commandes'],
  ['1 – 9', 'Écrans principaux'],
  ['?', 'Cette aide'],
  ['Échap', 'Fermer'],
];

/** Aide des raccourcis clavier. */
export function AideRaccourcis({ fermer }: { fermer: () => void }) {
  const bouton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    bouton.current?.focus();
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && fermer();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [fermer]);
  return (
    <div
      className="lt-palette"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && fermer()}
    >
      <div
        className="lt-palette__boite lt-palette__boite--aide"
        role="dialog"
        aria-modal="true"
        aria-label="Raccourcis clavier"
      >
        <dl className="lt-raccourcis">
          {RACCOURCIS.map(([touche, texte]) => (
            <div key={touche}>
              <dt>
                <kbd>{touche}</kbd>
              </dt>
              <dd>{texte}</dd>
            </div>
          ))}
        </dl>
        <button ref={bouton} type="button" className="lt-palette__ok" onClick={fermer}>
          Compris
        </button>
      </div>
    </div>
  );
}

/** Ctrl/Cmd + K ouvre la palette, « ? » ouvre l'aide (hors champs de saisie). */
export function useOuverturePalette(
  actif: boolean,
  ouvrirPalette: () => void,
  ouvrirAide: () => void,
): void {
  useEffect(() => {
    if (!actif) return;
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        ouvrirPalette();
        return;
      }
      const cible = event.target as HTMLElement | null;
      if (
        event.key === '?' &&
        !(
          cible &&
          (cible.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(cible.tagName))
        )
      ) {
        event.preventDefault();
        ouvrirAide();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [actif, ouvrirPalette, ouvrirAide]);
}
