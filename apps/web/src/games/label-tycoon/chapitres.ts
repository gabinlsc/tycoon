import type { VueJeu } from '@tycoon/label-tycoon';

export interface Chapitre {
  /** Identifiant du palier que ce chapitre fait gagner (`home-studio` : le point de départ). */
  palier: string;
  titre: string;
  histoire: string;
  /** Réplique d'un rival nommé qui te regarde monter. */
  defi: string;
}

/** Les chapitres de la campagne : un par palier, du garage à l'institution. */
export const CHAPITRES: readonly Chapitre[] = [
  {
    palier: 'home-studio',
    titre: 'Le garage',
    histoire: 'Un micro, un ordinateur et une idée fixe : faire éclore le prochain talent.',
    defi: 'Un label de garage ? Reviens me voir quand tu auras un disque d’or.',
  },
  {
    palier: 'independant',
    titre: 'L’indépendant',
    histoire:
      'Les premiers hits paient le loyer. Il faut des artistes plus solides et un vrai public.',
    defi: 'Tu as de la chance, pour l’instant. Les vrais labels, eux, durent.',
  },
  {
    palier: 'etabli',
    titre: 'L’établi',
    histoire: 'Ton nom circule dans le métier. Les rivaux commencent à te convoiter tes artistes.',
    defi: 'Je vais te prendre ta meilleure signature. Rien de personnel.',
  },
  {
    palier: 'major',
    titre: 'La major',
    histoire: 'Tournées, festivals, international : le label devient une machine à hits.',
    defi: 'Deux majors dans la même ville, c’est une de trop.',
  },
  {
    palier: 'groupe',
    titre: 'Le groupe',
    histoire: 'Des sous-labels, des cadres, des rachats : tu ne produis plus, tu diriges.',
    defi: 'Les autorités te regardent. Moi aussi.',
  },
  {
    palier: 'conglomerat',
    titre: 'Le conglomérat',
    histoire: 'Ta plateforme, tes festivals, tes studios de synchro : tout l’écosystème est à toi.',
    defi: 'Il ne reste que toi et moi. Il n’y a de place que pour un empire.',
  },
  {
    palier: 'institution',
    titre: 'L’institution',
    histoire: 'Fondation, académie, musée : tu ne vends plus des disques, tu écris l’histoire.',
    defi: 'Alors c’est ça, la légende. Je m’incline.',
  },
];

export interface ProgressionChapitre {
  /** Index du chapitre en cours. */
  index: number;
  chapitre: Chapitre;
  /** Objectifs du chapitre : ce qu'il reste à atteindre pour passer au palier suivant. */
  objectifs: { id: string; libelle: string; actuel: number; cible: number }[];
  /** Part d'avancement du chapitre (0 à 1). */
  avancement: number;
  /** `true` au dernier chapitre : plus de palier à gagner. */
  dernier: boolean;
}

const cert = (n: string | null): string =>
  n === 'or'
    ? 'disque d’or'
    : n === 'platine'
      ? 'disque de platine'
      : n === 'diamant'
        ? 'disque de diamant'
        : '';

/** Où en est le joueur dans la campagne, d'après son palier et les conditions du suivant. */
export function progression(vue: Pick<VueJeu, 'label' | 'prochainPalier'>): ProgressionChapitre {
  const index = Math.max(
    0,
    CHAPITRES.findIndex((c) => c.palier === vue.label.palierId),
  );
  const chapitre = CHAPITRES[index] ?? (CHAPITRES[0] as Chapitre);
  const p = vue.prochainPalier;
  if (!p) return { index, chapitre, objectifs: [], avancement: 1, dernier: true };
  const objectifs = [
    {
      id: 'reputation',
      libelle: 'Réputation',
      actuel: p.reputation.actuelle,
      cible: p.reputation.requise,
    },
    {
      id: 'ca',
      libelle: 'Chiffre d’affaires',
      actuel: Math.round(p.chiffreAffaires.actuel / 100),
      cible: Math.round(p.chiffreAffaires.requis / 100),
    },
    ...(p.certification.requise
      ? [
          {
            id: 'certification',
            libelle: `Un ${cert(p.certification.requise)}`,
            actuel: p.certification.atteinte ? 1 : 0,
            cible: 1,
          },
        ]
      : []),
  ];
  const parts = objectifs.map((o) => Math.min(1, o.actuel / Math.max(1, o.cible)));
  const avancement = parts.reduce((s, v) => s + v, 0) / Math.max(1, parts.length);
  return { index, chapitre, objectifs, avancement, dernier: false };
}
