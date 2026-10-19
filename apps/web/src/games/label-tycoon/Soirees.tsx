import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { VueJeu, VueLigneClassement } from '@tycoon/label-tycoon';
import { Flame, Heart, ListOrdered, Play } from 'lucide-react';
import { jouer } from './audio/useAudio';
import { Confettis } from './Ceremonie';
import { Pochette } from './pochettes/Pochette';

/** Accueil attendu d'une sortie, d'après sa qualité et la hype de l'artiste (0 à 100 chacune). */
export function accueilAttendu(qualite: number, hype: number): { mot: string; score: number } {
  const score = Math.round(0.65 * qualite + 0.35 * hype);
  const mot =
    score >= 85 ? 'Hystérique' : score >= 65 ? 'Électrique' : score >= 40 ? 'Chaleureux' : 'Timide';
  return { mot, score };
}

const COMPTE = ['3', '2', '1', 'C’EST SORTI !'] as const;

/**
 * Soirée de sortie : compte à rebours, première écoute, pluie de cœurs des fans et accueil attendu.
 * Le jeu continue derrière : la suite se joue dans les classements.
 */
export function SoireeSortie({
  artiste,
  genre,
  type,
  graine,
  qualite,
  hype,
  fermer,
  voirClassements,
}: {
  artiste: string;
  genre: string;
  type: string;
  graine: string;
  qualite: number;
  hype: number;
  fermer: () => void;
  voirClassements?: () => void;
}) {
  const [etape, setEtape] = useState(0);
  const principal = useRef<HTMLButtonElement>(null);
  const fini = etape >= COMPTE.length - 1;
  const accueil = accueilAttendu(qualite, hype);
  const coeurs = 6 + Math.round(accueil.score / 8);

  useEffect(() => {
    jouer('rideau');
  }, []);
  useEffect(() => {
    if (fini) {
      jouer(accueil.score >= 65 ? 'trophee' : 'disque');
      principal.current?.focus();
      return;
    }
    const reduit =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = window.setTimeout(() => setEtape((e) => e + 1), reduit ? 200 : 900);
    return () => window.clearTimeout(t);
  }, [etape, fini, accueil.score]);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [fermer]);

  return (
    <div
      className="lt-soiree"
      role="dialog"
      aria-modal="true"
      aria-label={`Soirée de sortie : ${artiste}`}
    >
      <div className="lt-cer__projos" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {fini && accueil.score >= 65 ? <Confettis nombre={40} /> : null}
      <div className="lt-soiree__scene">
        <p className="lt-cer__surtitre">Soirée de sortie</p>
        <div className={`lt-soiree__disque${fini ? ' is-sorti' : ''}`}>
          <span className="lt-soiree__vinyle" aria-hidden="true" />
          <Pochette graine={graine} genre={genre} titre={type} taille={170} />
        </div>
        <h2 className="lt-cer__titre">{artiste}</h2>
        <p className="lt-cer__sous">{type}</p>
        <p className={`lt-soiree__compte${fini ? ' is-fini' : ''}`} key={etape} aria-live="polite">
          {COMPTE[etape]}
        </p>
        {fini ? (
          <>
            <div className="lt-soiree__egaliseur" aria-hidden="true">
              {Array.from({ length: 24 }, (_, i) => (
                <span key={i} style={{ '--i': i } as CSSProperties} />
              ))}
            </div>
            <div className="lt-soiree__fans" aria-hidden="true">
              {Array.from({ length: coeurs }, (_, i) => (
                <Heart key={i} size={22} style={{ '--i': i } as CSSProperties} />
              ))}
            </div>
            <p className="lt-soiree__accueil" role="status">
              <Flame aria-hidden="true" size={22} /> Accueil attendu :{' '}
              <strong>{accueil.mot}</strong>
            </p>
            <div className="lt-pack__actions">
              {voirClassements ? (
                <button type="button" className="lt-cer__passer" onClick={voirClassements}>
                  <ListOrdered aria-hidden="true" size={18} /> Voir les classements
                </button>
              ) : null}
              <button ref={principal} type="button" className="lt-cer__go" onClick={fermer}>
                <Play aria-hidden="true" size={20} /> Retour au label
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** Nouvelle entrée au classement d'après la vue précédente, ou `null`. */
export function nouvelleEntree(
  avant: ReadonlySet<number>,
  vue: Pick<VueJeu, 'historiqueClassements'>,
): VueJeu['historiqueClassements'][number] | null {
  return (
    vue.historiqueClassements.find((h) => h.position !== null && !avant.has(h.projetId)) ?? null
  );
}

/** Les dix premières lignes d'un classement, plus celle du joueur si elle est plus bas. */
export function lignesDeLaCourse(
  lignes: readonly VueLigneClassement[],
  nom: string,
): VueLigneClassement[] {
  const haut = lignes.slice(0, 10);
  const moi = lignes.find((l) => l.joueur && l.nom === nom) ?? lignes.find((l) => l.joueur);
  return moi && !haut.includes(moi) ? [...haut.slice(0, 9), moi] : haut;
}

/**
 * Course au classement : les barres de streams se remplissent de bas en haut, ta sortie en or,
 * avec sa place annoncée.
 */
export function CourseClassement({
  nom,
  position,
  lignes,
  fermer,
}: {
  nom: string;
  position: number;
  lignes: readonly VueLigneClassement[];
  fermer: () => void;
}) {
  const affichees = lignesDeLaCourse(lignes, nom);
  const max = Math.max(1, ...affichees.map((l) => l.streams));
  const principal = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    jouer(position === 1 ? 'trophee' : 'disque');
    principal.current?.focus();
  }, [position]);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [fermer]);

  return (
    <div
      className="lt-soiree lt-course"
      role="dialog"
      aria-modal="true"
      aria-label={`Entrée au classement : ${nom}`}
    >
      {position <= 10 ? <Confettis nombre={32} /> : null}
      <div className="lt-soiree__scene">
        <p className="lt-cer__surtitre">Entrée au classement</p>
        <h2 className="lt-cer__titre">{nom}</h2>
        <p className="lt-course__place">
          N° <strong>{position}</strong>
        </p>
        <ol className="lt-course__lignes">
          {affichees.map((l, i) => (
            <li
              key={`${l.rang}-${l.nom}`}
              className={l.joueur ? 'is-moi' : undefined}
              style={{ '--i': i } as CSSProperties}
            >
              <span className="lt-course__rang mono">{l.rang}</span>
              <span className="lt-course__nom">{l.nom}</span>
              <span className="lt-course__barre" aria-hidden="true">
                <span
                  style={
                    {
                      '--w': `${Math.max(4, Math.round((l.streams / max) * 100))}%`,
                    } as CSSProperties
                  }
                />
              </span>
            </li>
          ))}
        </ol>
        <button ref={principal} type="button" className="lt-cer__go" onClick={fermer}>
          Continuer
        </button>
      </div>
    </div>
  );
}

/** Surveille la vue et ouvre la course au classement quand une de tes sorties entre dans le top. */
export function useCourseClassement(vue: VueJeu | null): {
  course: { nom: string; position: number; lignes: VueLigneClassement[] } | null;
  fermer: () => void;
} {
  const connus = useRef<Set<number> | null>(null);
  const [course, setCourse] = useState<{
    nom: string;
    position: number;
    lignes: VueLigneClassement[];
  } | null>(null);

  useEffect(() => {
    if (!vue) {
      connus.current = null;
      return;
    }
    const classes = new Set(
      vue.historiqueClassements.filter((h) => h.position !== null).map((h) => h.projetId),
    );
    const avant = connus.current;
    connus.current = classes;
    if (!avant) return;
    const entree = nouvelleEntree(avant, vue);
    if (entree && entree.position !== null)
      setCourse({
        nom: entree.nom,
        position: entree.position,
        lignes: vue.classements[entree.classement],
      });
  }, [vue]);

  return { course, fermer: () => setCourse(null) };
}
