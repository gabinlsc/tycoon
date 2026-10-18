const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Date du défi pour un instant donné : le jour UTC, identique pour tous les joueurs du monde. */
export const dateDuDefi = (maintenant: Date): string => maintenant.toISOString().slice(0, 10);

export const dateValide = (date: string): boolean =>
  FORMAT_DATE.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));

/** Graine du jour : tous les joueurs reçoivent le même monde. */
export const graineDuDefi = (date: string): string => `defi-${date}`;
