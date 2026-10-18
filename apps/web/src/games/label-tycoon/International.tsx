import { useState } from 'react';
import type { LabelAction, VuePays } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

function Pays({ p, fonds }: { p: VuePays; fonds: number }) {
  const { envoyer } = useLabel();
  const [budget, setBudget] = useState(Math.round(p.budget / 100));
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });
  return (
    <article className="label-card" aria-labelledby={`pays-${p.id}`}>
      <h3 id={`pays-${p.id}`}>{p.nom}</h3>
      <p>
        Marché {Math.round(p.poids * 100)} % de ton marché d’origine · tes artistes y plaisent à{' '}
        <strong className="mono">×{p.affiniteRoster.toFixed(2)}</strong>.
      </p>
      <p>
        Genres plébiscités :{' '}
        {p.genres.map((g) => `${g.nom} (×${g.affinite.toFixed(2)})`).join(', ')}.
      </p>
      {p.ouvert ? (
        <>
          <p>
            Pénétration <strong className="mono">{p.penetration} %</strong> · revenu de la semaine{' '}
            {eur(p.revenuHebdo)} · bilan cumulé {eur(p.cumul)} · frais du bureau{' '}
            {eur(p.fraisAnnuels)} par an.
          </p>
          <label className="label-field">
            Budget de campagne à {p.nom} (€ par semaine)
            <input
              type="number"
              min={0}
              max={Math.round(p.budgetMax / 100)}
              step={1000}
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Math.round(Number(e.target.value))))}
            />
          </label>{' '}
          <Button
            type="button"
            tone="gold"
            onClick={() => agir({ type: 'regler-campagne', pays: p.id, budget: budget * 100 })}
          >
            Régler la campagne à {p.nom}
          </Button>
        </>
      ) : (
        <Button
          type="button"
          disabled={fonds < p.coutOuverture}
          onClick={() => agir({ type: 'ouvrir-marche', pays: p.id })}
        >
          Ouvrir un bureau à {p.nom} ({eur(p.coutOuverture)})
        </Button>
      )}
      <h4>Classement local</h4>
      {p.classement.length === 0 ? (
        <p>Aucun artiste n’est encore connu ici.</p>
      ) : (
        <ol className="label-list" aria-label={`Classement de ${p.nom}`}>
          {p.classement.map((l) => (
            <li key={l.artisteId}>
              {l.joueur ? <strong>{l.nom} (ton label)</strong> : l.nom} · {l.genreNom} ·{' '}
              {l.score.toLocaleString('fr-FR')} points
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

/** Marchés internationaux : bureaux locaux, campagnes, goûts de chaque pays et classements locaux. */
export function International() {
  const { vue } = useLabel();
  if (!vue) return null;
  const i = vue.international;
  if (!i.debloque)
    return (
      <section className="label-screen" aria-labelledby="intl-titre">
        <h2 id="intl-titre">International</h2>
        <p className="label-screen__soon">
          L’export s’ouvre au palier Major. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );
  return (
    <section className="label-screen" aria-labelledby="intl-titre">
      <h2 id="intl-titre">International</h2>
      <p>
        Chaque pays a ses goûts : un bureau local et une campagne font monter ta pénétration, qui
        multiplie tes revenus d’écoute à l’étranger. Sans campagne, le public oublie.
      </p>
      {i.pays.map((p) => (
        <Pays key={p.id} p={p} fonds={vue.finances.tresorerie} />
      ))}
    </section>
  );
}
