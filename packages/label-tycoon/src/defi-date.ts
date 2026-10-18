const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FORMAT_SEMAINE = /^(\d{4})-S(\d{2})$/;

/** Date du défi pour un instant donné : le jour UTC, identique pour tous les joueurs du monde. */
export const dateDuDefi = (maintenant: Date): string => maintenant.toISOString().slice(0, 10);

export const dateValide = (date: string): boolean =>
  FORMAT_DATE.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));

const MS_PAR_JOUR = 86_400_000;

/** Nombre de jours depuis le 1er janvier 1970 pour une date du calendrier grégorien (mois 1 à 12). */
function joursDepuisEpoque(annee: number, mois: number, jour: number): number {
  const a = mois <= 2 ? annee - 1 : annee;
  const era = Math.floor(a / 400);
  const anneeDeLEre = a - era * 400;
  const jourDeLAnnee = Math.floor((153 * (mois + (mois > 2 ? -3 : 9)) + 2) / 5) + jour - 1;
  const jourDeLEre =
    anneeDeLEre * 365 + Math.floor(anneeDeLEre / 4) - Math.floor(anneeDeLEre / 100) + jourDeLAnnee;
  return era * 146_097 + jourDeLEre - 719_468;
}

/** Année civile d'un nombre de jours depuis 1970. */
function anneeDesJours(jours: number): number {
  const z = jours + 719_468;
  const era = Math.floor(z / 146_097);
  const jourDeLEre = z - era * 146_097;
  const anneeDeLEre = Math.floor(
    (jourDeLEre -
      Math.floor(jourDeLEre / 1460) +
      Math.floor(jourDeLEre / 36_524) -
      Math.floor(jourDeLEre / 146_096)) /
      365,
  );
  const jourDeLAnnee =
    jourDeLEre - (365 * anneeDeLEre + Math.floor(anneeDeLEre / 4) - Math.floor(anneeDeLEre / 100));
  const moisDecale = Math.floor((5 * jourDeLAnnee + 2) / 153);
  return anneeDeLEre + era * 400 + (moisDecale >= 10 ? 1 : 0);
}

/** Jour de la semaine ISO (1 = lundi … 7 = dimanche) d'un nombre de jours depuis 1970 (un jeudi). */
const jourIso = (jours: number): number => ((((jours + 3) % 7) + 7) % 7) + 1;

/** Semaine ISO (lundi au dimanche, UTC) d'un instant, au format `AAAA-Snn`. */
export function semaineDuDefi(maintenant: Date): string {
  const jours = Math.floor(maintenant.getTime() / MS_PAR_JOUR);
  // Le jeudi de la semaine donne l'année ISO.
  const jeudi = jours + 4 - jourIso(jours);
  const annee = anneeDesJours(jeudi);
  const semaine = Math.floor((jeudi - joursDepuisEpoque(annee, 1, 1)) / 7) + 1;
  return `${annee}-S${String(semaine).padStart(2, '0')}`;
}

/** Vrai pour un identifiant de semaine qui existe vraiment (la semaine 53 n'existe que certaines années). */
export function semaineValide(id: string): boolean {
  const m = FORMAT_SEMAINE.exec(id);
  if (!m) return false;
  const annee = Number(m[1]);
  const semaine = Number(m[2]);
  if (semaine < 1 || semaine > 53) return false;
  // Le jeudi de cette semaine, reconstruit depuis le 4 janvier (toujours en semaine 1).
  const quatreJanvier = joursDepuisEpoque(annee, 1, 4);
  const jeudi = quatreJanvier - (jourIso(quatreJanvier) - 1) + (semaine - 1) * 7 + 3;
  return anneeDesJours(jeudi) === annee;
}

/** Identifiant d'un défi : un jour (`AAAA-MM-JJ`) ou une semaine (`AAAA-Snn`). */
export const estDefiHebdo = (id: string): boolean => FORMAT_SEMAINE.test(id);
export const identifiantDefiValide = (id: string): boolean => dateValide(id) || semaineValide(id);

/** Graine d'un défi : tous les joueurs reçoivent le même monde. */
export const graineDuDefi = (id: string): string => `defi-${id}`;
