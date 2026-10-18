import type { Cents, EventsState } from '@tycoon/core';
import type { TierId } from './balance';
import type { Artist } from './artists';
import type { FinanceState } from './finance';
import type { Rival } from './auction';
import type { Contrat } from './contracts';
import type { Objectif, Stats } from './achievements';
import type { RapportMensuel } from './monthly';
import type { Actu } from './fil';
import type { Ceremonie } from './ceremonies';
import type { OffreRachat } from './rival-interactions';
import type { Mentorat, Relation } from './relations';
import type { Fiscalite } from './tax';
import type { Faillite } from './bankruptcy';
import type { Investisseur, OffreInvestisseur } from './investors';
import type { Credit, Pret } from './loans';
import type { OffreSynchro } from './sync';
import type { Festival } from './festivals';
import type { Tournee } from './tours';
import type { Concert } from './concerts';
import type { Plateforme } from './conglomerat';
import type { ErasState } from './eres';
import type { InstitutionState } from './institution';
import type { InternationalState } from './international';
import type { RegulationState } from './regulation';
import type { SceneLocale } from './scenes';
import type { Dirigeant, SousLabel } from './groupe';
import type { ScenarioState } from './scenarios/types';
import type { Commande } from './pressing';
import type { BatimentsState } from './buildings';
import type { Cadre, DelegationDomain, Rapport } from './delegation';
import type { Membre } from './staff';
import type { Prevision } from './forecast';
import type { SousGenre } from './market';
import type { ChartsState } from './charts';
import type { SortieRivale } from './calendar';
import type { Projet } from './production';
import type { Negociation } from './negotiation';
import type { Denicheur, Prospect } from './scouting';
import type { GameConfig } from './config';
import type { MarketState } from './market';

/** Le label du joueur. */
export interface LabelData {
  nom: string;
  tier: TierId;
  /** Trésorerie en centimes (entier). Peut être négative : c'est la faillite qui menace. */
  tresorerie: Cents;
  /** Réputation (0-100). */
  reputation: number;
  /** Crédibilité du label dans chaque genre (0-100), par identifiant de genre. */
  credibilite: Record<string, number>;
}

/**
 * État complet d'une partie. Entièrement sérialisable (JSON simple), sans fonction ni classe :
 * c'est ce qui permet le hash, la sauvegarde et le rejeu. Les collections (artistes, sorties,
 * contrats…) s'ajoutent ici au fil des fonctionnalités.
 */
export interface LabelState {
  config: GameConfig;
  label: LabelData;
  events: EventsState;
  marche: MarketState;
  finances: FinanceState;
  /** Villes fictives du monde, fixées au départ. */
  villes: string[];
  /** Tous les artistes du monde : libres, signés par le joueur ou par un rival (voir `employeur`). */
  artistes: Artist[];
  /** Talents que le joueur suit (repérage) : il n'en connaît que des fourchettes. */
  suivis: Prospect[];
  /** Dénicheurs employés : ils améliorent la précision des fourchettes et orientent le repérage. */
  denicheurs: Denicheur[];
  /** Contrats en cours : au plus un par artiste. */
  contrats: Contrat[];
  /** Labels rivaux. */
  rivaux: Rival[];
  /** Projets de production et sorties. */
  projets: Projet[];
  /** Sorties planifiées par les rivaux. */
  sortiesRivales: SortieRivale[];
  /** Classements hebdomadaires et historique des sorties du joueur. */
  classements: ChartsState;
  /** Sous-genres fictifs vivants. */
  sousGenres: SousGenre[];
  /** Prévisions de popularité obtenues par les études de marché. */
  previsions: Prevision[];
  /** Équipe embauchée et candidats disponibles. */
  personnel: Membre[];
  candidats: Membre[];
  /** Cadres de délégation fixés par le joueur, et rapports des décisions prises. */
  delegation: Partial<Record<DelegationDomain, Cadre>>;
  rapports: Rapport[];
  /** Bâtiments du label. */
  batiments: BatimentsState;
  /** Commandes de pressage (vinyles, CD). */
  commandes: Commande[];
  /** Concerts organisés. */
  concerts: Concert[];
  /** Tournées lancées. */
  tournees: Tournee[];
  /** Festivals ouverts aux candidatures. */
  festivals: Festival[];
  /** Offres de synchronisation en attente de réponse. */
  offresSynchro: OffreSynchro[];
  /** Prêts en cours et historique de crédit. */
  prets: Pret[];
  credit: Credit;
  /** Offres d'investisseurs en attente et investisseurs entrés au capital. */
  offresInvest: OffreInvestisseur[];
  investisseurs: Investisseur[];
  /** Compteur de faillite. */
  faillite: Faillite;
  /** Stratégie fiscale et historique. */
  fiscalite: Fiscalite;
  /** Relations entre artistes du roster et mentorats. */
  relations: Relation[];
  mentorats: Mentorat[];
  /** Offres de rachat de rivaux, et semaines où de nouveaux rivaux doivent apparaître. */
  offresRachat: OffreRachat[];
  remplacements: number[];
  /** Cérémonie de l'année en cours (nominations, gagnants). */
  ceremonie: Ceremonie | null;
  /** Le Fil du label (actus générées) et mémoire des gabarits déjà utilisés. */
  fil: Actu[];
  filMemoire: Record<string, number>;
  /** Rapports mensuels : ce qui a marché, raté, et pourquoi. */
  rapportsMensuels: RapportMensuel[];
  /** Compteurs cumulés par type de signal, succès obtenus, objectifs en cours et records. */
  stats: Stats;
  succes: string[];
  objectifs: Objectif[];
  records: { clef: string; valeur: number; semaine: number }[];
  /** Négociations en cours ou rompues, une par artiste. */
  negociations: Negociation[];
  /** Ères : programme tiré à la création et ère en cours. */
  eres: ErasState;
  /** Palier Institution : fondation, académie, musée, influence. */
  institution: InstitutionState;
  /** Marchés internationaux : bureaux locaux et campagnes (palier Major). */
  international: InternationalState;
  /** Scènes musicales des villes : profil de genres et chaleur. */
  scenes: SceneLocale[];
  /** Friction de fin de partie : concentration, piratage, tarifs des plateformes. */
  regulation: RegulationState;
  /** Palier Conglomérat : plateforme maison, niveau des studios de synchro et festivals possédés. */
  plateforme: Plateforme | null;
  studiosSynchro: number;
  festivalsPossedes: number;
  /** Palier Groupe : sous-labels et cadres (embauchés ou candidats). */
  sousLabels: SousLabel[];
  cadres: Dirigeant[];
  /** Suivi du scénario en cours (mode scénario) ; absent dans les autres modes. */
  scenario?: ScenarioState;
  /** Prochain identifiant libre, partagé par toutes les entités (artistes, sorties, contrats…). */
  nextId: number;
}

/** Attribue un identifiant unique et fait avancer le compteur. */
export function newId(state: LabelState): number {
  const id = state.nextId;
  state.nextId += 1;
  return id;
}
