/** Ères (GDD, 14.2) : de longues périodes qui changent les règles économiques. Noms et marques fictifs. */
export const ERE_IDS = ['streaming', 'plateforme', 'direct', 'virale'] as const;
export type EreId = (typeof ERE_IDS)[number];

export interface EreRules {
  nom: string;
  description: string;
  /** Multiplicateurs appliqués aux règles économiques (1 = neutre). */
  streaming: number;
  physique: number;
  concerts: number;
  /** Facteur sur les seuils de certification. */
  certification: number;
  /** Chances d'emballement viral et amplitude des cycles de genre. */
  viral: number;
  cycles: number;
  /** Indices avant-coureurs de l'ère qui s'annonce, du plus lointain au plus proche. */
  indices: readonly string[];
}

export const ERES: Readonly<Record<EreId, EreRules>> = {
  streaming: {
    nom: 'Ère du streaming',
    description:
      'Les plateformes ouvertes dominent : l’audience est reine et le catalogue rapporte.',
    streaming: 1,
    physique: 1,
    concerts: 1,
    certification: 1,
    viral: 1,
    cycles: 1,
    indices: [
      'Des professionnels parlent d’un retour à l’écoute en ligne ouverte.',
      'Les plateformes ouvertes se multiplient et attirent les catalogues.',
      'Les ventes d’abonnements ouverts décollent partout.',
    ],
  },
  plateforme: {
    nom: 'Ère de la plateforme dominante',
    description:
      'Une plateforme écrase le marché : elle dicte ses tarifs, les écoutes rapportent moins et il faut plus de ventes pour un disque d’or.',
    streaming: 0.82,
    physique: 0.75,
    concerts: 1,
    certification: 1.25,
    viral: 0.9,
    cycles: 0.9,
    indices: [
      'Une plateforme rachète ses concurrentes une à une.',
      'Les tarifs de rémunération deviennent un sujet de tension dans la profession.',
      'La plateforme annonce de nouvelles conditions « à prendre ou à laisser ».',
    ],
  },
  direct: {
    nom: 'Ère du direct-to-fan',
    description:
      'Le public revient au vinyle et aux salles : le physique et les concerts rapportent davantage, le streaming moins.',
    streaming: 0.9,
    physique: 1.6,
    concerts: 1.35,
    certification: 0.9,
    viral: 0.9,
    cycles: 1,
    indices: [
      'Les disquaires rouvrent et les pressages vinyle s’arrachent.',
      'Les salles affichent complet plus souvent que les années précédentes.',
      'Les artistes vendent directement à leur public et s’en vantent.',
    ],
  },
  virale: {
    nom: 'Ère des tendances éclair',
    description:
      'Tout va vite : les emballements viraux se multiplient et les genres montent et descendent plus fort, mais le public est moins fidèle aux concerts.',
    streaming: 1.08,
    physique: 0.9,
    concerts: 0.85,
    certification: 1,
    viral: 1.6,
    cycles: 1.4,
    indices: [
      'Des morceaux explosent en quelques jours puis disparaissent.',
      'Les classements changent plus vite que jamais.',
      'Les genres du moment ne durent plus que quelques semaines.',
    ],
  },
};

export const ERA_SCHEDULE = {
  /** Durée d'une ère en semaines : 8 à 12 ans. */
  weeks: { min: 416, max: 624 },
  /** Nombre d'ères programmées à l'avance à la création de la partie. */
  programmed: 8,
  /** Semaines avant le changement où tombent les indices, du plus lointain au plus proche. */
  hintsAt: [52, 26, 8],
  /** Dans les dernières semaines, le nom de l'ère qui arrive est révélé. */
  revealAt: 4,
} as const;
