/**
 * Textes des événements, par identifiant. Les variables entre accolades (`{nom}`, `{montant}`) sont
 * remplacées par celles de l'événement. Les choix sont identifiés par leur id.
 */
export interface EventText {
  titre: string;
  texte: string;
  choix?: Readonly<Record<string, string>>;
}

export const EVENT_TEXTS: Readonly<Record<string, EventText>> = {
  caprice: {
    titre: 'Un caprice de star',
    texte: '{nom} exige un cadeau pour « rester inspiré·e » : un budget de {montant} centimes.',
    choix: { payer: 'Payer', refuser: 'Refuser' },
  },
  'menace-burnout': {
    titre: 'Épuisement en vue',
    texte: '{nom} est à bout de forces. Ses proches te demandent de lever le pied.',
    choix: { repos: 'Quatre semaines de repos', forcer: 'Maintenir le rythme' },
  },
  'conflit-interne': {
    titre: 'Tension dans le roster',
    texte: '{nom} et {autre} ne se supportent plus. Il faut trancher avant que ça déborde.',
    choix: { mediation: 'Organiser une médiation', ignorer: 'Laisser couler' },
  },
  'demande-augmentation': {
    titre: 'Demande d’augmentation',
    texte: '{nom} réclame une meilleure part de royalties, forte·e de son succès.',
    choix: { accepter: 'Accepter la hausse', refuser: 'Refuser' },
  },
  'vol-idee': {
    titre: 'Accusation de plagiat',
    texte: '{nom} est accusé·e d’avoir repris une idée d’un autre artiste du label.',
    choix: { defendre: 'Défendre publiquement', calmer: 'Calmer le jeu' },
  },
  'retour-inattendu': {
    titre: 'Retour inattendu',
    texte: '{nom} signe un come-back que personne n’attendait : la presse s’emballe.',
  },
  inspiration: {
    titre: 'Un coup d’inspiration',
    texte: '{nom} traverse une période créative exceptionnelle et écrit mieux que jamais.',
  },
  'blessure-voix': {
    titre: 'Voix en danger',
    texte: '{nom} perd la voix après une série de dates. Repos forcé.',
  },
  'fan-devoue': {
    titre: 'Un fan devient viral',
    texte: 'Une vidéo d’un fan de {nom} fait le tour des réseaux : l’audience grimpe.',
  },
  'bonheur-prive': {
    titre: 'Bonne nouvelle personnelle',
    texte: '{nom} vit une très belle période privée, et ça s’entend dans le studio.',
  },
  'depart-envisage': {
    titre: 'Départ envisagé',
    texte:
      '{nom} songe à quitter le label. Une prime de fidélité de {prime} centimes pourrait le·la retenir.',
    choix: { retenir: 'Verser la prime', laisser: 'Le·la laisser partir' },
  },
  'retard-studio': {
    titre: 'Retard au studio',
    texte:
      'Le projet de {nom} prend du retard : le studio propose de payer des heures supplémentaires ({prime} centimes).',
    choix: { 'heures-sup': 'Payer les heures sup', 'accepter-retard': 'Accepter le retard' },
  },
  'fuite-titre': {
    titre: 'Un titre a fuité',
    texte: 'Un extrait du projet de {nom} circule en ligne avant la sortie.',
    choix: { plainte: 'Porter plainte', 'en-profiter': 'En profiter pour le buzz' },
  },
  'sample-non-declare': {
    titre: 'Sample non déclaré',
    texte:
      'Le projet de {nom} contient un sample jamais déclaré. Un règlement amiable coûterait {reglement} centimes.',
    choix: { regler: 'Régler à l’amiable', ignorer: 'Prendre le risque' },
  },
  'proces-sample': {
    titre: 'Procès pour sample',
    texte: 'Les ayants droit attaquent le label : dommages et intérêts, et mauvaise presse.',
  },
  'featuring-surprise': {
    titre: 'Featuring surprise',
    texte: 'Un artiste en vue propose de poser sur le projet de {nom} pour {cachet} centimes.',
    choix: { accepter: 'Accepter', refuser: 'Refuser' },
  },
  'panne-materiel': {
    titre: 'Panne de matériel',
    texte: 'Une panne au studio coûte cher et retarde le projet de {nom}.',
  },
  'session-inspiree': {
    titre: 'Session inspirée',
    texte: 'Une session de nuit transcende le projet de {nom}.',
  },
  'producteur-star': {
    titre: 'Producteur star disponible',
    texte: 'Un producteur réputé se libère pour {nom} contre {cachet} centimes.',
    choix: { engager: 'L’engager', decliner: 'Décliner' },
  },
  'mixage-rate': {
    titre: 'Mixage raté',
    texte: 'Le mixage du projet de {nom} déçoit. Le refaire coûte {frais} centimes.',
    choix: { refaire: 'Refaire le mixage', 'tel-quel': 'Sortir tel quel' },
  },
  'clip-viral': {
    titre: 'Un clip devenu viral',
    texte: 'Le clip de {nom} s’envole sur les plateformes.',
  },
  'pression-delai': {
    titre: 'Pression sur les délais',
    texte:
      'Le calendrier presse pour le projet de {nom}. On peut accélérer, au risque de la qualité.',
    choix: { accelerer: 'Accélérer', maintenir: 'Maintenir le calendrier' },
  },
  'genre-en-hausse': {
    titre: 'Un genre monte',
    texte: 'Le {genre} est partout : les écoutes explosent et les labels s’y précipitent.',
  },
  'genre-en-berne': {
    titre: 'Un genre s’essouffle',
    texte: 'Le {genre} perd de son éclat : les écoutes reculent.',
  },
  'changement-remuneration': {
    titre: 'Les plateformes changent leurs tarifs',
    texte: 'Le revenu par écoute varie de {pct} % sur les plateformes.',
  },
  'saison-des-festivals': {
    titre: 'Saison des festivals',
    texte: 'Deux nouveaux festivals ouvrent leurs candidatures cette année.',
  },
  'nouveau-sous-genre': {
    titre: 'Un sous-genre émerge',
    texte: 'Une scène naissante invente un nouveau son : les premiers à y signer en profiteront.',
  },
  'crise-economique': {
    titre: 'Crise économique',
    texte: 'Le public dépense moins : tous les genres reculent et les plateformes paient moins.',
  },
  'phenomene-viral': {
    titre: 'Phénomène viral',
    texte: 'Une tendance virale propulse le {genre} sur les réseaux.',
  },
  'vague-de-nostalgie': {
    titre: 'Vague de nostalgie',
    texte: 'Le public se tourne vers la variété d’hier.',
  },
  'saturation-du-marche': {
    titre: 'Saturation',
    texte: 'Trop de sorties dans le {genre} : le public se lasse.',
  },
  'algorithme-plateforme': {
    titre: 'Nouvel algorithme',
    texte:
      'Une plateforme change son algorithme. Un budget de {budget} centimes aide les artistes à s’y adapter.',
    choix: { investir: 'Investir', ignorer: 'Ignorer' },
  },
  'buzz-ville': {
    titre: 'Buzz à {ville}',
    texte: 'Une scène locale à {ville} fait parler du {genre}.',
  },
  'collaboration-spontanee': {
    titre: 'Collaboration spontanée',
    texte: '{nom} et {autre} improvisent un titre ensemble. Les fans adorent.',
  },
};

/** Remplace les `{variable}` d'un texte. */
export function fillTemplate(
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
