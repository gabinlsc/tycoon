import { useState } from 'react';
import type { LabelAction, VueGroupe } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

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
    <article className="label-card" aria-label={s.nom}>
      <h3>
        {s.nom} <small>({s.genreNom})</small>
      </h3>
      {s.cadre ? (
        <p>
          Dirigé par <strong>{s.cadre.nom}</strong> ({s.cadre.style}) · niveau{' '}
          <span className="mono">{texteNiveau(s.cadre.niveau)}</span> · {eur(s.cadre.salaire)} par
          semaine ·{' '}
          {s.cadre.integrite === null
            ? 'fiabilité encore inconnue'
            : `fiabilité ${s.cadre.integrite}`}
        </p>
      ) : (
        <p className="label-screen__soon">Aucun cadre : le sous-label tourne au ralenti.</p>
      )}
      <p>
        Rendement espéré : <span className="mono">{s.rendementEspere}</span> € rapporté par euro
        investi. Dernières semaines : net <span className="mono">{eur(netRecent(s.recents))}</span>.
        Depuis la création : investi {eur(s.investi)}, rapporté {eur(s.rapporte)}.
      </p>
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
      </Button>{' '}
      {candidats.length > 0 ? (
        <Button
          type="button"
          onClick={() => agir({ type: 'nommer-cadre', sousLabelId: s.id, cadreId: choisi })}
        >
          Nommer le cadre de {s.nom}
        </Button>
      ) : null}{' '}
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
        <p className="label-screen__soon">
          Les sous-labels s’ouvrent au palier Groupe. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );

  const choisi = genre || g.genresLibres[0]?.id || '';
  const abordable = vue.finances.tresorerie >= g.coutCreation;
  return (
    <section className="label-screen" aria-labelledby="groupe-titre">
      <h2 id="groupe-titre">Groupe</h2>
      <p>
        Tu diriges {g.sousLabels.length} sous-label(s) sur {g.max} possibles. Chaque cadre a un
        niveau que tu ne connais d’abord qu’à peu près : la fourchette se resserre avec le temps, et
        sa fiabilité se révèle plus tard. Un cadre peu fiable peut détourner des fonds.
      </p>
      {g.sousLabels.map((s) => (
        <SousLabel key={s.id} s={s} candidats={g.candidats} agir={agir} />
      ))}

      {g.sousLabels.length < g.max && g.genresLibres.length > 0 ? (
        <>
          <h3>Créer un sous-label ({eur(g.coutCreation)})</h3>
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
        </>
      ) : null}

      <h3>Cadres disponibles</h3>
      {g.candidats.length === 0 ? (
        <p className="label-screen__soon">
          Aucun candidat pour l’instant : le vivier se renouvelle.
        </p>
      ) : (
        <ul className="label-list">
          {g.candidats.map((c) => (
            <li key={c.id}>
              {c.nom} — {c.style}, niveau estimé {texteNiveau(c.niveau)}, {eur(c.salaire)} par
              semaine
            </li>
          ))}
        </ul>
      )}

      <h3>Racheter un rival</h3>
      {g.rachats.length === 0 ? (
        <p className="label-screen__soon">Plus aucun rival à racheter.</p>
      ) : (
        <ul className="label-list">
          {g.rachats.map((r) => (
            <li key={r.rivalId}>
              {r.nom} — {r.artistes} artiste(s), valorisation {eur(r.valorisation)}, rachat{' '}
              <strong className="mono">{eur(r.prix)}</strong>{' '}
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
    </section>
  );
}
