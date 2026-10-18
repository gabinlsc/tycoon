import { z } from 'zod';
import type { SauvegardeLabel } from './stockage';

/** Identifiant et version du format de fichier d'export. */
export const FORMAT_FICHIER = 'tycoon-label';
export const VERSION_FICHIER = 1;

const entier = z.number().int();

/**
 * Forme minimale d'une partie du moteur. On vérifie l'essentiel (ce qui ferait planter le jeu
 * au chargement) sans figer chaque champ : le moteur reste libre d'ajouter des données.
 */
const partieSchema = z.looseObject({
  engine: z.looseObject({
    tick: entier.min(0),
    seed: z.union([z.string(), z.number()]),
    streams: z.looseObject({}),
    data: z.looseObject({
      config: z.looseObject({}),
      label: z.looseObject({
        nom: z.string().min(1),
        tier: z.string(),
        tresorerie: z.number(),
        reputation: z.number(),
      }),
      nextId: entier,
      artistes: z.array(z.looseObject({ id: entier })),
      contrats: z.array(z.looseObject({})),
      rivaux: z.array(z.looseObject({})),
      projets: z.array(z.looseObject({})),
      finances: z.looseObject({}),
      marche: z.looseObject({}),
    }),
  }),
  journal: z.array(
    z.looseObject({ tick: entier.min(0), action: z.looseObject({ type: z.string() }) }),
  ),
});

const fichierSchema = z.object({
  format: z.literal(FORMAT_FICHIER),
  version: z.number().int(),
  exporteLe: z.string(),
  resume: z.object({
    label: z.string(),
    semaine: entier.min(0),
    palier: z.string(),
    tresorerie: z.number(),
  }),
  partie: z.unknown(),
});

export type ResultatLecture =
  { ok: true; sauvegarde: SauvegardeLabel } | { ok: false; erreur: string };

const decrire = (erreur: z.ZodError): string => {
  const premier = erreur.issues[0];
  const chemin = premier?.path.join('.') ?? '';
  return chemin ? `donnée invalide (${chemin})` : 'donnée invalide';
};

/** Vérifie qu'une partie sérialisée par le moteur est exploitable ; ne lève jamais. */
export function validerPartie(texte: string): { ok: true } | { ok: false; erreur: string } {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { ok: false, erreur: 'le contenu n’est pas du JSON valide' };
  }
  const r = partieSchema.safeParse(brut);
  return r.success ? { ok: true } : { ok: false, erreur: decrire(r.error) };
}

/** Contenu d'un fichier d'export pour une sauvegarde. */
export function exporterFichier(s: SauvegardeLabel, maintenant = new Date()): string {
  return JSON.stringify({
    format: FORMAT_FICHIER,
    version: VERSION_FICHIER,
    exporteLe: maintenant.toISOString(),
    resume: { label: s.label, semaine: s.semaine, palier: s.palier, tresorerie: s.tresorerie },
    partie: JSON.parse(s.sauvegarde) as unknown,
  });
}

/** Lit un fichier d'export. Un fichier abîmé ou étranger donne une erreur lisible, jamais une exception. */
export function importerFichier(texte: string): ResultatLecture {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { ok: false, erreur: 'ce fichier n’est pas du JSON valide' };
  }
  const entete = fichierSchema.safeParse(brut);
  if (!entete.success)
    return { ok: false, erreur: 'ce fichier n’est pas une sauvegarde Label Tycoon' };
  const f = entete.data;
  if (f.version > VERSION_FICHIER)
    return { ok: false, erreur: 'cette sauvegarde vient d’une version plus récente du jeu' };
  const partie = JSON.stringify(f.partie);
  const verdict = validerPartie(partie);
  if (!verdict.ok) return { ok: false, erreur: `la partie est abîmée : ${verdict.erreur}` };
  return {
    ok: true,
    sauvegarde: {
      version: 1,
      sauvegarde: partie,
      semaine: f.resume.semaine,
      label: f.resume.label,
      palier: f.resume.palier,
      tresorerie: f.resume.tresorerie,
      enregistreLe: new Date().toISOString(),
    },
  };
}

/** Nom de fichier proposé au téléchargement. */
export const nomFichier = (s: SauvegardeLabel): string =>
  `label-tycoon-${
    s.label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'partie'
  }-semaine-${s.semaine}.json`;
