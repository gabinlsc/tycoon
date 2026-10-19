import { useState } from 'react';
import { GLOSSAIRE } from '@tycoon/label-tycoon';
import type { VueGenre, VuePrevision } from '@tycoon/label-tycoon';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Coins,
  Flame,
  LineChart,
  Radar,
  Sparkles,
  Sun,
} from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { GraphBarres } from './graphiques/Graphiques';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';
import { Barre, Panneau, tonDeRang } from './Visuels';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Genres triés du plus populaire au moins populaire. */
export const parPopularite = (genres: readonly VueGenre[]): VueGenre[] =>
  [...genres].sort((a, b) => b.popularite - a.popularite || a.nom.localeCompare(b.nom, 'fr'));

/** Lecture d'une prévision : valeur annoncée et fourchette d'erreur, bornée à 0-100. */
export function fourchettePrevision(p: VuePrevision): [number, number] {
  return [Math.max(0, p.valeur - p.marge), Math.min(100, p.valeur + p.marge)];
}

/** Variation affichée « +35 % », « −18 % » ou « inchangé ». */
export const texteVariation = (v: number): string =>
  v === 0 ? 'inchangé' : `${v > 0 ? '+' : '−'}${Math.abs(v)} %`;

/** Marché des genres, sous-genres émergents et études de marché (prévisions bruitées). */
export function Marche() {
  const { vue, envoyer } = useLabel();
  const [genre, setGenre] = useState('');
  const [horizon, setHorizon] = useState(13);
  if (!vue) return null;
  const m = { ...vue.marche, ere: vue.ere };
  const tries = parPopularite(m.genres);
  const choisi = genre || tries[0]?.id || '';
  const abordable = vue.finances.tresorerie >= m.coutEtude;

  const fleche = (v: number) =>
    v > 1.02 ? (
      <ArrowUpRight aria-hidden="true" size={18} className="lt-tend lt-tend--haut" />
    ) : v < 0.98 ? (
      <ArrowDownRight aria-hidden="true" size={18} className="lt-tend lt-tend--bas" />
    ) : (
      <ArrowRight aria-hidden="true" size={18} className="lt-tend" />
    );

  return (
    <section className="label-screen" aria-labelledby="marche-titre">
      <h2 id="marche-titre">Marché</h2>
      <p className="lt-sous-titre">
        La <Terme id="tendance">tendance</Terme> d’un genre multiplie le potentiel de hit de tes
        sorties · revenu par écoute ×<span className="mono">{m.facteurStreaming}</span>
      </p>
      <section aria-labelledby="ere-titre" className="lt-ere">
        <span className="lt-ere__icone" aria-hidden="true">
          <Sun size={34} strokeWidth={2.2} />
        </span>
        <div>
          <h3 id="ere-titre">{m.ere.nom}</h3>
          <p>{m.ere.description}</p>
          <ul className="lt-ere__effets">
            {m.ere.effets
              .filter((e) => e.variation !== 0)
              .map((e) => (
                <li
                  key={e.libelle}
                  className={`lt-chip lt-chip--${e.variation > 0 ? 'bon' : 'mauvais'}`}
                >
                  {e.variation > 0 ? (
                    <ArrowUpRight aria-hidden="true" size={14} />
                  ) : (
                    <ArrowDownRight aria-hidden="true" size={14} />
                  )}
                  {e.libelle} : <strong className="mono">{texteVariation(e.variation)}</strong>
                </li>
              ))}
          </ul>
          {m.ere.prochaine?.indice ? (
            <p className="lt-ere__signal">
              <Radar aria-hidden="true" size={16} /> <em>{m.ere.prochaine.indice}</em>
              {m.ere.prochaine.nom
                ? ` Prochaine ère : ${m.ere.prochaine.nom}, dans ${m.ere.prochaine.dans} semaine(s).`
                : ''}
            </p>
          ) : null}
        </div>
      </section>
      {vue.saisons.length > 0 ? (
        <Panneau titre="Saisons en cours" Icone={Sparkles} ton="pink" id="saisons-titre">
          <ul className="lt-cartes-fin">
            {vue.saisons.map((s) => (
              <li key={s.id} className="lt-carte-fin">
                <strong>{s.nom}</strong>
                <small>{s.description}</small>
              </li>
            ))}
          </ul>
        </Panneau>
      ) : null}
      <Panneau titre="Les genres" Icone={Flame} ton="orange" id="genres-titre">
        <ul className="lt-genres">
          {tries.map((g, i) => (
            <li key={g.id} className={`lt-genre lt-genre--${tonDeRang(i)}`}>
              <span className="lt-genre__tete">
                <strong>{g.nom}</strong>
                {fleche(g.tendance)}
              </span>
              <span className="lt-genre__pop mono">{g.popularite}</span>
              <Barre libelle="Popularité" valeur={g.popularite} ton={tonDeRang(i)} />
              <span className="lt-genre__pied">
                <span className="lt-chip">×{g.tendance}</span>
                <span className="lt-chip">
                  <Terme id="credibilite">Crédibilité</Terme> {g.credibilite}
                </span>
              </span>
              {g.sousGenre ? (
                <small className="lt-genre__sous">
                  Sous-genre émergent ({g.sousGenre.naissance + g.sousGenre.duree - vue.semaine}{' '}
                  sem. restantes)
                  {g.sousGenre.premier
                    ? ` · premier signataire : ${g.sousGenre.premier === 'joueur' ? 'toi' : 'un rival'}`
                    : ' · personne n’y a encore signé'}
                </small>
              ) : null}
            </li>
          ))}
        </ul>
      </Panneau>
      <Panneau titre="Popularité des genres" Icone={LineChart} ton="purple" id="pop-titre">
        <GraphBarres
          titre="Popularité des genres (0 à 100)"
          etiquettes={tries.map((g) => g.nom.slice(0, 8))}
          series={[{ nom: 'Popularité', valeurs: tries.map((g) => g.popularite) }]}
        />
      </Panneau>

      <Panneau titre="Études de marché" Icone={Radar} ton="teal" id="etudes-titre">
        <p className="lt-sous-titre">
          Une étude prédit la popularité d’un genre ; la marge d’erreur baisse avec ton meilleur
          dénicheur (niveau <span className="mono">{m.analyste}</span>).{' '}
          {GLOSSAIRE['tendance']?.definition}
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
            void envoyer({
              type: 'action',
              action: { type: 'etude-marche', genre: choisi, horizon },
            })
          }
        >
          <Coins aria-hidden="true" size={18} /> Commander une étude ({eur(m.coutEtude)})
        </Button>
        {m.previsions.length === 0 ? (
          <p className="lt-rien">Aucune étude pour l’instant.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {[...m.previsions].reverse().map((p, i) => {
              const [bas, haut] = fourchettePrevision(p);
              return (
                <li key={`${p.genre}-${p.pour}-${i}`} className="lt-carte-fin">
                  <strong>{p.nom}</strong>
                  <span className="lt-chip">semaine {p.pour}</span>
                  <span className="lt-chip">
                    autour de <strong className="mono">{p.valeur}</strong>
                  </span>
                  <span className="lt-prevision" aria-hidden="true">
                    <span style={{ left: `${bas}%`, width: `${Math.max(2, haut - bas)}%` }} />
                  </span>
                  <small>
                    entre {bas} et {haut}, étude de la semaine {p.faiteLe}
                  </small>
                </li>
              );
            })}
          </ul>
        )}
      </Panneau>
    </section>
  );
}
