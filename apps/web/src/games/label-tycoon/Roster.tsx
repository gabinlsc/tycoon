import { useMemo, useState } from 'react';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';
import { type CleTri, type Filtres, SANS_FILTRE, alertesArtiste, filtrer, trier } from './roster';

const COLONNES: { cle: CleTri; titre: string; terme?: string }[] = [
  { cle: 'nom', titre: 'Artiste' },
  { cle: 'notoriete', titre: 'Notoriété', terme: 'notoriete' },
  { cle: 'hype', titre: 'Hype', terme: 'hype' },
  { cle: 'moral', titre: 'Moral', terme: 'moral' },
  { cle: 'fatigue', titre: 'Fatigue', terme: 'fatigue' },
  { cle: 'echeance', titre: 'Contrat' },
];

/** Effectif du roster face au plafond de son palier (aucun plafond en bac à sable). */
export const texteEffectif = (n: number, plafond: number | null): string =>
  plafond === null
    ? `${n} artiste${n > 1 ? 's' : ''} sous contrat.`
    : `${n} artiste${n > 1 ? 's' : ''} sous contrat sur ${plafond} possibles à ton palier${n >= plafond ? ' : le roster est plein, monte de palier pour signer davantage' : ''}.`;

/** Roster : les artistes du label, triables et filtrables, avec leurs alertes. */
export function Roster({ ouvrir }: { ouvrir: (artisteId: number) => void }) {
  const { vue } = useLabel();
  const [cle, setCle] = useState<CleTri>('notoriete');
  const [decroissant, setDecroissant] = useState(true);
  const [filtres, setFiltres] = useState<Filtres>(SANS_FILTRE);
  const roster = vue?.roster ?? [];
  const affiches = useMemo(
    () => trier(filtrer(roster, filtres), cle, decroissant),
    [roster, filtres, cle, decroissant],
  );
  const genres = useMemo(
    () => [...new Map(roster.map((a) => [a.genre, a.genreNom])).entries()],
    [roster],
  );
  const phases = useMemo(
    () => [...new Map(roster.map((a) => [a.phase, a.phaseNom])).entries()],
    [roster],
  );

  const trierPar = (c: CleTri) => {
    if (c === cle) setDecroissant((d) => !d);
    else {
      setCle(c);
      setDecroissant(c !== 'nom' && c !== 'echeance');
    }
  };

  if (!vue) return null;
  if (roster.length === 0)
    return (
      <section className="label-screen" aria-labelledby="roster-titre">
        <h2 id="roster-titre">Roster</h2>
        <p>{texteEffectif(roster.length, vue.plafondRoster)}</p>
        <p className="label-screen__soon">
          Ton roster est vide. Repère des talents (touche 3) et signe-les pour bâtir ton label.
        </p>
      </section>
    );

  return (
    <section className="label-screen" aria-labelledby="roster-titre">
      <h2 id="roster-titre">Roster</h2>
      <p>{texteEffectif(roster.length, vue.plafondRoster)}</p>
      <div className="label-filters">
        <label>
          Recherche
          <input
            value={filtres.recherche}
            onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })}
            placeholder="Nom de scène"
          />
        </label>
        <label>
          Genre
          <select
            value={filtres.genre}
            onChange={(e) => setFiltres({ ...filtres, genre: e.target.value })}
          >
            <option value="">Tous</option>
            {genres.map(([id, nom]) => (
              <option key={id} value={id}>
                {nom}
              </option>
            ))}
          </select>
        </label>
        <label>
          Phase
          <select
            value={filtres.phase}
            onChange={(e) => setFiltres({ ...filtres, phase: e.target.value })}
          >
            <option value="">Toutes</option>
            {phases.map(([id, nom]) => (
              <option key={id} value={id}>
                {nom}
              </option>
            ))}
          </select>
        </label>
      </div>
      <table className="label-table">
        <thead>
          <tr>
            {COLONNES.map((c) => (
              <th
                key={c.cle}
                scope="col"
                aria-sort={c.cle === cle ? (decroissant ? 'descending' : 'ascending') : 'none'}
              >
                <button type="button" onClick={() => trierPar(c.cle)}>
                  {c.terme ? <Terme id={c.terme}>{c.titre}</Terme> : c.titre}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {affiches.map((a) => {
            const alertes = alertesArtiste(a, vue.semaine);
            return (
              <tr key={a.id}>
                <th scope="row">
                  <button type="button" className="label-link" onClick={() => ouvrir(a.id)}>
                    {a.nom}
                  </button>
                  <small>
                    {a.genreNom} · {a.phaseNom}
                    {a.enProduction ? ' · en studio' : ''}
                  </small>
                  {alertes.length > 0 ? (
                    <small className="label-warn"> ⚠ {alertes.join(', ')}</small>
                  ) : null}
                </th>
                <td className="mono">{a.notoriete}</td>
                <td className="mono">{a.hype}</td>
                <td className="mono">{a.moral}</td>
                <td className="mono">{a.fatigue}</td>
                <td className="mono">{a.contrat ? `sem. ${a.contrat.echeance}` : '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {affiches.length === 0 ? (
        <p className="label-screen__soon">Aucun artiste ne correspond aux filtres.</p>
      ) : null}
    </section>
  );
}
