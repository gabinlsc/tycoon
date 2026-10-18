/**
 * Gabarits du Fil du label : plusieurs titres et accroches par type de signal, pour éviter la
 * répétition. Variables : `{nom}` (artiste), `{rival}`, `{genre}`, `{ville}`, `{categorie}`, `{palier}`,
 * `{niveau}`, `{n}`.
 */
export interface FilTemplate {
  titres: readonly string[];
  textes: readonly string[];
  /** Importance de l'actu (1 = anecdote, 3 = à la une). */
  importance: 1 | 2 | 3;
}

export const FIL_TEMPLATES: Readonly<Record<string, FilTemplate>> = {
  sortie: {
    importance: 2,
    titres: [
      '{nom} sort un nouveau projet',
      'Nouveauté : {nom} débarque',
      '{nom} dévoile son dernier projet',
    ],
    textes: [
      'Le projet est disponible partout dès aujourd’hui.',
      'Les fans attendaient ça depuis des semaines.',
      'Reste à voir si le public suivra.',
    ],
  },
  'entree-classement': {
    importance: 2,
    titres: [
      '{nom} entre au classement',
      'Le classement accueille {nom}',
      '{nom} fait son entrée dans le Top 50',
    ],
    textes: [
      'Une entrée remarquée cette semaine.',
      'Les écoutes décollent.',
      'Le label peut être fier.',
    ],
  },
  certification: {
    importance: 3,
    titres: [
      'Disque {niveau} pour {nom}',
      '{nom} décroche un disque {niveau}',
      'Certification {niveau} : bravo {nom}',
    ],
    textes: [
      'Une étape clé dans la carrière.',
      'La réputation du label grimpe avec elle.',
      'Le champagne est de sortie.',
    ],
  },
  'prix-remporte': {
    importance: 3,
    titres: ['{nom} remporte un prix', 'Sacre pour {nom}', 'Trophée pour {nom} : « {categorie} »'],
    textes: ['La salle s’est levée.', 'Un discours très attendu.', 'Le label rayonne.'],
  },
  nomination: {
    importance: 2,
    titres: ['Nomination pour {nom}', '{nom} dans la course', 'Les nominations sont tombées'],
    textes: ['La cérémonie approche.', 'Rendez-vous à la remise des prix.', 'Le suspense monte.'],
  },
  'artiste-signe': {
    importance: 2,
    titres: ['{nom} rejoint le label', 'Nouvelle signature : {nom}', 'Bienvenue à {nom}'],
    textes: [
      'Un contrat vient d’être signé.',
      'Les premiers projets se préparent.',
      'Une recrue pleine de promesses.',
    ],
  },
  'signature-rivale': {
    importance: 1,
    titres: ['{rival} signe {nom}', '{nom} choisit {rival}', 'Coup de filet pour {rival}'],
    textes: [
      'Un talent de moins sur le marché.',
      'La concurrence ne dort pas.',
      'À suivre de près.',
    ],
  },
  'sortie-rivale': {
    importance: 1,
    titres: ['{rival} prépare une sortie', 'Du nouveau chez {rival}', '{rival} annonce un projet'],
    textes: ['Attention au calendrier.', 'Le marché va se tendre.', 'Une date à surveiller.'],
  },
  debauchage: {
    importance: 3,
    titres: [
      '{rival} débauche {nom}',
      '{nom} quitte le label pour {rival}',
      'Départ fracassant : {nom}',
    ],
    textes: [
      'Le contrat n’a pas été renouvelé à temps.',
      'Un coup dur pour le roster.',
      'La concurrence frappe fort.',
    ],
  },
  clash: {
    importance: 2,
    titres: [
      'Clash entre {nom} et un rival',
      'Tension publique autour de {nom}',
      'Les réseaux s’enflamment',
    ],
    textes: [
      'Les deux camps campent sur leurs positions.',
      'Le buzz profite à tout le monde.',
      'Qui aura le dernier mot ?',
    ],
  },
  'rival-disparu': {
    importance: 2,
    titres: [
      '{rival} met la clé sous la porte',
      'Fin de l’aventure pour {rival}',
      'Faillite chez {rival}',
    ],
    textes: [
      'Ses artistes retrouvent leur liberté.',
      'Une page se tourne dans l’industrie.',
      'Le marché se redistribue.',
    ],
  },
  'rival-nouveau': {
    importance: 1,
    titres: ['{rival} ouvre ses portes', 'Nouveau venu : {rival}', 'Un nouveau label arrive'],
    textes: [
      'Il vient chasser sur vos terres.',
      'Une nouvelle concurrence s’installe.',
      'L’ambition ne manque pas.',
    ],
  },
  'rival-evolue': {
    importance: 2,
    titres: ['{rival} change de dimension', '{rival} devient une major', 'L’ascension de {rival}'],
    textes: ['Ses moyens ont explosé.', 'Une rivalité de plus en plus sérieuse.', 'À surveiller.'],
  },
  palier: {
    importance: 3,
    titres: [
      'Le label passe un cap : {palier}',
      'Nouvelle étape : {palier}',
      'Cap franchi : {palier}',
    ],
    textes: [
      'De nouveaux horizons s’ouvrent.',
      'Des fonctionnalités se débloquent.',
      'L’aventure continue plus grand.',
    ],
  },
  viral: {
    importance: 2,
    titres: [
      '{nom} devient viral',
      'Explosion des écoutes pour {nom}',
      'Le titre de {nom} s’emballe',
    ],
    textes: [
      'Les plateformes n’en finissent plus.',
      'Le public s’arrache le morceau.',
      'Un coup de projecteur inespéré.',
    ],
  },
  concert: {
    importance: 1,
    titres: ['{nom} sur scène', 'Concert de {nom}', 'Soirée réussie pour {nom}'],
    textes: [
      '{n} spectateurs au rendez-vous.',
      'Une belle soirée devant {n} personnes.',
      'La salle a répondu présent ({n}).',
    ],
  },
  festival: {
    importance: 2,
    titres: [
      '{nom} sur la scène d’un festival',
      'Festival : {nom} fait le show',
      'Beau passage de {nom}',
    ],
    textes: [
      'Le public était au rendez-vous.',
      'Une performance remarquée.',
      'Les programmateurs ont pris note.',
    ],
  },
  burnout: {
    importance: 3,
    titres: [
      '{nom} s’effondre en tournée',
      'Burnout pour {nom}',
      'Tournée annulée : {nom} épuisé·e',
    ],
    textes: [
      'Repos forcé pour plusieurs semaines.',
      'Le label est sous le choc.',
      'Les dates restantes sont annulées.',
    ],
  },
  'sous-genre-ne': {
    importance: 2,
    titres: ['Un nouveau sous-genre émerge', 'Une scène naît', 'Du neuf dans les styles'],
    textes: [
      'Les premiers à s’y engager seront avantagés.',
      'Les curieux se pressent.',
      'Une tendance à suivre.',
    ],
  },
  'sous-genre-disparu': {
    importance: 1,
    titres: ['Un sous-genre passe de mode', 'Fin de tendance', 'La vague retombe'],
    textes: [
      'Le public est déjà passé à autre chose.',
      'Les puristes restent fidèles.',
      'La roue tourne.',
    ],
  },
  'contrat-vendu': {
    importance: 2,
    titres: ['Contrat de {nom} cédé à {rival}', '{nom} change de maison', 'Transfert : {nom}'],
    textes: [
      'Une cession qui fait parler.',
      'Le marché des artistes bouge.',
      'Les finances respirent.',
    ],
  },
  'offre-rachat': {
    importance: 2,
    titres: [
      '{rival} veut racheter {nom}',
      'Offre de rachat sur {nom}',
      'Convoitise autour de {nom}',
    ],
    textes: ['À toi de décider.', 'Une offre qui ne durera pas.', 'Tentant, mais à quel prix ?'],
  },
  proces: {
    importance: 3,
    titres: ['Procès contre le label', 'Le label devant les tribunaux', 'Affaire judiciaire'],
    textes: [
      'Un artiste lésé réclame justice.',
      'L’avocat du label est sur le coup.',
      'La réputation est en jeu.',
    ],
  },
  'retour-en-grace': {
    importance: 2,
    titres: ['Retour en grâce pour {nom}', '{nom} fait son grand retour', 'Come-back de {nom}'],
    textes: [
      'Une carrière qu’on croyait finie renaît.',
      'Le public est aux anges.',
      'La légende reprend du service.',
    ],
  },
  'statut-culte': {
    importance: 2,
    titres: [
      '{nom} entre dans la légende',
      'Statut culte pour {nom}',
      '{nom} devient un·e artiste culte',
    ],
    textes: [
      'Une influence qui dure.',
      'Les fans du premier jour exultent.',
      'Une place à part dans l’histoire.',
    ],
  },
  'alerte-faillite': {
    importance: 3,
    titres: ['Le label au bord du gouffre', 'Trésorerie dans le rouge', 'Alerte financière'],
    textes: [
      'Il reste {n} semaines pour redresser la barre.',
      'Chaque semaine compte maintenant.',
      'Il faut agir vite.',
    ],
  },
  'label-de-l-annee': {
    importance: 3,
    titres: ['Label de l’année !', 'La profession couronne le label', 'Sacre pour le label'],
    textes: [
      'Une reconnaissance qui compte.',
      'Une belle année récompensée.',
      'Les rivaux encaissent.',
    ],
  },
  'signal-ere': {
    importance: 2,
    titres: ['Le vent tourne dans l’industrie', 'Signaux faibles', 'Quelque chose change'],
    textes: [
      '{texte}',
      'On en parle dans le métier : {texte}',
      'Les initiés l’ont remarqué : {texte}',
    ],
  },
  retraite: {
    importance: 3,
    titres: ['{nom} prend sa retraite', 'Fin de carrière pour {nom}', '{nom} range le micro'],
    textes: [
      'Le catalogue reste au label, la légende continue.',
      'Une page se tourne, les fans sont émus.',
      'Un parcours qui laissera une trace dans le label.',
    ],
  },
  'enfant-d-artiste': {
    importance: 2,
    titres: [
      'La relève de {parent} : {nom} débarque',
      '{nom} marche dans les pas de {parent}',
      'Un nom connu revient : {nom}',
    ],
    textes: [
      'Le public attend de voir si le talent se transmet.',
      'Un héritage lourd à porter, une curiosité immédiate.',
      'On dit que le talent est de famille.',
    ],
  },
  'marche-ouvert': {
    importance: 2,
    titres: [
      'Le label s’installe à l’étranger',
      'Un nouveau bureau ouvre ses portes',
      'Cap sur l’international',
    ],
    textes: [
      'Un bureau local ouvre : reste à conquérir le public.',
      'Les premiers contacts locaux sont prometteurs.',
      'Les goûts diffèrent d’un pays à l’autre : choisis bien tes artistes.',
    ],
  },
  'scene-emergente': {
    importance: 2,
    titres: [
      'Une scène s’embrase à {ville}',
      '{ville} : la scène {genre} décolle',
      'Tous les regards sont tournés vers {ville}',
    ],
    textes: [
      'Les salles se remplissent : c’est le moment d’aller y repérer des talents.',
      'Des artistes {genre} y éclosent chaque semaine.',
      'Les labels rivaux commencent à y envoyer leurs dénicheurs.',
    ],
  },
  'avertissement-concentration': {
    importance: 3,
    titres: [
      'Les autorités de la concurrence vous scrutent',
      'Concentration : un premier avertissement',
      'Votre part de marché inquiète',
    ],
    textes: [
      'Une enquête est en vue : plaider ou rééquilibrer ton catalogue.',
      'Un label aussi dominant attire l’attention des régulateurs.',
      'Si la pression monte encore, une amende tombera.',
    ],
  },
  'amende-concentration': {
    importance: 3,
    titres: [
      'Amende pour position dominante',
      'Les autorités sanctionnent le label',
      'Concentration excessive : l’amende tombe',
    ],
    textes: [
      'Le régulateur réclame {montant} pour abus de position dominante.',
      'Une amende de {montant} : le label doit rééquilibrer son activité.',
      '{montant} versés aux autorités de la concurrence.',
    ],
  },
  'vague-piratage': {
    importance: 3,
    titres: [
      'Une vague de piratage frappe le catalogue',
      'Fuites et copies : les écoutes s’effondrent',
      'Piratage massif signalé',
    ],
    textes: [
      '{severite} % des écoutes se perdent pendant {semaines} semaines.',
      'Une veille anti-piratage limiterait les dégâts.',
      'Les revenus d’écoute reculent de {severite} % pendant {semaines} semaines.',
    ],
  },
  'fin-piratage': {
    importance: 1,
    titres: ['La vague de piratage retombe', 'Fin de la vague de piratage', 'Le piratage reflue'],
    textes: [
      'Les écoutes reviennent à la normale.',
      'Les revenus d’écoute se rétablissent.',
      'Le calme revient sur les plateformes.',
    ],
  },
  'plateformes-renegocient': {
    importance: 3,
    titres: [
      'Les plateformes renégocient leurs tarifs',
      'Nouveaux tarifs de streaming annoncés',
      'Les plateformes serrent la vis',
    ],
    textes: [
      'Une baisse de {baisse} % du revenu par écoute est annoncée, dans {preavis} semaines.',
      'Tu peux tenter de résister avant leur entrée en vigueur : {baisse} % de baisse en jeu.',
      'Les nouveaux tarifs rogneront {baisse} % de tes écoutes pendant un an.',
    ],
  },
  'resistance-plateformes': {
    importance: 2,
    titres: [
      'Bras de fer avec les plateformes',
      'Négociation tendue avec les plateformes',
      'Le label tient tête aux plateformes',
    ],
    textes: [
      'Le résultat de la négociation se lira sur les prochains tarifs.',
      'Les plateformes ont entendu le label.',
      'Les discussions ont porté sur les tarifs à venir.',
    ],
  },
  'changement-ere': {
    importance: 3,
    titres: ['Une nouvelle ère commence', '{ere} : le marché a basculé', 'Les règles changent'],
    textes: [
      'Début de : {ere}. Les anciennes habitudes ne suffisent plus.',
      '{ere} s’ouvre : adapte ton label.',
      'Le marché a changé de visage : {ere}.',
    ],
  },
};
