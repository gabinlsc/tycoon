/** Les quatre règles de la rubrique « Comment jouer ». */
export interface Rule {
  title: string;
  paragraphs: readonly string[];
}

export const HOW_IT_WORKS: readonly Rule[] = [
  {
    title: 'Un pseudo, point final',
    paragraphs: [
      "Pas d'e-mail, pas de mot de passe. Tu choisis un pseudo et tu reçois des codes de récupération à garder précieusement.",
      'Ton navigateur te reconnaît ensuite tout seul : tu ouvres le site, tu es connecté.',
    ],
  },
  {
    title: 'Chaque jeu vit sa vie',
    paragraphs: [
      "Un jeu, un univers, ses règles, sa trésorerie. Ce que tu gagnes dans l'un ne sert pas dans l'autre.",
      'Tu peux donc changer de métier quand tu veux, sans rien perdre ni rien devoir.',
    ],
  },
  {
    title: 'Tout est sauvegardé',
    paragraphs: [
      "Tes parties sont enregistrées automatiquement sur ton compte, jeu par jeu. Tu fermes l'onglet, tu reviens, tu reprends là où tu t'étais arrêté.",
      "Tu peux effacer la sauvegarde d'un jeu à tout moment depuis ta page de compte.",
    ],
  },
  {
    title: 'Tes codes, ta clé',
    paragraphs: [
      "Perdu l'accès à ton compte ? Un code de récupération te le rend. Chaque code ne sert qu'une fois, alors garde-les en lieu sûr.",
      "Personne ne peut les retrouver pour toi : il n'y a pas d'e-mail sur lequel les renvoyer.",
    ],
  },
];
