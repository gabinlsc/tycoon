import { type Rng, cents } from '@tycoon/core';
import { generateArtist, takenStageNames } from '../artists';
import type { TalentLevel } from '../balance/artists';
import { type Clauses, concludeSigning } from '../contracts';
import { type LabelState, newId } from '../state';

const CLAUSES_DEPART: Clauses = {
  avance: cents(0),
  royaltiesArtisteBps: 2500,
  dureeAnnees: 3,
  exclusivite: true,
  part360Bps: 0,
  clauseRachat: cents(0),
};

/**
 * Aide pour les conditions initiales : crée un artiste et le signe pour le joueur, sans avance. Tout
 * le hasard vient du `Rng` fourni, donc la même graine donne le même artiste.
 */
export function signerArtisteDeDepart(
  state: LabelState,
  rng: Rng,
  options: { level: TalentLevel; genre?: string; dureeAnnees?: number },
): number {
  const artist = generateArtist(
    rng,
    {
      id: newId(state),
      market: state.marche,
      cities: state.villes,
      takenNames: takenStageNames(state.artistes),
    },
    options.genre ? { level: options.level, genre: options.genre } : { level: options.level },
  );
  state.artistes.push(artist);
  concludeSigning(
    state,
    artist.id,
    { ...CLAUSES_DEPART, dureeAnnees: options.dureeAnnees ?? CLAUSES_DEPART.dureeAnnees },
    0,
    () => undefined,
  );
  return artist.id;
}
