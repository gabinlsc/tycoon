import { useState } from 'react';
import type { LabelAction, VuePersonnel } from '@tycoon/label-tycoon';
import { Binoculars, Briefcase, Coins, Heart, UserMinus, UserPlus, Users } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { Avatar } from './avatar';
import { useLabel } from './LabelContext';
import { Barre, Panneau, Tuile, Tuiles } from './Visuels';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Part de l'expérience nécessaire au prochain niveau, entre 0 et 100. */
export const progressionNiveau = (experience: number, pourNiveau: number): number =>
  Math.max(0, Math.min(100, Math.round((experience / Math.max(1, pourNiveau)) * 100)));

/** Candidats triés du meilleur niveau au moins bon, puis par nom. */
export const parNiveau = <T extends { niveau: number; nom: string }>(liste: readonly T[]): T[] =>
  [...liste].sort((a, b) => b.niveau - a.niveau || a.nom.localeCompare(b.nom, 'fr'));

function Delegation({
  d,
  genres,
}: {
  d: VuePersonnel['delegation'];
  genres: VuePersonnel['genres'];
}) {
  const { envoyer } = useLabel();
  const [actif, setActif] = useState(d.actif);
  const [budget, setBudget] = useState(Math.round(d.budgetMax / 100));
  const [seuil, setSeuil] = useState(Math.round(d.seuilAlerte / 100));
  const [choisis, setChoisis] = useState<string[]>(d.genres);
  const basculer = (id: string) =>
    setChoisis((l) => (l.includes(id) ? l.filter((g) => g !== id) : [...l, id]));
  const enregistrer = () => {
    const action: LabelAction = {
      type: 'configurer-delegation',
      domaine: 'reperage',
      cadre: {
        actif,
        budgetMax: Math.max(0, Math.round(budget)) * 100,
        seuilAlerte: Math.round(seuil) * 100,
        genres: choisis,
      },
    };
    void envoyer({ type: 'action', action });
  };
  return (
    <Panneau titre="Délégation du repérage" Icone={Binoculars} ton="teal" id="pers-deleg">
      {d.denicheurs === 0 ? (
        <p className="lt-rien">Il faut au moins un dénicheur pour déléguer.</p>
      ) : null}
      <p className="lt-sous-titre">Tes dénicheurs repèrent à ta place, dans le cadre ci-dessous.</p>
      <label className="label-field">
        <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />{' '}
        Délégation active
      </label>
      <div className="label-nego__form">
        <label className="label-field">
          Budget maximal par décision (€)
          <input
            type="number"
            min={0}
            step={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
          />
        </label>
        <label className="label-field">
          Seuil d’alerte de trésorerie (€)
          <input
            type="number"
            step={100}
            value={seuil}
            onChange={(e) => setSeuil(Number(e.target.value))}
          />
        </label>
      </div>
      <fieldset className="label-field">
        <legend>Genres autorisés (aucun coché = tous)</legend>
        {genres.map((g) => (
          <label key={g.id}>
            <input
              type="checkbox"
              checked={choisis.includes(g.id)}
              onChange={() => basculer(g.id)}
            />{' '}
            {g.nom}{' '}
          </label>
        ))}
      </fieldset>
      <Button type="button" tone="gold" onClick={enregistrer}>
        Enregistrer le cadre
      </Button>
      <h4>Rapports de délégation</h4>
      {d.rapports.length === 0 ? (
        <p className="lt-rien">Aucune décision déléguée pour l’instant.</p>
      ) : (
        <ul className="lt-cartes-fin">
          {d.rapports.map((r, i) => (
            <li key={`${r.semaine}-${i}`} className="lt-carte-fin">
              <strong>Sem. {r.semaine}</strong>
              <span className="lt-chip">
                {r.decision ? `source « ${r.decision} »` : 'aucune décision'}
              </span>
              <span className="lt-chip">coût {eur(r.cout)}</span>
              <span className="lt-chip">{r.retenus} retenu(s)</span>
              <span className="lt-chip">{r.ecartes} écarté(s)</span>
            </li>
          ))}
        </ul>
      )}
    </Panneau>
  );
}

/** Équipe du label, marché de l'emploi et délégation du repérage. */
export function Personnel() {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const p = vue.personnel;
  const pleine = p.equipe.length >= p.capacite;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });

  const moralMoyen =
    p.equipe.length > 0
      ? Math.round(p.equipe.reduce((somme, m) => somme + m.moral, 0) / p.equipe.length)
      : 0;

  return (
    <section className="label-screen" aria-labelledby="personnel-titre">
      <h2 id="personnel-titre">Personnel</h2>
      <Tuiles label="Équipe">
        <Tuile
          Icone={Users}
          valeur={`${p.equipe.length} / ${p.capacite}`}
          libelle="Places aux bureaux"
          ton="purple"
          alerte={pleine}
        />
        <Tuile
          Icone={Coins}
          valeur={eur(p.masseSalariale)}
          libelle="Masse salariale par semaine"
          ton="orange"
        />
        <Tuile
          Icone={Heart}
          valeur={p.equipe.length > 0 ? `${moralMoyen}` : '—'}
          libelle="Moral moyen"
          ton="pink"
        />
      </Tuiles>
      <Panneau titre="Équipe" Icone={Briefcase} ton="purple" id="pers-equipe">
        {p.equipe.length === 0 ? (
          <p className="lt-rien">Personne dans l’équipe pour l’instant.</p>
        ) : (
          <ul className="lt-cartes">
            {parNiveau(p.equipe).map((m) => (
              <li key={m.id} className="lt-carte">
                <div className="lt-carte__ouvrir lt-membre">
                  <span className="lt-carte__tete">
                    <Avatar nom={m.nom} genre={m.role} taille="lg" />
                    <span>
                      <strong className="lt-carte__nom">{m.nom}</strong>
                      <small>
                        {m.role}
                        {m.specialite ? ` · ${m.specialite}` : ''}
                      </small>
                    </span>
                  </span>
                  <span className="lt-carte__jauges">
                    <Barre libelle="Niveau" valeur={m.niveau} ton="gold" />
                    <Barre libelle="Moral" valeur={m.moral} ton="green" />
                    <Barre
                      libelle="Progression"
                      valeur={progressionNiveau(m.experience, p.experiencePourNiveau)}
                      ton="blue"
                    />
                  </span>
                  <span className="lt-carte__pied">
                    <span className="lt-chip">{m.trait}</span>
                    <span className="lt-chip">
                      <Coins aria-hidden="true" size={14} /> {eur(m.salaire)}
                    </span>
                    <Button
                      type="button"
                      onClick={() => agir({ type: 'licencier', membreId: m.id })}
                    >
                      <UserMinus aria-hidden="true" size={16} /> Licencier {m.nom}
                    </Button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Marché de l’emploi" Icone={UserPlus} ton="gold" id="pers-emploi">
        {p.candidats.length === 0 ? (
          <p className="lt-rien">Aucun candidat pour l’instant.</p>
        ) : (
          <ul className="lt-cartes">
            {parNiveau(p.candidats).map((c) => (
              <li key={c.id} className="lt-carte">
                <div className="lt-carte__ouvrir lt-membre">
                  <span className="lt-carte__tete">
                    <Avatar nom={c.nom} genre={c.role} taille="lg" />
                    <span>
                      <strong className="lt-carte__nom">{c.nom}</strong>
                      <small>
                        {c.role}
                        {c.specialite ? ` · ${c.specialite}` : ''}
                      </small>
                    </span>
                  </span>
                  <span className="lt-carte__jauges">
                    <Barre libelle="Niveau" valeur={c.niveau} ton="gold" />
                  </span>
                  <span className="lt-carte__pied">
                    <span className="lt-chip">{c.trait}</span>
                    <span className="lt-chip">
                      <Coins aria-hidden="true" size={14} /> {eur(c.salaire)}
                    </span>
                    <Button
                      type="button"
                      tone="gold"
                      disabled={pleine}
                      onClick={() => agir({ type: 'embaucher', membreId: c.id })}
                    >
                      <UserPlus aria-hidden="true" size={16} /> Embaucher {c.nom}
                    </Button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pleine ? (
          <p className="label-warn">L’équipe est pleine : licencie ou agrandis les bureaux.</p>
        ) : null}
      </Panneau>

      <Delegation d={p.delegation} genres={p.genres} />
    </section>
  );
}
