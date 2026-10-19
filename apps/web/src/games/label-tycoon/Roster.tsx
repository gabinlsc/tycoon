import { useMemo, useState } from 'react';
import { useLabel } from './LabelContext';
import { AlertTriangle, Disc3, FileText, Users } from 'lucide-react';
import { CarteArtiste } from './CarteArtiste';
import { rareteDe, scoreArtiste } from './rarete';
import { EtatVide } from './EtatVide';
import type { EcranId } from './ecrans';
import {
  type CleTri,
  type Filtres,
  SANS_FILTRE,
  alertesArtiste,
  filtrer,
  trier,
} from './rosterFiltres';

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
export function Roster({
  ouvrir,
  allerA,
}: {
  ouvrir: (artisteId: number) => void;
  allerA?: (ecran: EcranId) => void;
}) {
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
        <EtatVide
          Icone={Users}
          titre="Personne sous contrat pour l’instant"
          texte="Ton roster est vide. Repère des talents et signe-les pour bâtir ton label."
          action="Repérer des talents"
          {...(allerA ? { onAction: () => allerA('reperage') } : {})}
        />
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
      <div className="lt-tri" role="group" aria-label="Trier les artistes">
        {COLONNES.map((c) => (
          <button
            key={c.cle}
            type="button"
            className={`lt-tri__puce${c.cle === cle ? ' is-actif' : ''}`}
            aria-pressed={c.cle === cle}
            onClick={() => trierPar(c.cle)}
          >
            {c.titre}
            {c.cle === cle ? <span aria-hidden="true">{decroissant ? ' ↓' : ' ↑'}</span> : null}
          </button>
        ))}
      </div>
      <ul className="lt-cartes">
        {affiches.map((a) => {
          const alertes = alertesArtiste(a, vue.semaine);
          return (
            <li key={a.id} className={`lt-carte${alertes.length > 0 ? ' a-alerte' : ''}`}>
              <button type="button" className="lt-carte__ouvrir" onClick={() => ouvrir(a.id)}>
                <CarteArtiste
                  nom={a.nom}
                  genre={a.genre}
                  genreNom={a.genreNom}
                  rarete={rareteDe(scoreArtiste(a))}
                  stats={[
                    { libelle: 'Notoriété', valeur: a.notoriete },
                    { libelle: 'Hype', valeur: a.hype },
                    { libelle: 'Moral', valeur: a.moral },
                    { libelle: 'Fatigue', valeur: a.fatigue },
                  ]}
                />
                <span className="lt-carte__pied">
                  {a.enProduction ? (
                    <span className="lt-chip">
                      <Disc3 aria-hidden="true" size={14} /> En studio
                    </span>
                  ) : null}
                  <span className="lt-chip">
                    <FileText aria-hidden="true" size={14} />{' '}
                    {a.contrat ? `Jusqu’à la sem. ${a.contrat.echeance}` : 'Sans contrat'}
                  </span>
                  {alertes.length > 0 ? (
                    <span className="lt-chip lt-chip--alerte">
                      <AlertTriangle aria-hidden="true" size={14} /> {alertes.join(', ')}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {affiches.length === 0 ? (
        <p className="label-screen__soon">Aucun artiste ne correspond aux filtres.</p>
      ) : null}
    </section>
  );
}
