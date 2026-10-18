import { useState } from 'react';
import type { LabelAction } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

const REGLES: Record<string, { nom: string; effet: string }> = {
  remuneration: {
    nom: 'Faire pression sur les tarifs de streaming',
    effet: 'Les écoutes rapportent 8 % de plus pendant un an.',
  },
  vivier: {
    nom: 'Soutenir la scène',
    effet: 'Six nouveaux talents arrivent sur le marché.',
  },
};

/** Palier Institution : fondation, académie d'artistes, musée du label et influence sur le marché. */
export function Institution() {
  const { vue, envoyer } = useLabel();
  const [don, setDon] = useState(0);
  const [genre, setGenre] = useState('');
  const [budget, setBudget] = useState(0);
  if (!vue) return null;
  const i = vue.institution;
  const fonds = vue.finances.tresorerie;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });

  if (!i.debloque)
    return (
      <section className="label-screen" aria-labelledby="inst-titre">
        <h2 id="inst-titre">Institution</h2>
        <p className="label-screen__soon">
          La fondation, l’académie et le musée s’ouvrent au palier Institution. Tu es actuellement
          un {vue.label.palier}.
        </p>
      </section>
    );

  const a = i.academie;
  const genreChoisi = genre || a?.genre || i.genres[0]?.id || '';
  return (
    <section className="label-screen" aria-labelledby="inst-titre">
      <h2 id="inst-titre">Institution</h2>
      <p>
        Influence : <strong className="mono">{i.influence}</strong> / 100. Elle monte avec le temps,
        tes dons et ton musée, et permet d’infléchir les règles du marché.
      </p>

      <h3>Influencer le marché</h3>
      <ul className="label-list">
        {i.regles.map((r) => (
          <li key={r.id}>
            <strong>{REGLES[r.id]?.nom ?? r.id}</strong> — {REGLES[r.id]?.effet} (coût : {r.cout}{' '}
            d’influence){r.actif ? ` · active jusqu’à la semaine ${r.fin}` : ''}{' '}
            <Button
              type="button"
              disabled={i.influence < r.cout}
              onClick={() => agir({ type: 'influencer', regle: r.id as 'remuneration' | 'vivier' })}
            >
              Exercer : {REGLES[r.id]?.nom ?? r.id}
            </Button>
          </li>
        ))}
      </ul>

      <h3>Fondation</h3>
      <p>
        Don actuel : {eur(i.fondation.don)} par semaine · total donné {eur(i.fondation.donne)}.
      </p>
      <label className="label-field">
        Don hebdomadaire (€)
        <input
          type="number"
          min={0}
          max={Math.round(i.fondation.donMax / 100)}
          step={100_000}
          value={don}
          onChange={(e) => setDon(Math.max(0, Math.round(Number(e.target.value))))}
        />
      </label>
      <Button
        type="button"
        tone="gold"
        onClick={() => agir({ type: 'regler-fondation', don: don * 100 })}
      >
        Régler la fondation
      </Button>

      <h3>Académie d’artistes</h3>
      {a === null ? (
        <p>
          Forme la génération suivante : une promotion de diplômés, loyaux à ta maison, sort tous
          les six mois.
        </p>
      ) : (
        <>
          <p>
            Niveau {a.niveau} / {a.max} · genre{' '}
            {i.genres.find((g) => g.id === a.genre)?.nom ?? a.genre} · budget {eur(a.budget)} par
            semaine · prochaine promotion semaine {a.prochaine} · {a.diplomes} diplômé(s).
          </p>
          <div className="label-nego__form">
            <label className="label-field">
              Genre enseigné
              <select value={genreChoisi} onChange={(e) => setGenre(e.target.value)}>
                {i.genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="label-field">
              Budget de l’académie (€ par semaine)
              <input
                type="number"
                min={0}
                max={Math.round(a.budgetMax / 100)}
                step={100_000}
                value={budget}
                onChange={(e) => setBudget(Math.max(0, Math.round(Number(e.target.value))))}
              />
            </label>
          </div>
          <Button
            type="button"
            tone="gold"
            onClick={() =>
              agir({ type: 'regler-academie', genre: genreChoisi, budget: budget * 100 })
            }
          >
            Régler l’académie
          </Button>{' '}
        </>
      )}
      {a === null || a.coutSuivant !== null ? (
        <Button
          type="button"
          disabled={fonds < (a?.coutSuivant ?? i.coutAcademie)}
          onClick={() => agir({ type: 'ameliorer-academie' })}
        >
          {a === null ? 'Fonder l’académie' : 'Améliorer l’académie'} (
          {eur(a?.coutSuivant ?? i.coutAcademie)})
        </Button>
      ) : null}

      <h3>Musée du label</h3>
      <p>
        Niveau {i.musee.niveau} / {i.musee.max} · revenu annuel {eur(i.musee.revenuAnnuel)}, qui
        monte avec tes disques certifiés.
      </p>
      {i.musee.coutSuivant !== null ? (
        <Button
          type="button"
          disabled={fonds < i.musee.coutSuivant}
          onClick={() => agir({ type: 'ameliorer-musee' })}
        >
          Agrandir le musée ({eur(i.musee.coutSuivant)})
        </Button>
      ) : null}
    </section>
  );
}
