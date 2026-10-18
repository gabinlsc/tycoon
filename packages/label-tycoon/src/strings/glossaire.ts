/**
 * Glossaire du jeu : une définition courte par notion, affichée dans les infobulles et la page
 * d'aide. Les clés sont stables ; l'interface les cherche par identifiant.
 */
export const GLOSSAIRE: Readonly<Record<string, { terme: string; definition: string }>> = {
  tresorerie: {
    terme: 'Trésorerie',
    definition:
      'L’argent disponible. En dessous de zéro huit semaines de suite, c’est la faillite.',
  },
  reputation: {
    terme: 'Réputation',
    definition:
      'Le prestige du label (0 à 100). Elle ouvre des paliers, des prêts moins chers et des artistes plus ambitieux.',
  },
  credibilite: {
    terme: 'Crédibilité',
    definition:
      'La légitimité du label dans un genre précis (0 à 100). Elle pèse dans la confiance des artistes de ce genre.',
  },
  palier: {
    terme: 'Palier',
    definition:
      'L’étape de ton label : home-studio, indépendant, établi, major. Chaque palier débloque de nouvelles possibilités.',
  },
  valorisation: {
    terme: 'Valorisation',
    definition:
      'Le score du label : trésorerie + catalogue + contrats − dettes, moins la part cédée aux investisseurs.',
  },
  hype: {
    terme: 'Hype',
    definition:
      'Le buzz autour d’un artiste. Il monte avec les sorties et les concerts, et retombe d’environ 5 % par semaine.',
  },
  moral: {
    terme: 'Moral',
    definition:
      'L’état d’esprit d’un artiste. Un moral bas fait baisser la qualité des sorties et pousse au départ.',
  },
  fatigue: {
    terme: 'Fatigue',
    definition: 'L’épuisement d’un artiste. Trop de scène mène au burnout.',
  },
  notoriete: {
    terme: 'Notoriété',
    definition:
      'La célébrité d’un artiste (0 à 100), sur une échelle logarithmique de son nombre de fans.',
  },
  fourchette: {
    terme: 'Fourchette',
    definition:
      'Tu ne connais jamais la valeur exacte d’un talent : seulement une fourchette qui se resserre avec le temps d’observation.',
  },
  'essai-studio': {
    terme: 'Essai en studio',
    definition:
      'Une séance payante qui révèle les attributs cachés (potentiel, éthique, ego, loyauté, polyvalence), en fourchette.',
  },
  qualite: {
    terme: 'Qualité',
    definition:
      'La qualité d’un titre (0 à 100) : talent, producteur, studio, mixage, featurings, moral, et un peu de hasard.',
  },
  tendance: {
    terme: 'Tendance',
    definition:
      'La popularité d’un genre : elle multiplie le potentiel de hit d’une sortie (de ×0,5 à ×1,5).',
  },
  royalties: {
    terme: 'Royalties',
    definition: 'La part des revenus reversée à l’artiste. Le reste revient au label.',
  },
  avance: {
    terme: 'Avance',
    definition:
      'Somme versée à la signature d’un contrat. Les artistes connus en attendent davantage.',
  },
  'contrat-360': {
    terme: 'Contrat 360',
    definition: 'Le label touche aussi une part des concerts, du merch et de la synchro.',
  },
  exclusivite: {
    terme: 'Exclusivité',
    definition:
      'L’artiste ne peut sortir de musique ailleurs. Les artistes à fort ego la refusent souvent.',
  },
  catalogue: {
    terme: 'Catalogue',
    definition: 'Toutes tes sorties : elles continuent de rapporter grâce à la traîne longue.',
  },
  'traine-longue': {
    terme: 'Traîne longue',
    definition: 'Les écoutes qui durent bien après la sortie, à bas niveau mais sans fin.',
  },
  certification: {
    terme: 'Certification',
    definition: 'Disque d’or, de platine ou de diamant selon les ventes équivalentes cumulées.',
  },
  affinite: {
    terme: 'Affinité',
    definition:
      'La relation d’un artiste avec ton label. Une offre insultante la fait chuter pour toute la partie.',
  },
};
