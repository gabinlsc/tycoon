/** Vitesses du temps : 0 = pause, sinon semaines par seconde. */
export const VITESSES = [0, 1, 2, 4] as const;
export type Vitesse = (typeof VITESSES)[number];

/** Délai entre deux semaines simulées, en millisecondes, pour chaque vitesse. */
export const DELAI_MS: Readonly<Record<Exclude<Vitesse, 0>, number>> = { 1: 1000, 2: 500, 4: 250 };

/** Types d'événements qui peuvent déclencher une auto-pause, réglables un par un. */
export const CATEGORIES_PAUSE = [
  'decision',
  'offre-rival',
  'fin-contrat',
  'crise-financiere',
  'sortie-importante',
  'nomination',
  'burnout',
  'palier',
] as const;
export type CategoriePause = (typeof CATEGORIES_PAUSE)[number];

export type ReglagesPause = Readonly<Record<CategoriePause, boolean>>;

export const REGLAGES_PAR_DEFAUT: ReglagesPause = {
  decision: true,
  'offre-rival': true,
  'fin-contrat': true,
  'crise-financiere': true,
  'sortie-importante': true,
  nomination: true,
  burnout: true,
  palier: true,
};

export const LIBELLES_PAUSE: Readonly<Record<CategoriePause, string>> = {
  decision: 'Décision à prendre',
  'offre-rival': 'Offre d’un rival',
  'fin-contrat': 'Fin de contrat',
  'crise-financiere': 'Crise financière',
  'sortie-importante': 'Sortie importante',
  nomination: 'Nomination',
  burnout: 'Artiste en danger',
  palier: 'Nouveau palier',
};

const CATEGORIE_DE_SIGNAL: Readonly<Record<string, CategoriePause>> = {
  'decision-requise': 'decision',
  'offre-rachat': 'offre-rival',
  debauchage: 'offre-rival',
  'offre-investisseur': 'offre-rival',
  'fin-de-contrat': 'fin-contrat',
  'alerte-faillite': 'crise-financiere',
  faillite: 'crise-financiere',
  'tresorerie-negative': 'crise-financiere',
  'pret-impaye': 'crise-financiere',
  'projet-termine': 'sortie-importante',
  certification: 'sortie-importante',
  'entree-classement': 'sortie-importante',
  nomination: 'nomination',
  'prix-remporte': 'nomination',
  burnout: 'burnout',
  palier: 'palier',
};

export interface SignalSimple {
  kind: string;
  interrupt: boolean;
}

/**
 * Catégorie d'auto-pause qui s'applique, ou `null`. Un signal d'interruption inconnu met toujours
 * en pause : mieux vaut s'arrêter qu'ignorer une alerte.
 */
export function pauseDeclenchee(
  signaux: readonly SignalSimple[],
  reglages: ReglagesPause,
): CategoriePause | 'autre' | null {
  for (const s of signaux) {
    if (!s.interrupt) continue;
    const categorie = CATEGORIE_DE_SIGNAL[s.kind];
    if (!categorie) return 'autre';
    if (reglages[categorie]) return categorie;
  }
  return null;
}

export const CLE_REGLAGES = 'tycoon:label:auto-pauses';

/** Relit les réglages mémorisés (valeurs inconnues ignorées, défauts pour le reste). */
export function lireReglages(raw: string | null): ReglagesPause {
  if (!raw) return REGLAGES_PAR_DEFAUT;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out = { ...REGLAGES_PAR_DEFAUT } as Record<CategoriePause, boolean>;
    for (const c of CATEGORIES_PAUSE) if (typeof parsed[c] === 'boolean') out[c] = parsed[c];
    return out;
  } catch {
    return REGLAGES_PAR_DEFAUT;
  }
}
