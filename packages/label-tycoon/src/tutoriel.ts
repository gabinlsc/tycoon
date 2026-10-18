import type { GameConfig } from './config';
import { DIFFICULTY_PRESETS } from './balance';
import type { VueJeu } from './view';

export { GRAINE_TUTORIEL } from './tutoriel-graine';

/** Réglages du tutoriel : budget confortable, rivaux et marché calmes, peu d'événements. */
export function configTutoriel(): GameConfig {
  return {
    mode: 'tutoriel',
    difficulty: { ...DIFFICULTY_PRESETS.facile, startingCash: 2, rivalAggression: 0.5 },
    eventRate: 0.4,
  };
}

export interface EtapeTutoriel {
  id: string;
  titre: string;
  consigne: string;
  /** Écran où se passe l'étape (identifiant d'écran du jeu), pour proposer d'y aller. */
  ecran: string;
  /** Étape qu'on valide soi-même (lecture) plutôt qu'en agissant dans le jeu. */
  manuelle?: boolean;
  /** Vrai quand le joueur a fait ce que l'étape demandait ; lu sur la vue, donc sans état à sauvegarder. */
  fait?: (vue: VueJeu) => boolean;
}

/** « Ton premier signataire » : du repérage à la première sortie, une idée à la fois. */
export const ETAPES_TUTORIEL: readonly EtapeTutoriel[] = [
  {
    id: 'bienvenue',
    titre: 'Bienvenue dans ton label',
    consigne:
      'Voici ton QG : ta trésorerie en haut, tes objectifs et les dernières actus en dessous. Tu as de quoi démarrer. Ton but : trouver un artiste, le signer et sortir son premier morceau.',
    ecran: 'qg',
    manuelle: true,
  },
  {
    id: 'reperer',
    titre: 'Repère des talents',
    consigne:
      'Ouvre l’écran Repérage et clique sur « Lancer une session » pour une source gratuite (open-mic ou candidatures). Les talents trouvés apparaissent dans ta liste de suivi.',
    ecran: 'reperage',
    fait: (v) => v.suivis.length > 0,
  },
  {
    id: 'observer',
    titre: 'Laisse le temps passer',
    consigne:
      'Tu ne vois d’abord que des fourchettes : plus tu observes un talent, plus elles se resserrent. Avance de deux semaines avec « Semaine ▶ » (ou la touche N).',
    ecran: 'reperage',
    fait: (v) => v.semaine >= 2,
  },
  {
    id: 'signer',
    titre: 'Signe ton premier artiste',
    consigne:
      'Dans Repérage, clique sur « Négocier » pour le talent qui te plaît, règle les clauses du contrat et clique sur « Proposer ce contrat ». Une offre généreuse a plus de chances d’être acceptée.',
    ecran: 'reperage',
    fait: (v) => v.roster.length > 0,
  },
  {
    id: 'produire',
    titre: 'Lance une production',
    consigne:
      'Ouvre le Studio, choisis ton artiste et un single, puis « Lancer la production ». L’estimation te donne une fourchette de qualité avant de payer.',
    ecran: 'studio',
    fait: (v) => v.projets.length > 0,
  },
  {
    id: 'sortir',
    titre: 'Sors ton premier titre',
    consigne:
      'La production prend quelques semaines : avance le temps. Quand le projet est prêt, clique sur « Sortir » dans le Studio. La sortie génère des écoutes, donc des revenus.',
    ecran: 'studio',
    fait: (v) => v.projets.some((p) => p.statut === 'sortie'),
  },
  {
    id: 'fin',
    titre: 'Tu es lancé !',
    consigne:
      'Ton label tourne. Suis les revenus dans Finances et les écoutes dans Classements, repère d’autres talents et fais grandir ton roster. Le reste de la partie est à toi.',
    ecran: 'finances',
    manuelle: true,
  },
];

/** Validations manuelles déjà faites (lecture des étapes qui n'ont pas d'action à accomplir). */
export type Acquittements = Readonly<Record<string, boolean>>;

/**
 * Étape en cours : la première qui n'est pas faite. `ETAPES_TUTORIEL.length` quand tout est terminé.
 * Une étape d'action est aussi considérée comme faite dès qu'une étape d'action suivante l'est : un
 * talent signé ne figure plus dans le suivi, mais le repérage reste derrière le joueur.
 */
export function etapeCourante(vue: VueJeu, acquittements: Acquittements): number {
  const faites = ETAPES_TUTORIEL.map((e) =>
    e.manuelle ? acquittements[e.id] === true : (e.fait?.(vue) ?? false),
  );
  let derniereAction = -1;
  ETAPES_TUTORIEL.forEach((e, i) => {
    if (!e.manuelle && faites[i]) derniereAction = i;
  });
  const index = ETAPES_TUTORIEL.findIndex(
    (e, i) => !(faites[i] || (!e.manuelle && i < derniereAction)),
  );
  return index === -1 ? ETAPES_TUTORIEL.length : index;
}
