import { useEffect, useState } from 'react';
import { ETAPES_TUTORIEL, etapeCourante } from '@tycoon/label-tycoon';
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
export function Tutoriel({ allerA }: { allerA: (ecran: EcranId) => void }) {
  const { vue } = useLabel();
  const [etat, setEtat] = useState<Etat>(lire);
  const nouvellePartie = vue?.semaine === 0 && vue.partie.mode === 'tutoriel';

  // Un tutoriel qui recommence repart de la première étape.
  useEffect(() => {
    if (nouvellePartie) {
      ecrire(VIDE);
      setEtat(VIDE);
    }
  }, [nouvellePartie]);

  if (!vue || vue.partie.mode !== 'tutoriel' || etat.passe) return null;
  const index = etapeCourante(vue, etat.acquittements);
  if (index >= ETAPES_TUTORIEL.length) return null;
  const etape = ETAPES_TUTORIEL[index];
  if (!etape) return null;

  const changer = (suivant: Etat) => {
    setEtat(suivant);
    ecrire(suivant);
  };
  const titreEcran = ECRANS.find((e) => e.id === etape.ecran)?.titre;
  const derniere = index === ETAPES_TUTORIEL.length - 1;

  return (
    <aside className="label-screen label-tuto" aria-label="Tutoriel">
      <p className="label-tuto__etape">
        Tutoriel · étape {index + 1} sur {ETAPES_TUTORIEL.length}
      </p>
      <progress max={ETAPES_TUTORIEL.length} value={index} aria-label="Progression du tutoriel" />
      <h2>{etape.titre}</h2>
      <p>{etape.consigne}</p>
      <div className="label-tuto__actions">
        {titreEcran ? (
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
        <Button type="button" tone="ghost" onClick={() => changer({ ...etat, passe: true })}>
          Passer le tutoriel
        </Button>
      </div>
    </aside>
  );
}
