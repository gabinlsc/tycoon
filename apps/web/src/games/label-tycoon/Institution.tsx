import { useState } from 'react';
import type { LabelAction } from '@tycoon/label-tycoon';
import { Flag, GraduationCap, HandHeart, Landmark, Megaphone } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { Barre, Panneau, Tuile, Tuiles } from './Visuels';

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
        <p className="lt-rien">
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
      <Tuiles label="Influence">
        <Tuile Icone={Flag} valeur={`${i.influence} / 100`} libelle="Influence" ton="purple" />
      </Tuiles>
      <Barre libelle="Influence" valeur={i.influence} ton="purple" />

      <Panneau titre="Influencer le marché" Icone={Megaphone} ton="pink" id="ins-influence">
        <ul className="lt-cartes-fin">
          {i.regles.map((r) => (
            <li key={r.id} className={`lt-carte-fin${r.actif ? ' lt-bonus is-atteint' : ''}`}>
              <strong>{REGLES[r.id]?.nom ?? r.id}</strong>
              <small>{REGLES[r.id]?.effet}</small>
              <span className="lt-chip">coût : {r.cout} d’influence</span>
              {r.actif ? (
                <span className="lt-chip lt-chip--bon">active jusqu’à la sem. {r.fin}</span>
              ) : null}
              <Button
                type="button"
                disabled={i.influence < r.cout}
                onClick={() =>
                  agir({ type: 'influencer', regle: r.id as 'remuneration' | 'vivier' })
                }
              >
                Exercer : {REGLES[r.id]?.nom ?? r.id}
              </Button>
            </li>
          ))}
        </ul>
      </Panneau>

      <Panneau titre="Fondation" Icone={HandHeart} ton="red" id="ins-fondation">
        <p className="lt-puces-info">
          <span className="lt-chip">Don actuel : {eur(i.fondation.don)} par semaine</span>
          <span className="lt-chip">total donné {eur(i.fondation.donne)}</span>
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
      </Panneau>

      <Panneau titre="Académie d’artistes" Icone={GraduationCap} ton="teal" id="ins-academie">
        {a === null ? (
          <p className="lt-sous-titre">
            Une promotion de diplômés, loyaux à ta maison, sort tous les six mois.
          </p>
        ) : (
          <>
            <Barre libelle="Niveau" valeur={a.niveau} max={a.max} ton="teal" />
            <p className="lt-puces-info">
              <span className="lt-chip">
                Niveau {a.niveau} / {a.max} · genre{' '}
                {i.genres.find((g) => g.id === a.genre)?.nom ?? a.genre}
              </span>
              <span className="lt-chip">budget {eur(a.budget)} par semaine</span>
              <span className="lt-chip">promotion sem. {a.prochaine}</span>
              <span className="lt-chip">{a.diplomes} diplômé(s)</span>
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
            </Button>
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
      </Panneau>

      <Panneau titre="Musée du label" Icone={Landmark} ton="gold" id="ins-musee">
        <Barre libelle="Niveau" valeur={i.musee.niveau} max={i.musee.max} ton="gold" />
        <p className="lt-puces-info">
          <span className="lt-chip">
            Niveau {i.musee.niveau} / {i.musee.max} · revenu annuel {eur(i.musee.revenuAnnuel)}
          </span>
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
      </Panneau>
    </section>
  );
}
