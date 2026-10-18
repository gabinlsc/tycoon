import { useState } from 'react';
import { GLOSSAIRE } from '@tycoon/label-tycoon';
import type { VueGenre, VuePrevision } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { GraphBarres } from './graphiques/Graphiques';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Genres triés du plus populaire au moins populaire. */
export const parPopularite = (genres: readonly VueGenre[]): VueGenre[] =>
  [...genres].sort((a, b) => b.popularite - a.popularite || a.nom.localeCompare(b.nom, 'fr'));

/** Lecture d'une prévision : valeur annoncée et fourchette d'erreur, bornée à 0-100. */
export function fourchettePrevision(p: VuePrevision): [number, number] {
  return [Math.max(0, p.valeur - p.marge), Math.min(100, p.valeur + p.marge)];
}

/** Marché des genres, sous-genres émergents et études de marché (prévisions bruitées). */
export function Marche() {
  const { vue, envoyer } = useLabel();
  const [genre, setGenre] = useState('');
  const [horizon, setHorizon] = useState(13);
  if (!vue) return null;
  const m = vue.marche;
  const tries = parPopularite(m.genres);
  const choisi = genre || tries[0]?.id || '';
  const abordable = vue.finances.tresorerie >= m.coutEtude;

  return (
    <section className="label-screen" aria-labelledby="marche-titre">
      <h2 id="marche-titre">Marché</h2>
      <p>
        La <Terme id="tendance">tendance</Terme> d’un genre multiplie le potentiel de hit de tes
        sorties. Revenu par écoute des plateformes : ×
        <span className="mono">{m.facteurStreaming}</span>.
      </p>
      <GraphBarres
        titre="Popularité des genres (0 à 100)"
        etiquettes={tries.map((g) => g.nom.slice(0, 8))}
        series={[{ nom: 'Popularité', valeurs: tries.map((g) => g.popularite) }]}
      />
      <table className="label-table">
        <thead>
          <tr>
            <th scope="col">Genre</th>
            <th scope="col">Popularité</th>
            <th scope="col">Tendance</th>
            <th scope="col">
              <Terme id="credibilite">Crédibilité</Terme>
            </th>
          </tr>
        </thead>
        <tbody>
          {tries.map((g) => (
            <tr key={g.id}>
              <th scope="row">
                {g.nom}
                {g.sousGenre ? (
                  <small>
                    Sous-genre émergent ({g.sousGenre.naissance + g.sousGenre.duree - vue.semaine}{' '}
                    sem. restantes)
                    {g.sousGenre.premier
                      ? ` · premier signataire : ${g.sousGenre.premier === 'joueur' ? 'toi' : 'un rival'}`
                      : ' · personne n’y a encore signé'}
                  </small>
                ) : null}
              </th>
              <td className="mono">{g.popularite}</td>
              <td className="mono">×{g.tendance}</td>
              <td className="mono">{g.credibilite}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Études de marché</h3>
      <p>
        Une étude annonce la popularité d’un genre dans quelques semaines, avec une marge d’erreur
        qui baisse avec le niveau de ton meilleur dénicheur (actuellement{' '}
        <span className="mono">{m.analyste}</span>). {GLOSSAIRE['tendance']?.definition}
      </p>
      <div className="label-nego__form">
        <label className="label-field">
          Genre
          <select value={choisi} onChange={(e) => setGenre(e.target.value)}>
            {tries.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="label-field">
          Horizon
          <select value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
            {m.horizons.map((h) => (
              <option key={h} value={h}>
                {h} semaines
              </option>
            ))}
          </select>
        </label>
      </div>
      <Button
        type="button"
        tone="gold"
        disabled={!abordable || !choisi}
        onClick={() =>
          void envoyer({ type: 'action', action: { type: 'etude-marche', genre: choisi, horizon } })
        }
      >
        Commander une étude ({eur(m.coutEtude)})
      </Button>
      {m.previsions.length === 0 ? (
        <p className="label-screen__soon">Aucune étude pour l’instant.</p>
      ) : (
        <ul className="label-list">
          {[...m.previsions].reverse().map((p, i) => {
            const [bas, haut] = fourchettePrevision(p);
            return (
              <li key={`${p.genre}-${p.pour}-${i}`}>
                {p.nom} — semaine {p.pour} : popularité autour de{' '}
                <strong className="mono">{p.valeur}</strong> (entre {bas} et {haut}), étude de la
                semaine {p.faiteLe}.
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
