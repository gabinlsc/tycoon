import { useState } from 'react';
import type { LabelAction, VuePays } from '@tycoon/label-tycoon';
import { Coins, Globe, Megaphone, Percent, Trophy } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { Tuile, Tuiles } from './Visuels';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

function Pays({ p, fonds }: { p: VuePays; fonds: number }) {
  const { envoyer } = useLabel();
  const [budget, setBudget] = useState(Math.round(p.budget / 100));
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });
  return (
    <article className="lt-article" aria-labelledby={`pays-${p.id}`}>
      <header className="lt-article__tete">
        <span className="lt-article__icone" aria-hidden="true">
          <Globe size={26} strokeWidth={2.4} />
        </span>
        <h3 id={`pays-${p.id}`}>{p.nom}</h3>
        <span className={`lt-chip${p.ouvert ? ' lt-chip--bon' : ''}`}>
          {p.ouvert ? 'bureau ouvert' : 'pas de bureau'}
        </span>
      </header>
      <p className="lt-puces-info">
        <span className="lt-chip">
          marché {Math.round(p.poids * 100)} % de ton marché d’origine
        </span>
        <span className="lt-chip">
          tes artistes y plaisent à <strong className="mono">×{p.affiniteRoster.toFixed(2)}</strong>
        </span>
      </p>
      <p className="lt-puces-info" aria-label="Genres plébiscités">
        {p.genres.map((g) => (
          <span key={g.nom} className="lt-chip lt-chip--bon">
            {g.nom} ×{g.affinite.toFixed(2)}
          </span>
        ))}
      </p>
      {p.ouvert ? (
        <>
          <Tuiles label={`Résultats à ${p.nom}`}>
            <Tuile
              Icone={Percent}
              valeur={`${p.penetration} %`}
              libelle="Pénétration"
              ton="purple"
            />
            <Tuile
              Icone={Coins}
              valeur={eur(p.revenuHebdo)}
              libelle="revenu de la semaine"
              ton="green"
            />
            <Tuile
              Icone={Trophy}
              valeur={eur(p.cumul)}
              libelle={`bilan cumulé · frais ${eur(p.fraisAnnuels)}/an`}
              ton="gold"
            />
          </Tuiles>
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
          </label>
          <Button
            type="button"
            tone="gold"
            onClick={() => agir({ type: 'regler-campagne', pays: p.id, budget: budget * 100 })}
          >
            <Megaphone aria-hidden="true" size={18} /> Régler la campagne à {p.nom}
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
        <p className="lt-rien">Aucun artiste n’est encore connu ici.</p>
      ) : (
        <ol className="lt-classement-local" aria-label={`Classement de ${p.nom}`}>
          {p.classement.map((l, i) => (
            <li key={l.artisteId} className={l.joueur ? 'is-joueur' : undefined}>
              <span className={`hit__rank mono${i < 3 ? ` hit__rank--${i + 1}` : ''}`}>
                {i + 1}
              </span>
              <span>
                {l.joueur ? <strong>{l.nom} (ton label)</strong> : l.nom}
                <small>{l.genreNom}</small>
              </span>
              <span className="mono">{l.score.toLocaleString('fr-FR')} pts</span>
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
        <p className="lt-rien">
          L’export s’ouvre au palier Major. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );
  return (
    <section className="label-screen" aria-labelledby="intl-titre">
      <h2 id="intl-titre">International</h2>
      <p className="lt-sous-titre">
        Un bureau local et une campagne font monter ta pénétration ; sans campagne, le public
        oublie.
      </p>
      {i.pays.map((p) => (
        <Pays key={p.id} p={p} fonds={vue.finances.tresorerie} />
      ))}
    </section>
  );
}
