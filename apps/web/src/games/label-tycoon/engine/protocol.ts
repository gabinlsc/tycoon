import type { CommandeJeu, ReponseJeu } from '@tycoon/label-tycoon';

/** Message envoyé au worker : une commande et un identifiant pour retrouver sa réponse. */
export interface RequeteWorker {
  id: number;
  commande: CommandeJeu;
}

/** Réponse du worker, rattachée à la requête par son identifiant. */
export interface ReponseWorker {
  id: number;
  reponse: ReponseJeu;
}

/** Ce que l'interface voit du moteur : envoyer une commande, recevoir une réponse. */
export interface MoteurLabel {
  envoyer(commande: CommandeJeu): Promise<ReponseJeu>;
  arreter(): void;
}
