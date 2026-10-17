/** Les quatre articles de la rubrique « Comment ça marche ». */
export interface Article {
  numeral: string;
  title: string;
  paragraphs: readonly string[];
}

export const HOW_IT_WORKS: readonly Article[] = [
  {
    numeral: 'I',
    title: 'Jouez sans compte',
    paragraphs: [
      'Aucune inscription, aucun mot de passe, aucune carte bancaire. Vous ouvrez un jeu, vous jouez. Votre partie est sauvegardée dans votre navigateur, sur votre appareil, et nulle part ailleurs.',
      "Le jeu ne vous demande jamais votre adresse. L'abonnement à l'édition est facultatif, et ne sert qu'à vous prévenir des sorties.",
    ],
  },
  {
    numeral: 'II',
    title: 'Une progression commune',
    paragraphs: [
      "Votre réputation de patron voyage d'un jeu à l'autre. Un label qui tourne bien ouvre des contrats plus avantageux dans la boîte de nuit ; une marque connue attire de meilleurs joueurs au club de football.",
      'Chaque titre garde ses règles propres. Seuls le capital de confiance et les contacts sont partagés.',
    ],
  },
  {
    numeral: 'III',
    title: 'Des empires qui se croisent',
    paragraphs: [
      "Le label signe le DJ de la boîte de nuit. La marque de baskets lance une collaboration avec un artiste. Le syndicat, lui, blanchit ses recettes derrière le comptoir d'un bar.",
      'Ces liens sont des événements de jeu : ils débloquent des contrats, des exclusivités, parfois des ennuis. Le schéma plus bas en dresse la carte.',
    ],
  },
  {
    numeral: 'IV',
    title: 'Un défi chaque jour',
    paragraphs: [
      'À minuit, heure de Paris, une nouvelle quête est publiée : même jeu, même capital, même contrainte pour tout le monde. Quinze minutes, un objectif chiffré.',
      "Les meilleurs scores de la veille s'affichent au podium. Personne ne peut rejouer la quête d'hier : elle disparaît pour de bon.",
    ],
  },
];
