import { useEffect, useState } from 'react';
import { ETAPES_TUTORIEL, etapeCourante } from '@tycoon/label-tycoon';
import { Headphones, Minus } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { ECRANS, type EcranId } from './ecrans';
import { useLabel } from './LabelContext';

const CLE = 'tycoon:label:tutoriel';

interface Etat {
  /** Étapes de lecture validées (« Compris »). */
  acquittements: Record<string, boolean>;
  /** Tutoriel passé : le panneau disparaît, la partie continue. */
  passe: boolean;
}

const VIDE: Etat = { acquittements: {}, passe: false };

function lire(): Etat {
  try {
    const brut = window.localStorage.getItem(CLE);
    return brut ? { ...VIDE, ...(JSON.parse(brut) as Partial<Etat>) } : VIDE;
  } catch {
    return VIDE;
  }
}

function ecrire(etat: Etat): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(etat));
  } catch {
    /* stockage indisponible : la progression vaut pour la session */
  }
}

/**
 * Tutoriel guidé « Ton premier signataire » : une consigne à la fois, validée par ce que le joueur
 * fait dans le jeu (lu sur la vue, donc rien à sauvegarder), et passable à tout moment.
 */
export function Tutoriel({
  allerA,
  ecran,
}: {
  allerA: (ecran: EcranId) => void;
  /** Écran affiché : inutile de proposer d'y aller quand on y est déjà. */
  ecran?: EcranId;
}) {
  const { vue } = useLabel();
  const [etat, setEtat] = useState<Etat>(lire);
  const [reduit, setReduit] = useState(false);
  const nouvellePartie = vue?.semaine === 0 && vue.partie.mode === 'tutoriel';

  // Un tutoriel qui recommence repart de la première étape.
  useEffect(() => {
    if (nouvellePartie) {
      ecrire(VIDE);
      setEtat(VIDE);
    }
  }, [nouvellePartie]);

  const actif = vue !== null && vue.partie.mode === 'tutoriel' && !etat.passe;
  const index = actif ? etapeCourante(vue, etat.acquittements) : ETAPES_TUTORIEL.length;
  const etape = ETAPES_TUTORIEL[index];

  // L'entrée de menu visée par l'étape clignote doucement, tant que le joueur n'y est pas.
  const cible = etape?.ecran;
  useEffect(() => {
    if (!cible) return;
    const elements = document.querySelectorAll<HTMLElement>(`[data-ecran~="${cible}"]`);
    elements.forEach((el) => el.classList.add('lt-cible'));
    return () => elements.forEach((el) => el.classList.remove('lt-cible'));
  }, [cible]);

  if (!actif || !etape) return null;

  const changer = (suivant: Etat) => {
    setEtat(suivant);
    ecrire(suivant);
  };
  const titreEcran = ECRANS.find((e) => e.id === etape.ecran)?.titre;
  const derniere = index === ETAPES_TUTORIEL.length - 1;

  if (reduit)
    return (
      <button type="button" className="lt-coach-pastille" onClick={() => setReduit(false)}>
        <Headphones aria-hidden="true" size={22} />
        Rouvrir le tutoriel · {index + 1}/{ETAPES_TUTORIEL.length}
      </button>
    );

  return (
    <aside className="label-tuto lt-coach" aria-label="Tutoriel">
      <div className="lt-coach__tete">
        <span className="lt-coach__mascotte" aria-hidden="true">
          <Headphones size={30} strokeWidth={2.4} />
        </span>
        <div>
          <p className="lt-coach__nom">Max, ton associé</p>
          <p className="label-tuto__etape">
            Tutoriel · étape {index + 1} sur {ETAPES_TUTORIEL.length}
          </p>
        </div>
        <button
          type="button"
          className="lt-coach__reduire"
          onClick={() => setReduit(true)}
          aria-label="Réduire le tutoriel"
          title="Réduire"
        >
          <Minus aria-hidden="true" size={20} />
        </button>
      </div>
      <ol className="lt-coach__points" aria-hidden="true">
        {ETAPES_TUTORIEL.map((e, i) => (
          <li key={e.id} className={i < index ? 'is-fait' : i === index ? 'is-courant' : ''} />
        ))}
      </ol>
      <progress
        className="visually-hidden"
        max={ETAPES_TUTORIEL.length}
        value={index}
        aria-label="Progression du tutoriel"
      />
      <div className="lt-coach__bulle">
        <h2>{etape.titre}</h2>
        <p>{etape.consigne}</p>
      </div>
      <div className="label-tuto__actions">
        {titreEcran && etape.ecran !== ecran ? (
          <Button type="button" tone="gold" onClick={() => allerA(etape.ecran as EcranId)}>
            Aller à l’écran {titreEcran}
          </Button>
        ) : null}
        {etape.manuelle ? (
          <Button
            type="button"
            tone="green"
            onClick={() =>
              changer({ ...etat, acquittements: { ...etat.acquittements, [etape.id]: true } })
            }
          >
            {derniere ? 'Terminer le tutoriel' : 'Compris'}
          </Button>
        ) : null}
        <button
          type="button"
          className="lt-coach__passer"
          onClick={() => changer({ ...etat, passe: true })}
        >
          Passer le tutoriel
        </button>
      </div>
    </aside>
  );
}
