import type { VueJeu } from '@tycoon/label-tycoon';
import type { EcranId } from './ecrans';

export type Conseil = { texte: string; ecran: EcranId; bouton: string; ton: 'alerte' | 'idee' };

/** Prochaine bonne action selon l'état du label, ou `null` si tout roule. */
export function conseilDeMax(vue: VueJeu): Conseil | null {
  if (vue.finances.tresorerie < 0)
    return {
      texte: 'On est dans le rouge. Un coup d’œil aux comptes ?',
      ecran: 'finances',
      bouton: 'Voir les comptes',
      ton: 'alerte',
    };
  if (vue.decisions.length > 0)
    return {
      texte:
        vue.decisions.length > 1
          ? `${vue.decisions.length} décisions t’attendent.`
          : 'Une décision t’attend.',
      ecran: 'boite',
      bouton: 'Ouvrir la boîte',
      ton: 'alerte',
    };
  if (vue.roster.length === 0)
    return {
      texte: 'Il te faut un premier talent !',
      ecran: 'reperage',
      bouton: 'Dénicher',
      ton: 'idee',
    };
  const epuise = vue.roster.find((a) => a.moral < 30);
  if (epuise)
    return {
      texte: `${epuise.nom} est à bout. Du repos, vite.`,
      ecran: 'roster',
      bouton: 'Voir le roster',
      ton: 'alerte',
    };
  const partant = vue.roster.find((a) => a.contrat && a.contrat.echeance - vue.semaine <= 8);
  if (partant)
    return {
      texte: `Le contrat de ${partant.nom} touche à sa fin.`,
      ecran: 'roster',
      bouton: 'Renouveler',
      ton: 'idee',
    };
  const oisif = vue.roster.find((a) => !a.enProduction);
  if (oisif)
    return {
      texte: `${oisif.nom} n’a rien en production.`,
      ecran: 'studio',
      bouton: 'Au studio',
      ton: 'idee',
    };
  return null;
}
