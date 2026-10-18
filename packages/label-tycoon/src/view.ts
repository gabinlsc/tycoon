import { calendarOf } from '@tycoon/core';
import { notoriety } from './artists';
import { fr } from './strings/fr';
import { describeEvent } from './strings';
import { RECORD_TEXTES, SUCCES_TEXTES } from './strings/succes';
import type { LabelState } from './state';
import { labelScore, valuation } from './valuation';
import { VISIBLE_ATTRIBUTES, knownRange } from './scouting';
import { bestCertification, certificationThreshold, equivalentSales } from './charts';
import { type Clauses, fairAdvance, rosterCap } from './contracts';
import {
  BUILDINGS,
  BUILDING_IDS,
  INTEL,
  LOANS,
  PERSONALITIES,
  STAFF,
  TAX,
  TOUR,
  UNLOCKS,
  VENUES,
  VENUE_IDS,
  type AchievementFamily,
  type TaxStrategy,
} from './balance';
import { buyoutAsk } from './rival-interactions';
import { analystLevel } from './forecast';
import { genreKeys, trendMultiplier } from './market';
import { announcedReleases } from './calendar';
import { SUCCES, familyValue, objectiveProgress } from './achievements';
import { festivalOffer } from './festivals';
import { venueCost } from './tours';
import { DEFI_SEMAINES, defiTermine, resultatDefi, texteResultat } from './defi';
import { conditionMet, findScenario } from './scenarios/engine';
import { texteCondition } from './scenarios/textes';
import { buildingLevel, teamCapacity } from './buildings';
import { loanCap, loanRate, outstanding } from './loans';
import { tierAtLeast } from './tiers';

/**
 * Vue du jeu pour l'interface : un instantané sérialisable et plat, calculé à partir de l'état.
 * L'interface ne lit jamais l'état brut (elle ne voit donc pas les attributs cachés des talents).
 */
export interface VueArtiste {
  id: number;
  nom: string;
  genre: string;
  /** Nom affichable du genre (sous-genres fictifs compris). */
  genreNom: string;
  phaseNom: string;
  ville: string;
  /** Traits connus (libellés), pour un artiste signé. */
  traits: string[];
  age: number;
  phase: string;
  employeur: string;
  notoriete: number;
  fans: number;
  hype: number;
  moral: number;
  fatigue: number;
  /** Compétences visibles (artistes signés ou libres : valeur réelle seulement pour le roster du joueur). */
  competences: Record<string, number>;
  /** Contrat en cours : échéance et part de royalties de l'artiste (points de base), ou `null`. */
  contrat: { echeance: number; royaltiesBps: number } | null;
  /** Vrai si un projet est en production pour cet artiste. */
  enProduction: boolean;
}

export interface VueSuivi {
  id: number;
  nom: string;
  genre: string;
  source: string;
  observations: number;
  essai: boolean;
  /** Avance habituelle pour un talent de cette notoriété (centimes), arrondie : un repère, pas une valeur exacte. */
  avanceIndicative: number;
  /** État de la négociation en cours avec ce talent. */
  negociation: {
    contres: number;
    reaction: string;
    contre: Clauses | null;
    rompue: boolean;
  } | null;
  /** Fourchettes des attributs connus. */
  fourchettes: Record<string, readonly [number, number]>;
}

export interface VueDecision {
  instanceId: number;
  eventId: string;
  titre: string;
  texte: string;
  echeance: number;
  choix: { id: string; libelle: string; disponible: boolean }[];
  parDefaut: string;
}

export interface VueActu {
  id: number;
  semaine: number;
  titre: string;
  texte: string;
  importance: 1 | 2 | 3;
  kind: string;
}

export interface VueEcheance {
  type: 'projet' | 'contrat';
  artisteId: number;
  nom: string;
  semaine: number;
}

export interface VueSortieCalendrier {
  /** `joueur` : projet du joueur ; `rival` : sortie annoncée d'un rival. */
  origine: 'joueur' | 'rival';
  nom: string;
  genre: string;
  genreNom: string;
  semaine: number;
  /** Poids de la sortie (type) pour les rivaux ; 0 pour le joueur. */
  poids: number;
  statut: string;
}

export interface VueLigneClassement {
  rang: number;
  nom: string;
  streams: number;
  joueur: boolean;
}

export interface VueCertification {
  projetId: number;
  nom: string;
  niveau: string | null;
  ventes: number;
  prochain: { niveau: string; seuil: number } | null;
}

export interface VueHistoriqueClassement {
  projetId: number;
  nom: string;
  classement: 'singles' | 'albums';
  meilleure: number;
  semaines: number;
  position: number | null;
}

export interface VueGenre {
  id: string;
  nom: string;
  popularite: number;
  /** Multiplicateur de tendance appliqué au potentiel de hit. */
  tendance: number;
  audience: number;
  credibilite: number;
  /** Sous-genre fictif : semaine de naissance et durée de vie. */
  sousGenre: { naissance: number; duree: number; premier: string | null } | null;
}

export interface VuePrevision {
  genre: string;
  nom: string;
  faiteLe: number;
  pour: number;
  valeur: number;
  marge: number;
}

export interface VueRival {
  id: number;
  nom: string;
  personnalite: string;
  genreFetiche: string;
  reputation: number;
  tresorerie: number;
  valorisation: number;
  roster: { id: number; nom: string; genreNom: string; notoriete: number; prixRachat: number }[];
}

export interface VueOffreRachat {
  id: number;
  rival: string;
  artisteId: number;
  artiste: string;
  prix: number;
  expire: number;
}

export interface VueConcurrence {
  rivaux: VueRival[];
  /** Part du marché des artistes par genre : artistes du joueur et de chaque rival. */
  parts: { genre: string; nom: string; joueur: number; rivaux: number; libres: number }[];
  offres: VueOffreRachat[];
  /** Historique des affrontements (débauchages, clashs, rachats, signatures rivales). */
  affrontements: VueActu[];
}

export interface VueLigneFinance {
  cle: string;
  nom: string;
  montant: number;
}

export interface VueFinancesDetail {
  /** Résultat des derniers mois clos, du plus ancien au plus récent. */
  mois: { debut: number; fin: number; revenus: number; depenses: number; net: number }[];
  /** Détail par catégorie du dernier mois clos (ou de la semaine en cours à défaut). */
  revenus: VueLigneFinance[];
  depenses: VueLigneFinance[];
  periode: 'mois' | 'semaine';
  prets: {
    id: number;
    capital: number;
    restant: number;
    tauxBps: number;
    semainesRestantes: number;
  }[];
  emprunt: {
    debloque: boolean;
    encours: number;
    plafond: number;
    tauxBps: number;
    minimum: number;
    semaines: { min: number; max: number };
  };
  offresInvestisseurs: {
    id: number;
    nom: string;
    apport: number;
    partBps: number;
    objectifCA: number;
    expire: number;
  }[];
  investisseurs: {
    id: number;
    nom: string;
    apport: number;
    partBps: number;
    objectifCA: number;
    echeance: number;
    statut: string;
  }[];
  investisseursDebloques: boolean;
  fiscalite: {
    strategie: TaxStrategy;
    dernierImpot: number;
    controles: number;
    options: { id: TaxStrategy; tauxBps: number; risque: number }[];
  };
}

export interface VuePersonnel {
  equipe: {
    id: number;
    nom: string;
    role: string;
    niveau: number;
    specialite: string | null;
    salaire: number;
    moral: number;
    trait: string;
    experience: number;
  }[];
  candidats: {
    id: number;
    nom: string;
    role: string;
    niveau: number;
    specialite: string | null;
    salaire: number;
    trait: string;
  }[];
  capacite: number;
  masseSalariale: number;
  experiencePourNiveau: number;
  delegation: {
    actif: boolean;
    budgetMax: number;
    seuilAlerte: number;
    genres: string[];
    denicheurs: number;
    rapports: {
      semaine: number;
      decision: string | null;
      cout: number;
      retenus: number;
      ecartes: number;
    }[];
  };
  genres: { id: string; nom: string }[];
}

export interface VueBatiment {
  id: string;
  nom: string;
  effet: string;
  niveau: number;
  niveauMax: number;
  /** Coût du prochain niveau (centimes), ou `null` au niveau maximal. */
  coutSuivant: number | null;
  semainesTravaux: number;
  entretien: number;
  palierRequis: string;
  palierAtteint: boolean;
  /** Fin des travaux en cours (semaine) et niveau visé. */
  travaux: { niveau: number; fin: number } | null;
}

export interface VueScene {
  salles: {
    id: string;
    nom: string;
    capacite: number;
    cout: number;
    prixRef: number;
    notorieteRef: number;
  }[];
  /** Artistes du joueur et leur état de forme. */
  artistes: {
    id: number;
    nom: string;
    fans: number;
    hype: number;
    fatigue: number;
    repos: number;
  }[];
  niveauSalleMaison: number;
  concerts: {
    id: number;
    artiste: string;
    salle: string;
    prix: number;
    date: number;
    resolu: boolean;
    spectateurs: number;
    recette: number;
    tournee: boolean;
  }[];
  tournees: {
    id: number;
    artiste: string;
    dates: number;
    tenues: number;
    merchStock: number;
    merchVendu: number;
    annulee: boolean;
  }[];
  festivals: {
    id: number;
    nom: string;
    semaine: number;
    notorieteMin: number;
    cachet: number;
    artiste: string | null;
    tete: boolean;
    /** Artistes du joueur qui peuvent candidater, avec le cachet obtenu. */
    eligibles: { artisteId: number; tete: boolean; cachet: number }[];
  }[];
  offresSynchro: {
    id: number;
    artiste: string;
    type: string;
    marque: string;
    cachet: number;
    expire: number;
  }[];
  tournee: {
    dates: { min: number; max: number };
    coutMerch: number;
    prixMerch: number;
    tauxMerch: number;
  };
}

export interface VueLigneRapport {
  titre: string;
  artiste: string | null;
  causes: string[];
}

export interface VueRapportMensuel {
  semaine: number;
  net: number;
  revenus: number;
  depenses: number;
  tresorerie: number;
  variation: number;
  premierRevenu: string | null;
  reussites: VueLigneRapport[];
  echecs: VueLigneRapport[];
}

/** Unité d'affichage de la valeur courante d'une famille de succès. */
const UNITES_SUCCES: Record<
  AchievementFamily,
  'nombre' | 'argent' | 'rang' | 'semaines' | 'palier'
> = {
  signatures: 'nombre',
  sorties: 'nombre',
  concerts: 'nombre',
  certifications: 'nombre',
  prix: 'nombre',
  nominations: 'nombre',
  viral: 'nombre',
  festivals: 'nombre',
  debauchages: 'nombre',
  evenements: 'nombre',
  anciennete: 'semaines',
  tresorerie: 'argent',
  valorisation: 'argent',
  palier: 'palier',
  credibilite: 'nombre',
  classement: 'rang',
  equipe: 'nombre',
  studio: 'nombre',
  retours: 'nombre',
  enchere: 'nombre',
};

export interface VueSucces {
  id: string;
  titre: string;
  description: string;
  unite: string;
  seuil: number;
  obtenu: boolean;
  /** Valeur actuelle de la famille (pour la barre de progression). */
  valeur: number;
}

export interface VueRecord {
  clef: string;
  nom: string;
  valeur: number;
  semaine: number;
}

export interface VuePartie {
  mode: string;
  scenarioId: string | null;
  bacASable: boolean;
  /** Date du défi du jour (AAAA-MM-JJ), ou `null` hors du mode défi. */
  defiDate: string | null;
  faillitePossible: boolean;
  /** Fréquence des événements (1 = normal). */
  frequenceEvenements: number;
  difficulte: {
    capitalDepart: number;
    agressiviteRivaux: number;
    volatiliteMarche: number;
    bonusTresorerieRivaux: number;
  };
}

export interface VueScenario {
  id: string;
  titre: string;
  description: string;
  statut: 'en-cours' | 'reussi' | 'echec';
  /** Semaine limite et semaines restantes (0 une fois dépassée). */
  limite: number;
  semainesRestantes: number;
  objectifs: { texte: string; atteint: boolean }[];
  fin: number | null;
  score: number | null;
  raison: 'faillite' | 'temps' | 'regle' | null;
  /** Règles du scénario, avec leur état (vraies tant qu'elles sont respectées). */
  regles: { texte: string; respectee: boolean }[];
}

export interface VueDefi {
  date: string;
  semainesRestantes: number;
  termine: boolean;
  score: number;
  /** Texte à partager une fois le défi terminé. */
  partage: string;
}

export interface VueJeu {
  semaine: number;
  date: { annee: number; mois: number; semaineDuMois: number };
  label: { nom: string; palier: string; reputation: number };
  finances: {
    tresorerie: number;
    valorisation: number;
    /** Termes de la valorisation (clé, contribution en centimes), pour l’infobulle. */
    termesValorisation: { cle: string; contribution: number }[];
    semainesNegatives: number;
    faillite: boolean;
  };
  certification: string | null;
  roster: VueArtiste[];
  /** Nombre maximal d'artistes sous contrat au palier actuel (`null` en bac à sable). */
  plafondRoster: number | null;
  suivis: VueSuivi[];
  projets: {
    id: number;
    artisteId: number;
    type: string;
    statut: string;
    fin: number;
    qualite: number | null;
  }[];
  decisions: VueDecision[];
  fil: VueActu[];
  objectifs: {
    id: number;
    kind: string;
    cible: number;
    base: number;
    progression: number;
  }[];
  /** Trésorerie de fin de semaine sur les dernières semaines (centimes), de la plus ancienne à la plus récente. */
  historiqueTresorerie: number[];
  /** Sorties à venir du joueur et sorties annoncées des rivaux, triées par semaine. */
  calendrier: VueSortieCalendrier[];
  concurrence: VueConcurrence;
  financesDetail: VueFinancesDetail;
  personnel: VuePersonnel;
  batiments: VueBatiment[];
  scene: VueScene;
  partie: VuePartie;
  scenario: VueScenario | null;
  defi: VueDefi | null;
  rapportsMensuels: VueRapportMensuel[];
  tousSucces: VueSucces[];
  records: VueRecord[];
  /** Marché des genres, prévisions des études de marché et facteur de revenu par écoute. */
  marche: {
    genres: VueGenre[];
    previsions: VuePrevision[];
    facteurStreaming: number;
    coutEtude: number;
    horizons: number[];
    analyste: number;
  };
  /** Classements de la semaine (Top 50), certifications et historique des sorties du joueur. */
  classements: { singles: VueLigneClassement[]; albums: VueLigneClassement[] };
  certifications: VueCertification[];
  historiqueClassements: VueHistoriqueClassement[];
  /** Prochaines échéances : projets qui se terminent, contrats qui arrivent à terme. */
  echeances: VueEcheance[];
  /** Dernier rapport mensuel, s'il existe. */
  rapport: {
    semaine: number;
    net: number;
    variation: number;
    reussites: number;
    echecs: number;
  } | null;
  succes: number;
}

const FIL_VISIBLE = 100;
const HISTORIQUE = 26;
const NB_ECHEANCES = 6;

export function nomGenre(state: LabelState, id: string): string {
  const base = (fr.genres as Record<string, string | undefined>)[id];
  return base ?? state.sousGenres.find((s) => s.id === id)?.nom ?? id;
}

function contratDe(state: LabelState, artisteId: number): VueArtiste['contrat'] {
  const c = state.contrats.find((k) => k.artisteId === artisteId);
  return c ? { echeance: c.echeance, royaltiesBps: c.clauses.royaltiesArtisteBps } : null;
}

const nomDe = (state: LabelState, id: number): string =>
  state.artistes.find((a) => a.id === id)?.nomScene ?? 'Artiste';

function echeances(state: LabelState, tick: number): VueEcheance[] {
  const list: VueEcheance[] = [];
  for (const p of state.projets)
    if (p.statut === 'production')
      list.push({
        type: 'projet',
        artisteId: p.artisteId,
        nom: nomDe(state, p.artisteId),
        semaine: p.fin,
      });
  for (const c of state.contrats)
    list.push({
      type: 'contrat',
      artisteId: c.artisteId,
      nom: nomDe(state, c.artisteId),
      semaine: c.echeance,
    });
  return list
    .filter((e) => e.semaine >= tick)
    .sort((a, b) => a.semaine - b.semaine || a.artisteId - b.artisteId)
    .slice(0, NB_ECHEANCES);
}

function calendrier(state: LabelState, tick: number): VueSortieCalendrier[] {
  const out: VueSortieCalendrier[] = [];
  for (const p of state.projets) {
    if (p.statut === 'sortie') continue;
    const a = state.artistes.find((x) => x.id === p.artisteId);
    out.push({
      origine: 'joueur',
      nom: a?.nomScene ?? 'Artiste',
      genre: a?.genre ?? '',
      genreNom: a ? nomGenre(state, a.genre) : '',
      semaine: Math.max(tick, p.fin),
      poids: 0,
      statut: p.statut,
    });
  }
  for (const s of announcedReleases(state, tick)) {
    const rival = state.rivaux.find((r) => r.id === s.rivalId);
    out.push({
      origine: 'rival',
      nom: rival?.nom ?? 'Un rival',
      genre: s.genre,
      genreNom: nomGenre(state, s.genre),
      semaine: s.semaine,
      poids: s.poids,
      statut: 'annoncee',
    });
  }
  return out.sort(
    (a, b) =>
      a.semaine - b.semaine || a.origine.localeCompare(b.origine) || a.nom.localeCompare(b.nom),
  );
}

const MOTS_A = [
  'Nuit',
  'Feu',
  'Mirage',
  'Cristal',
  'Béton',
  'Soleil',
  'Néon',
  'Velours',
  'Orage',
  'Fièvre',
  'Horizon',
  'Écho',
];
const MOTS_B = [
  'blanche',
  'sauvage',
  'électrique',
  'dorée',
  'lente',
  'urbaine',
  'infinie',
  'cassée',
  'tropicale',
  'secrète',
  'brûlante',
  'douce',
];

/** Titre fictif et stable d'une entrée du bruit de marché. */
export function titreDeBruit(chart: string, rang: number, tick: number): string {
  const h = (chart.length * 31 + rang * 17 + tick * 7) >>> 0;
  return `${MOTS_A[h % MOTS_A.length] ?? 'Nuit'} ${MOTS_B[(h >>> 3) % MOTS_B.length] ?? 'douce'}`;
}

function ligneClassement(
  state: LabelState,
  chart: 'singles' | 'albums',
  tick: number,
): VueLigneClassement[] {
  return state.classements[chart].map((e, i) => {
    const p = e.projetId === null ? undefined : state.projets.find((x) => x.id === e.projetId);
    const artiste = p && state.artistes.find((a) => a.id === p.artisteId);
    return {
      rang: i + 1,
      nom: artiste
        ? `${artiste.nomScene} — ${fr.typesDeSortie[p.type as keyof typeof fr.typesDeSortie] ?? p.type}`
        : titreDeBruit(chart, i, tick),
      streams: e.streams,
      joueur: e.projetId !== null,
    };
  });
}

function certificationsDe(state: LabelState): VueCertification[] {
  const niveaux = ['or', 'platine', 'diamant'] as const;
  return state.projets
    .filter((p) => p.statut === 'sortie')
    .map((p) => {
      const ventes = equivalentSales(p.streams);
      const suivant = niveaux.find((n) => ventes < certificationThreshold(n, p.type));
      return {
        projetId: p.id,
        nom: `${nomDe(state, p.artisteId)} — ${fr.typesDeSortie[p.type as keyof typeof fr.typesDeSortie] ?? p.type}`,
        niveau: p.certification,
        ventes,
        prochain: suivant
          ? { niveau: suivant, seuil: certificationThreshold(suivant, p.type) }
          : null,
      };
    });
}

function historiqueDe(state: LabelState): VueHistoriqueClassement[] {
  return Object.entries(state.classements.historique).map(([id, h]) => {
    const p = state.projets.find((x) => x.id === Number(id));
    return {
      projetId: Number(id),
      nom: p
        ? `${nomDe(state, p.artisteId)} — ${fr.typesDeSortie[p.type as keyof typeof fr.typesDeSortie] ?? p.type}`
        : `Sortie ${id}`,
      classement: h.chart,
      meilleure: h.meilleure,
      semaines: h.semaines,
      position: h.position,
    };
  });
}

function marcheDe(state: LabelState): VueJeu['marche'] {
  const genres = genreKeys(state.marche).map<VueGenre>((id) => {
    const g = state.marche.genres[id];
    const sub = state.sousGenres.find((s) => s.id === id);
    return {
      id,
      nom: nomGenre(state, id),
      popularite: Math.round(g?.popularite ?? 0),
      tendance: Math.round(trendMultiplier(g?.popularite ?? 50) * 100) / 100,
      audience: g?.audience ?? 0,
      credibilite: Math.round(state.label.credibilite[id] ?? 0),
      sousGenre: sub ? { naissance: sub.naissance, duree: sub.duree, premier: sub.premier } : null,
    };
  });
  return {
    genres,
    previsions: state.previsions.map((p) => ({ ...p, nom: nomGenre(state, p.genre) })),
    facteurStreaming: Math.round(state.marche.facteurStreaming * 100) / 100,
    coutEtude: INTEL.studyCost,
    horizons: [...INTEL.horizons],
    analyste: analystLevel(state),
  };
}

const AFFRONTEMENTS = [
  'debauchage',
  'clash',
  'contrat-vendu',
  'offre-rachat',
  'signature-rivale',
  'rival-disparu',
  'rival-nouveau',
  'rival-evolue',
];

function concurrenceDe(state: LabelState): VueConcurrence {
  const rivaux = state.rivaux.map<VueRival>((r) => {
    const roster = state.artistes.filter((a) => a.employeur === `rival:${r.id}`);
    return {
      id: r.id,
      nom: r.nom,
      personnalite: PERSONALITIES[r.personnalite].nom,
      genreFetiche: nomGenre(state, r.genreFetiche),
      reputation: Math.round(r.reputation),
      tresorerie: r.tresorerie,
      valorisation: r.tresorerie + roster.reduce((sum, a) => sum + fairAdvance(a) * 3, 0),
      roster: roster.map((a) => ({
        id: a.id,
        nom: a.nomScene,
        genreNom: nomGenre(state, a.genre),
        notoriete: Math.round(notoriety(a.fanbase)),
        prixRachat: buyoutAsk(state, a.id),
      })),
    };
  });
  const parts = genreKeys(state.marche).map((id) => {
    const dans = state.artistes.filter((a) => a.genre === id);
    return {
      genre: id,
      nom: nomGenre(state, id),
      joueur: dans.filter((a) => a.employeur === 'joueur').length,
      rivaux: dans.filter((a) => a.employeur.startsWith('rival:')).length,
      libres: dans.filter((a) => a.employeur === 'libre').length,
    };
  });
  return {
    rivaux,
    parts,
    offres: state.offresRachat.map((o) => ({
      id: o.id,
      rival: state.rivaux.find((r) => r.id === o.rivalId)?.nom ?? 'Un rival',
      artisteId: o.artisteId,
      artiste: nomDe(state, o.artisteId),
      prix: o.prix,
      expire: o.expire,
    })),
    affrontements: state.fil
      .filter((a) => AFFRONTEMENTS.includes(a.kind))
      .slice(-15)
      .reverse()
      .map((a) => ({
        id: a.id,
        semaine: a.semaine,
        titre: a.titre,
        texte: a.texte,
        importance: a.importance,
        kind: a.kind,
      })),
  };
}

function lignes(noms: Record<string, string>, valeurs: Record<string, number>): VueLigneFinance[] {
  return Object.keys(noms)
    .map((cle) => ({ cle, nom: noms[cle] ?? cle, montant: valeurs[cle] ?? 0 }))
    .filter((l) => l.montant > 0)
    .sort((a, b) => b.montant - a.montant || a.cle.localeCompare(b.cle));
}

function financesDe(state: LabelState): VueFinancesDetail {
  const f = state.finances;
  const dernier = f.mois[f.mois.length - 1];
  const source = dernier ?? {
    revenus: f.semaine.revenus,
    depenses: f.semaine.depenses,
  };
  return {
    mois: f.mois.slice(-12).map((m) => ({
      debut: m.debut,
      fin: m.fin,
      revenus: m.totalRevenus,
      depenses: m.totalDepenses,
      net: m.net,
    })),
    revenus: lignes(fr.categoriesRevenus, source.revenus),
    depenses: lignes(fr.categoriesDepenses, source.depenses),
    periode: dernier ? 'mois' : 'semaine',
    prets: state.prets.map((p) => ({
      id: p.id,
      capital: p.capital,
      restant: p.restant,
      tauxBps: p.tauxBps,
      semainesRestantes: p.semainesRestantes,
    })),
    emprunt: {
      debloque: tierAtLeast(state, UNLOCKS.emprunter),
      encours: outstanding(state),
      plafond: loanCap(state),
      tauxBps: loanRate(state.label.reputation, state.credit.impayes),
      minimum: LOANS.minAmount,
      semaines: { min: LOANS.weeks.min, max: LOANS.weeks.max },
    },
    offresInvestisseurs: state.offresInvest.map((o) => ({ ...o })),
    investisseurs: state.investisseurs.map((i) => ({ ...i })),
    investisseursDebloques: tierAtLeast(state, UNLOCKS.investisseurs),
    fiscalite: {
      strategie: state.fiscalite.strategie,
      dernierImpot: state.fiscalite.dernierImpot,
      controles: state.fiscalite.controles,
      options: (Object.keys(TAX.strategies) as TaxStrategy[]).map((id) => ({
        id,
        tauxBps: TAX.strategies[id].rateBps,
        risque: TAX.strategies[id].auditChance,
      })),
    },
  };
}

function personnelDe(state: LabelState): VuePersonnel {
  const roles = fr.rolesPersonnel as Record<string, string>;
  const traits = fr.traitsPersonnel as Record<string, string>;
  const cadre = state.delegation.reperage;
  return {
    equipe: state.personnel.map((m) => ({
      id: m.id,
      nom: m.nom,
      role: roles[m.role] ?? m.role,
      niveau: m.niveau,
      specialite: m.specialite ? nomGenre(state, m.specialite) : null,
      salaire: m.salaire,
      moral: Math.round(m.moral),
      trait: traits[m.trait] ?? m.trait,
      experience: Math.round(m.experience),
    })),
    candidats: state.candidats.map((c) => ({
      id: c.id,
      nom: c.nom,
      role: roles[c.role] ?? c.role,
      niveau: c.niveau,
      specialite: c.specialite ? nomGenre(state, c.specialite) : null,
      salaire: c.salaire,
      trait: traits[c.trait] ?? c.trait,
    })),
    capacite: teamCapacity(state),
    masseSalariale: state.personnel.reduce((somme, m) => somme + m.salaire, 0),
    experiencePourNiveau: STAFF.expPerLevel,
    delegation: {
      actif: cadre?.actif ?? false,
      budgetMax: cadre?.budgetMax ?? 0,
      seuilAlerte: cadre?.seuilAlerte ?? 0,
      genres: [...(cadre?.genres ?? [])],
      denicheurs: state.denicheurs.length,
      rapports: state.rapports
        .slice(-10)
        .reverse()
        .map((r) => ({
          semaine: r.semaine,
          decision: r.decision,
          cout: r.cout,
          retenus: r.retenus,
          ecartes: r.ecartes,
        })),
    },
    genres: genreKeys(state.marche).map((id) => ({ id, nom: nomGenre(state, id) })),
  };
}

function batimentsDe(state: LabelState): VueBatiment[] {
  return BUILDING_IDS.map((id) => {
    const regle = BUILDINGS[id];
    const niveau = buildingLevel(state, id);
    const travaux = state.batiments.travaux.find((t) => t.batiment === id);
    return {
      id,
      nom: fr.batiments[id].nom,
      effet: fr.batiments[id].effet,
      niveau,
      niveauMax: regle.maxLevel,
      coutSuivant: niveau >= regle.maxLevel ? null : (regle.cost[niveau] ?? 0),
      semainesTravaux: regle.weeks,
      entretien: Math.max(0, niveau - regle.start) * regle.upkeep,
      palierRequis: fr.tiers[regle.tier],
      palierAtteint: tierAtLeast(state, regle.tier),
      travaux: travaux ? { niveau: travaux.niveau, fin: travaux.fin } : null,
    };
  });
}

function sceneDe(state: LabelState): VueScene {
  const nomArtiste = (id: number): string => state.artistes.find((a) => a.id === id)?.nom ?? '—';
  const siens = state.artistes.filter((a) => a.employeur === 'joueur');
  const maison = buildingLevel(state, 'concert');
  return {
    salles: VENUE_IDS.map((id) => ({
      id,
      nom: fr.salles[id],
      capacite: VENUES[id].capacite,
      cout: venueCost(state, id),
      prixRef: VENUES[id].prixRef,
      notorieteRef: VENUES[id].notorieteRef,
    })),
    artistes: siens.map((a) => ({
      id: a.id,
      nom: a.nom,
      fans: a.fanbase,
      hype: Math.round(a.hype),
      fatigue: Math.round(a.fatigue),
      repos: a.repos,
    })),
    niveauSalleMaison: maison,
    concerts: state.concerts
      .filter((c) => !c.resolu)
      .concat(state.concerts.filter((c) => c.resolu).slice(-8))
      .map((c) => ({
        id: c.id,
        artiste: nomArtiste(c.artisteId),
        salle: fr.salles[c.salle],
        prix: c.prix,
        date: c.date,
        resolu: c.resolu,
        spectateurs: c.spectateurs,
        recette: c.recette,
        tournee: c.tourneeId !== null,
      })),
    tournees: state.tournees.slice(-6).map((t) => ({
      id: t.id,
      artiste: nomArtiste(t.artisteId),
      dates: t.concertIds.length,
      tenues: t.concertIds.filter((id) => state.concerts.find((c) => c.id === id)?.resolu).length,
      merchStock: t.merchStock,
      merchVendu: t.merchVendu,
      annulee: t.annulee,
    })),
    festivals: state.festivals
      .filter((f) => !f.tenu)
      .map((f) => ({
        id: f.id,
        nom: f.nom,
        semaine: f.semaine,
        notorieteMin: f.notorieteMin,
        cachet: f.cachet,
        artiste: f.artisteId === null ? null : nomArtiste(f.artisteId),
        tete: f.tete,
        eligibles: siens.flatMap((a) => {
          const o = festivalOffer(f, a.fanbase);
          return o ? [{ artisteId: a.id, tete: o.tete, cachet: o.cachet }] : [];
        }),
      })),
    offresSynchro: state.offresSynchro.map((o) => ({
      id: o.id,
      artiste: nomArtiste(state.projets.find((p) => p.id === o.projetId)?.artisteId ?? -1),
      type: fr.synchros[o.type],
      marque: o.marque,
      cachet: o.cachet,
      expire: o.expire,
    })),
    tournee: {
      dates: { ...TOUR.dates },
      coutMerch: TOUR.merchCost,
      prixMerch: TOUR.merchPrice,
      tauxMerch: TOUR.merchRate,
    },
  };
}

function rapportsDe(state: LabelState): VueRapportMensuel[] {
  const ligne = (l: { code: string; artisteId: number | null; causes: string[] }) => ({
    titre: fr.evenementsRapport[l.code] ?? l.code,
    artiste: state.artistes.find((a) => a.id === l.artisteId)?.nom ?? null,
    causes: l.causes.map((c) => fr.causesRapport[c] ?? c),
  });
  return state.rapportsMensuels
    .slice(-12)
    .reverse()
    .map((r) => ({
      semaine: r.semaine,
      net: r.net,
      revenus: r.revenus,
      depenses: r.depenses,
      tresorerie: r.tresorerie,
      variation: r.variation,
      premierRevenu: r.premierRevenu
        ? ((fr.categoriesRevenus as Record<string, string>)[r.premierRevenu] ?? r.premierRevenu)
        : null,
      reussites: r.reussites.map(ligne),
      echecs: r.echecs.map(ligne),
    }));
}

function defiDe(state: LabelState, tick: number): VueDefi | null {
  const r = resultatDefi(state, tick);
  if (!r) return null;
  return {
    date: r.date,
    semainesRestantes: Math.max(0, DEFI_SEMAINES - tick),
    termine: defiTermine(state, tick),
    score: r.score,
    partage: texteResultat(r),
  };
}

function scenarioDe(state: LabelState, tick: number): VueScenario | null {
  const s = state.scenario;
  const def = s ? findScenario(s.id) : undefined;
  if (!s || !def) return null;
  return {
    id: s.id,
    titre: def.titre,
    description: def.description,
    statut: s.statut,
    limite: s.limite,
    semainesRestantes: Math.max(0, s.limite - tick),
    objectifs: def.objectifs.map((c) => ({
      texte: texteCondition(c),
      atteint: conditionMet(state, Math.max(0, tick - 1), c, s.limite),
    })),
    fin: s.fin,
    score: s.score,
    raison: s.raison,
    regles: (def.regles ?? []).map((c) => ({
      texte: texteCondition(c),
      respectee: conditionMet(state, Math.max(0, tick - 1), c, s.limite),
    })),
  };
}

function lastReport(state: LabelState): VueJeu['rapport'] {
  const r = state.rapportsMensuels[state.rapportsMensuels.length - 1];
  return r
    ? {
        semaine: r.semaine,
        net: r.net,
        variation: r.variation,
        reussites: r.reussites.length,
        echecs: r.echecs.length,
      }
    : null;
}

/** Instantané de la partie à la semaine `tick`. */
/** Aides fournies par le moteur d'événements (disponibilité des choix, choix par défaut). */
export interface ViewHooks {
  available(instanceId: number): readonly string[];
  defaultChoice(eventId: string): string;
}

export function buildView(state: LabelState, tick: number, hooks?: ViewHooks): VueJeu {
  const date = calendarOf(tick);
  const roster = state.artistes
    .filter((a) => a.employeur === 'joueur')
    .map<VueArtiste>((a) => ({
      id: a.id,
      nom: a.nomScene,
      genre: a.genre,
      genreNom: nomGenre(state, a.genre),
      phaseNom: fr.phasesDeCarriere[a.phase],
      ville: a.ville,
      traits: a.traits.map((t) => (fr.traits as Record<string, string | undefined>)[t] ?? t),
      age: a.age,
      phase: a.phase,
      employeur: a.employeur,
      notoriete: Math.round(notoriety(a.fanbase)),
      fans: a.fanbase,
      hype: Math.round(a.hype),
      moral: Math.round(a.moral),
      fatigue: Math.round(a.fatigue),
      competences: {
        plume: a.plume,
        flow: a.flow,
        voix: a.voix,
        charisme: a.charisme,
        scene: a.scene,
      },
      contrat: contratDe(state, a.id),
      enProduction: state.projets.some((p) => p.artisteId === a.id && p.statut === 'production'),
    }));
  const suivis = state.suivis.flatMap<VueSuivi>((p) => {
    const a = state.artistes.find((x) => x.id === p.artisteId);
    if (!a) return [];
    const fourchettes: Record<string, readonly [number, number]> = {};
    for (const attr of VISIBLE_ATTRIBUTES) {
      const r = knownRange(p, a, attr);
      if (r) fourchettes[attr] = r;
    }
    const n = state.negociations.find((x) => x.artisteId === a.id);
    return [
      {
        id: a.id,
        nom: a.nomScene,
        genre: a.genre,
        source: p.source,
        avanceIndicative: Math.round(fairAdvance(a) / 50_000) * 50_000,
        negociation: n
          ? { contres: n.contres, reaction: n.reaction, contre: n.contre, rompue: n.rompue }
          : null,
        observations: p.observations,
        essai: p.essai,
        fourchettes,
      },
    ];
  });
  const decisions = state.events.pending.flatMap<VueDecision>((pending) => {
    const text = describeEvent(pending.eventId, pending.vars);
    if (!text) return [];
    return [
      {
        instanceId: pending.instanceId,
        eventId: pending.eventId,
        titre: text.titre,
        texte: text.texte,
        echeance: pending.deadlineTick,
        choix: Object.entries(text.choix).map(([id, libelle]) => ({
          id,
          libelle,
          disponible: hooks ? hooks.available(pending.instanceId).includes(id) : true,
        })),
        parDefaut: hooks?.defaultChoice(pending.eventId) ?? '',
      },
    ];
  });
  return {
    semaine: tick,
    date: { annee: date.year + 1, mois: date.month, semaineDuMois: date.weekOfMonth },
    label: {
      nom: state.label.nom,
      palier: fr.tiers[state.label.tier],
      reputation: Math.round(state.label.reputation),
    },
    finances: {
      tresorerie: state.label.tresorerie,
      valorisation: labelScore(state, tick),
      termesValorisation: valuation(state, tick).terms.map((t) => ({
        cle: t.key,
        contribution: t.contribution,
      })),
      semainesNegatives: state.faillite.semaines,
      faillite: state.faillite.terminee,
    },
    certification: bestCertification(state),
    roster,
    plafondRoster: state.config.sandbox ? null : rosterCap(state),
    suivis,
    projets: state.projets.map((p) => ({
      id: p.id,
      artisteId: p.artisteId,
      type: p.type,
      statut: p.statut,
      fin: p.fin,
      qualite: p.statut === 'production' ? null : p.qualite,
    })),
    decisions,
    fil: state.fil
      .slice(-FIL_VISIBLE)
      .reverse()
      .map((a) => ({
        id: a.id,
        semaine: a.semaine,
        titre: a.titre,
        texte: a.texte,
        importance: a.importance,
        kind: a.kind,
      })),
    objectifs: state.objectifs.map((o) => ({
      id: o.id,
      kind: o.kind,
      cible: o.cible,
      base: o.base,
      progression: objectiveProgress(state, o),
    })),
    calendrier: calendrier(state, tick),
    concurrence: concurrenceDe(state),
    financesDetail: financesDe(state),
    personnel: personnelDe(state),
    batiments: batimentsDe(state),
    scene: sceneDe(state),
    partie: {
      mode: state.config.mode,
      scenarioId: state.config.scenarioId ?? null,
      bacASable: state.config.sandbox === true,
      defiDate: state.config.defiDate ?? null,
      faillitePossible: !state.config.sandbox && !state.config.bankruptcyOff,
      frequenceEvenements: state.config.eventRate ?? 1,
      difficulte: {
        capitalDepart: state.config.difficulty.startingCash,
        agressiviteRivaux: state.config.difficulty.rivalAggression,
        volatiliteMarche: state.config.difficulty.marketVolatility,
        bonusTresorerieRivaux: state.config.difficulty.rivalCashBonus,
      },
    },
    scenario: scenarioDe(state, tick),
    defi: defiDe(state, tick),
    rapportsMensuels: rapportsDe(state),
    tousSucces: SUCCES.map((s) => ({
      id: s.id,
      titre: SUCCES_TEXTES[s.famille].titre(s.seuil),
      description: SUCCES_TEXTES[s.famille].description(s.seuil),
      unite: UNITES_SUCCES[s.famille],
      seuil: s.seuil,
      obtenu: state.succes.includes(s.id),
      valeur: Number.isFinite(familyValue(state, s.famille, tick))
        ? Math.round(familyValue(state, s.famille, tick))
        : 0,
    })),
    records: state.records.map((r) => ({
      clef: r.clef,
      nom: (RECORD_TEXTES as Record<string, string>)[r.clef] ?? r.clef,
      valeur: r.valeur,
      semaine: r.semaine,
    })),
    marche: marcheDe(state),
    classements: {
      singles: ligneClassement(state, 'singles', tick),
      albums: ligneClassement(state, 'albums', tick),
    },
    certifications: certificationsDe(state),
    historiqueClassements: historiqueDe(state),
    historiqueTresorerie: state.finances.semaines.slice(-HISTORIQUE).map((r) => r.tresorerieFin),
    echeances: echeances(state, tick),
    rapport: lastReport(state),
    succes: state.succes.length,
  };
}
