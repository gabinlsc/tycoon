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
  ere: {
    terme: 'Ère',
    definition:
      'Une longue période qui change les règles économiques (streaming, plateforme dominante, direct-to-fan, virale). Des signaux annoncent le changement.',
  },
  saison: {
    terme: 'Saison de contenu',
    definition:
      'Une période (festivals, rentrée, fêtes, turbulences, révolution technologique) qui apporte ses propres événements.',
  },
  legende: {
    terme: 'Légende',
    definition:
      'Un artiste de ton label retraité mais toujours célèbre. Il parraine les jeunes talents et inspire les diplômés de ton académie.',
  },
  heritage: {
    terme: 'Héritage',
    definition:
      'Clore un règne l’inscrit au Panthéon et permet de repartir avec une réputation réduite et des bonus gagnés par tes accomplissements.',
  },
  pantheon: {
    terme: 'Panthéon',
    definition:
      'Le palmarès local des dix meilleurs règnes de cet appareil, classés par valorisation.',
  },
  influence: {
    terme: 'Influence',
    definition:
      'Le poids de ton institution sur le marché (0 à 100). Elle se dépense pour infléchir les règles.',
  },
  penetration: {
    terme: 'Pénétration',
    definition:
      'La part du public d’un pays que ton label touche. Elle monte avec les campagnes et retombe sans budget.',
  },
  scene: {
    terme: 'Scène locale',
    definition:
      'Le profil musical d’une ville : un genre dominant, un genre secondaire et une chaleur qui évolue. Repérer dans une scène émergente donne de meilleurs talents.',
  },
  surveillance: {
    terme: 'Surveillance',
    definition:
      'La pression des autorités de la concurrence quand ta part de marché dépasse 35 %. À 100, une amende tombe.',
  },
  piratage: {
    terme: 'Piratage',
    definition:
      'Des vagues qui font perdre une part des écoutes pendant quelques semaines. Une veille payante en réduit les dégâts.',
  },
};
