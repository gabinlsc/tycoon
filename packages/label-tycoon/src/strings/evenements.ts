import { TEXTES_SAISONNIERS } from '../content/events/saisons/specs';

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
  'clash-public': {
    titre: 'Clash public',
    texte:
      '{nom} s’est fait attaquer publiquement par un autre artiste. Les médias attendent une réponse.',
    choix: { repondre: 'Répondre', calmer: 'Calmer le jeu' },
  },
  polemique: {
    titre: 'Polémique',
    texte: 'Une phrase de {nom} fait polémique. Un démenti coûterait {frais} centimes.',
    choix: { dementir: 'Démentir', assumer: 'Assumer' },
  },
  'mauvais-buzz': {
    titre: 'La polémique s’emballe',
    texte: 'Les propos de {nom} continuent d’alimenter les débats, et pas en bien.',
  },
  'interview-ratee': {
    titre: 'Interview ratée',
    texte: '{nom} s’est emmêlé·e lors d’une interview : l’extrait circule partout.',
  },
  'buzz-positif': {
    titre: 'Buzz positif',
    texte: 'La presse encense {nom}, de nouveaux fans arrivent.',
  },
  'article-elogieux': {
    titre: 'Article élogieux',
    texte: 'Un grand média salue l’écriture de {nom}.',
  },
  documentaire: {
    titre: 'Proposition de documentaire',
    texte:
      'Une équipe veut tourner un documentaire sur {nom}. Participation aux frais : {cout} centimes.',
    choix: { accepter: 'Accepter', refuser: 'Refuser' },
  },
  'rumeur-couple': {
    titre: 'Rumeur people',
    texte: 'Une rumeur sentimentale sur {nom} occupe les magazines.',
  },
  'passage-tv': {
    titre: 'Invitation télé',
    texte: '{nom} est invité·e sur un plateau télé très regardé.',
    choix: { accepter: 'Y aller', refuser: 'Décliner' },
  },
  'critique-assassine': {
    titre: 'Critique assassine',
    texte: 'Une critique cinglante du dernier projet de {nom} fait mal aux écoutes.',
  },
  'influenceur-fan': {
    titre: 'Un influenceur adore',
    texte: 'Un influenceur très suivi partage son amour pour {nom}.',
  },
  'fausse-information': {
    titre: 'Fausse information',
    texte: 'Une fausse information sur {nom} se propage. Un démenti coûte {frais} centimes.',
    choix: { dementir: 'Démentir', ignorer: 'Ignorer' },
  },
  'offre-synchro-exceptionnelle': {
    titre: 'Offre de synchro exceptionnelle',
    texte: 'Un grand film veut utiliser un titre de {nom}. Le cachet est très généreux.',
  },
  'rachat-catalogue': {
    titre: 'Offre de rachat de catalogue',
    texte: 'Un fonds propose {prix} centimes pour les droits du projet de {nom}.',
    choix: { vendre: 'Vendre les droits', garder: 'Garder le catalogue' },
  },
  inspection: {
    titre: 'Contrôle administratif',
    texte: 'Une inspection impose des mises aux normes. Un juriste limite la facture.',
  },
  'proces-ancien-employe': {
    titre: 'Procès d’un ancien employé',
    texte: 'Un ancien collaborateur attaque le label aux prud’hommes.',
  },
  'subvention-culturelle': {
    titre: 'Subvention culturelle',
    texte: 'Le label décroche une aide à la création : un bon coup de pouce.',
  },
  'litige-fiscal': {
    titre: 'Litige fiscal',
    texte:
      'L’administration réclame {somme} centimes. Contester coûte moins cher qu’en cas d’erreur, avec un juriste.',
    choix: { contester: 'Contester', payer: 'Payer' },
  },
  'partenariat-marque': {
    titre: 'Partenariat avec une marque',
    texte: 'Une marque propose {cachet} centimes pour associer son image à {nom}.',
    choix: { accepter: 'Accepter', refuser: 'Refuser' },
  },
  cyberattaque: {
    titre: 'Cyberattaque',
    texte: 'Les serveurs du label sont attaqués : frais de remise en route et un projet retardé.',
  },
  'don-de-mecene': {
    titre: 'Un mécène généreux',
    texte: 'Un passionné de musique fait un don au label.',
  },
  'talent-du-metier': {
    titre: 'Un talent du métier se libère',
    texte:
      'Un professionnel très recherché ajoute ton label à sa liste : il est disponible à l’embauche.',
  },
  'hausse-loyer': {
    titre: 'Hausse du loyer',
    texte: 'Le propriétaire révise le loyer à la hausse : un rappel est dû.',
  },
  'nomination-recue': {
    titre: 'Nomination !',
    texte: '{nom} est nommé·e dans la catégorie « {categorie} » : le label est en effervescence.',
  },
  'tapis-rouge': {
    titre: 'Le tapis rouge',
    texte:
      '{nom} foule le tapis rouge. Une tenue de luxe coûte {tenue} centimes mais fait sensation.',
    choix: { luxe: 'Tenue de luxe', sobre: 'Rester sobre' },
  },
  'prix-remporte': {
    titre: 'Prix remporté !',
    texte: '{nom} remporte le prix « {categorie} ». Toute la salle se lève.',
  },
  'discours-gagnant': {
    titre: 'Le discours',
    texte: '{nom} monte sur scène pour remercier. Quel ton adopter ?',
    choix: { sincere: 'Sincère et touchant', provocateur: 'Provocateur' },
  },
  'prix-perdu': {
    titre: 'Reparti·e les mains vides',
    texte: '{nom} n’a pas été récompensé·e dans la catégorie « {categorie} ». L’amertume pèse.',
  },
  boycott: {
    titre: 'Cérémonie boudée',
    texte: '{nom} refuse de se déplacer : la presse y voit un coup de com ou un caprice.',
  },
  'after-party': {
    titre: 'After-party',
    texte: 'La soirée s’éternise. Louer une salle pour {nom} coûte {budget} centimes.',
    choix: { 'faire-la-fete': 'Faire la fête', rentrer: 'Rentrer se reposer' },
  },
  'label-de-l-annee': {
    titre: 'Label de l’année',
    texte: 'Le label est sacré par la profession : une reconnaissance qui compte.',
  },
  'collaboration-spontanee': {
    titre: 'Collaboration spontanée',
    texte: '{nom} et {autre} improvisent un titre ensemble. Les fans adorent.',
  },
  ...TEXTES_SAISONNIERS,
};

/** Remplace les `{variable}` d'un texte. */
export function fillTemplate(
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));
}
