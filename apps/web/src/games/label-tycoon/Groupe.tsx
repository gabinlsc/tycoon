import { useState } from 'react';
import type { LabelAction, VueGroupe } from '@tycoon/label-tycoon';
import { Briefcase, Building2, Coins, ShoppingCart, Sparkles, Target, UserCog } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { Avatar } from './avatar';
import { useLabel } from './LabelContext';
import { Panneau, Tuile, Tuiles } from './Visuels';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Fourchette de niveau lisible : « 55 à 75 », ou le niveau exact quand elle est resserrée. */
export const texteNiveau = ([bas, haut]: [number, number]): string =>
  bas === haut ? `${bas}` : `${bas} à ${haut}`;

/** Résultat net cumulé des dernières semaines d'un sous-label. */
export const netRecent = (recents: readonly number[]): number =>
  recents.reduce((somme, n) => somme + n, 0);

function SousLabel({
  s,
  candidats,
  agir,
}: {
  s: VueGroupe['sousLabels'][number];
  candidats: VueGroupe['candidats'];
  agir: (a: LabelAction) => void;
}) {
  const [enveloppe, setEnveloppe] = useState(Math.round(s.enveloppe / 100));
  const [candidat, setCandidat] = useState(0);
  const choisi = candidat || candidats[0]?.id || 0;
  return (
    <article className="lt-article" aria-label={s.nom}>
      <header className="lt-article__tete">
        <span className="lt-article__icone" aria-hidden="true">
          <Building2 size={26} strokeWidth={2.4} />
        </span>
        <h3>
          {s.nom} <small>({s.genreNom})</small>
        </h3>
      </header>
      {s.cadre ? (
        <div className="lt-cadre">
          <Avatar nom={s.cadre.nom} genre={s.cadre.style} taille="lg" />
          <p>
            Dirigé par <strong>{s.cadre.nom}</strong>
            <small>
              {s.cadre.style} · niveau <span className="mono">{texteNiveau(s.cadre.niveau)}</span> ·{' '}
              {eur(s.cadre.salaire)} par semaine ·{' '}
              {s.cadre.integrite === null
                ? 'fiabilité encore inconnue'
                : `fiabilité ${s.cadre.integrite}`}
            </small>
          </p>
        </div>
      ) : (
        <p className="lt-rien">Aucun cadre : le sous-label tourne au ralenti.</p>
      )}
      <Tuiles label={`Résultats de ${s.nom}`}>
        <Tuile
          Icone={Target}
          valeur={s.rendementEspere}
          libelle="€ rapporté par € investi"
          ton="gold"
        />
        <Tuile
          Icone={Coins}
          valeur={eur(netRecent(s.recents))}
          libelle="net des dernières semaines"
          ton={netRecent(s.recents) >= 0 ? 'green' : 'red'}
        />
        <Tuile
          Icone={Briefcase}
          valeur={`${eur(s.rapporte)} / ${eur(s.investi)}`}
          libelle="rapporté / investi"
          ton="purple"
        />
      </Tuiles>
      <div className="label-nego__form">
        <label className="label-field">
          Enveloppe hebdomadaire de {s.nom} (€)
          <input
            type="number"
            min={0}
            step={10_000}
            value={enveloppe}
            onChange={(e) => setEnveloppe(Math.max(0, Math.round(Number(e.target.value))))}
          />
        </label>
        {candidats.length > 0 ? (
          <label className="label-field">
            Nommer à la tête de {s.nom}
            <select value={choisi} onChange={(e) => setCandidat(Number(e.target.value))}>
              {candidats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom} — {c.style}, niveau {texteNiveau(c.niveau)}, {eur(c.salaire)}/sem.
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      <Button
        type="button"
        tone="gold"
        onClick={() =>
          agir({ type: 'regler-enveloppe', sousLabelId: s.id, montant: enveloppe * 100 })
        }
      >
        Régler l’enveloppe de {s.nom}
      </Button>
      {candidats.length > 0 ? (
        <Button
          type="button"
          onClick={() => agir({ type: 'nommer-cadre', sousLabelId: s.id, cadreId: choisi })}
        >
          Nommer le cadre de {s.nom}
        </Button>
      ) : null}
      <Button
        type="button"
        tone="ghost"
        onClick={() => agir({ type: 'fermer-sous-label', sousLabelId: s.id })}
      >
        Fermer {s.nom}
      </Button>
    </article>
  );
}

/** Palier Groupe : sous-labels dirigés par des cadres, enveloppes et rachat de rivaux. */
export function Groupe() {
  const { vue, envoyer } = useLabel();
  const [genre, setGenre] = useState('');
  const [nom, setNom] = useState('');
  if (!vue) return null;
  const g = vue.groupe;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });

  if (!g.debloque)
    return (
      <section className="label-screen" aria-labelledby="groupe-titre">
        <h2 id="groupe-titre">Groupe</h2>
        <p className="lt-rien">
          Les sous-labels s’ouvrent au palier Groupe. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );

  const choisi = genre || g.genresLibres[0]?.id || '';
  const abordable = vue.finances.tresorerie >= g.coutCreation;
  return (
    <section className="label-screen" aria-labelledby="groupe-titre">
      <h2 id="groupe-titre">Groupe</h2>
      <p className="lt-sous-titre">
        Tu diriges {g.sousLabels.length} sous-label(s) sur {g.max} possibles. Le niveau d’un cadre
        se précise avec le temps ; un cadre peu fiable peut détourner des fonds.
      </p>
      {g.sousLabels.map((s) => (
        <SousLabel key={s.id} s={s} candidats={g.candidats} agir={agir} />
      ))}

      {g.sousLabels.length < g.max && g.genresLibres.length > 0 ? (
        <Panneau
          titre={`Créer un sous-label (${eur(g.coutCreation)})`}
          Icone={Sparkles}
          ton="pink"
          id="grp-creer"
        >
          <div className="label-nego__form">
            <label className="label-field">
              Genre
              <select value={choisi} onChange={(e) => setGenre(e.target.value)}>
                {g.genresLibres.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="label-field">
              Nom du sous-label
              <input value={nom} maxLength={32} onChange={(e) => setNom(e.target.value)} />
            </label>
          </div>
          <Button
            type="button"
            tone="gold"
            disabled={!abordable || nom.trim() === ''}
            onClick={() => {
              agir({ type: 'creer-sous-label', genre: choisi, nom: nom.trim() });
              setNom('');
            }}
          >
            Créer le sous-label
          </Button>
        </Panneau>
      ) : null}

      <Panneau titre="Cadres disponibles" Icone={UserCog} ton="teal" id="grp-cadres">
        {g.candidats.length === 0 ? (
          <p className="lt-rien">Aucun candidat pour l’instant : le vivier se renouvelle.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {g.candidats.map((c) => (
              <li key={c.id} className="lt-carte-fin">
                <Avatar nom={c.nom} genre={c.style} />
                <strong>{c.nom}</strong>
                <span className="lt-chip">{c.style}</span>
                <span className="lt-chip">niveau {texteNiveau(c.niveau)}</span>
                <span className="lt-chip">{eur(c.salaire)} par semaine</span>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Racheter un rival" Icone={ShoppingCart} ton="red" id="grp-rachats">
        {g.rachats.length === 0 ? (
          <p className="lt-rien">Plus aucun rival à racheter.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {g.rachats.map((r) => (
              <li key={r.rivalId} className="lt-carte-fin">
                <Avatar nom={r.nom} genre={r.nom} />
                <strong>{r.nom}</strong>
                <span className="lt-chip">{r.artistes} artiste(s)</span>
                <span className="lt-chip">valorisation {eur(r.valorisation)}</span>
                <span className="lt-chip lt-chip--bon">rachat {eur(r.prix)}</span>
                <Button
                  type="button"
                  disabled={vue.finances.tresorerie < r.prix}
                  onClick={() => agir({ type: 'racheter-rival', rivalId: r.rivalId })}
                >
                  Racheter {r.nom}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </section>
  );
}
