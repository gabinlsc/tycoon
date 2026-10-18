import type { AchievementFamily } from '../balance/achievements';

/** Intitulés des succès : un titre et une description par famille, paramétrés par le seuil. */
export const SUCCES_TEXTES: Readonly<
  Record<AchievementFamily, { titre: (n: number) => string; description: (n: number) => string }>
> = {
  signatures: {
    titre: (n) => `Chasseur de talents ×${n}`,
    description: (n) => `Signer ${n} artiste(s) dans ton label.`,
  },
  sorties: {
    titre: (n) => `Maison productive ×${n}`,
    description: (n) => `Publier ${n} sortie(s).`,
  },
  concerts: { titre: (n) => `Sur scène ×${n}`, description: (n) => `Organiser ${n} concert(s).` },
  certifications: {
    titre: (n) => `Mur de disques ×${n}`,
    description: (n) => `Obtenir ${n} certification(s).`,
  },
  prix: { titre: (n) => `Palmarès ×${n}`, description: (n) => `Remporter ${n} prix.` },
  nominations: {
    titre: (n) => `Habitué des cérémonies ×${n}`,
    description: (n) => `Recevoir ${n} nomination(s).`,
  },
  viral: {
    titre: (n) => `Phénomène ×${n}`,
    description: (n) => `Provoquer ${n} emballement(s) viral/viraux.`,
  },
  festivals: {
    titre: (n) => `Têtes d’affiche ×${n}`,
    description: (n) => `Jouer ${n} festival(s).`,
  },
  debauchages: {
    titre: (n) => `Dur coup ×${n}`,
    description: (n) => `Se faire débaucher ${n} artiste(s).`,
  },
  evenements: {
    titre: (n) => `Vécu ×${n}`,
    description: (n) => `Traverser ${n} événement(s) et décision(s).`,
  },
  anciennete: {
    titre: (n) => `Pérennité : ${Math.round(n / 52)} an(s)`,
    description: (n) => `Tenir ${Math.round(n / 52)} an(s) à la tête du label.`,
  },
  tresorerie: {
    titre: (n) => `Trésor : ${Math.round(n / 100).toLocaleString('fr-FR')} €`,
    description: (n) => `Avoir ${Math.round(n / 100).toLocaleString('fr-FR')} € en caisse.`,
  },
  valorisation: {
    titre: (n) => `Valeur : ${Math.round(n / 100).toLocaleString('fr-FR')} €`,
    description: (n) =>
      `Atteindre une valorisation de ${Math.round(n / 100).toLocaleString('fr-FR')} €.`,
  },
  palier: {
    titre: (n) => `Palier ${n + 1}`,
    description: (n) => `Atteindre le palier n° ${n + 1} du label.`,
  },
  credibilite: {
    titre: (n) => `Crédible à ${n}`,
    description: (n) => `Atteindre ${n} de crédibilité dans un genre.`,
  },
  classement: {
    titre: (n) => (n === 1 ? 'Numéro un !' : `Top ${n}`),
    description: (n) =>
      n === 1 ? 'Placer une sortie en tête du classement.' : `Placer une sortie dans le Top ${n}.`,
  },
  equipe: { titre: (n) => `Équipe de ${n}`, description: (n) => `Employer ${n} membres d’équipe.` },
  studio: {
    titre: (n) => `Studio niveau ${n}`,
    description: (n) => `Construire un studio de niveau ${n}.`,
  },
  retours: {
    titre: (n) => `Légendes ×${n}`,
    description: (n) => `Voir ${n} retour(s) en grâce ou statut(s) culte.`,
  },
  enchere: { titre: (n) => `Enchérisseur ×${n}`, description: (n) => `Disputer ${n} enchère(s).` },
};

export const OBJECTIF_TEXTES = {
  signer: 'Signer un nouvel artiste',
  sortir: 'Publier deux sorties',
  concert: 'Organiser deux concerts',
  certification: 'Décrocher une certification',
  classement: 'Faire entrer une sortie au classement',
  tresorerie: 'Faire grimper la trésorerie',
} as const;

export const RECORD_TEXTES = {
  'meilleure-sortie': 'Meilleure sortie (écoutes)',
  'plus-gros-fandom': 'Plus gros fandom',
  'tresorerie-max': 'Trésorerie maximale',
  'plus-longue-presence': 'Plus longue présence au classement',
} as const;
