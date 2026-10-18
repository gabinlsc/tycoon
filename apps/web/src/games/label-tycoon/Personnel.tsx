import { useState } from 'react';
import type { LabelAction, VuePersonnel } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

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
    <>
      <h3>Délégation du repérage</h3>
      {d.denicheurs === 0 ? (
        <p className="label-screen__soon">Il faut au moins un dénicheur pour déléguer.</p>
      ) : null}
      <p>
        Tes dénicheurs repèrent des talents à ta place, dans le cadre fixé ici : jamais plus que le
        budget par décision, seulement dans les genres cochés, et plus rien sous le seuil d’alerte.
      </p>
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
        <p className="label-screen__soon">Aucune décision déléguée pour l’instant.</p>
      ) : (
        <ul className="label-list">
          {d.rapports.map((r, i) => (
            <li key={`${r.semaine}-${i}`}>
              Sem. {r.semaine} — {r.decision ? `source « ${r.decision} »` : 'aucune décision'}, coût{' '}
              {eur(r.cout)}, {r.retenus} retenu(s), {r.ecartes} écarté(s).
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Équipe du label, marché de l'emploi et délégation du repérage. */
export function Personnel() {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const p = vue.personnel;
  const pleine = p.equipe.length >= p.capacite;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });

  return (
    <section className="label-screen" aria-labelledby="personnel-titre">
      <h2 id="personnel-titre">Personnel</h2>
      <p>
        Équipe : <strong className="mono">{p.equipe.length}</strong> / {p.capacite} · masse
        salariale <span className="mono">{eur(p.masseSalariale)}</span> par semaine. Agrandis les
        bureaux pour accueillir plus de monde.
      </p>
      {p.equipe.length === 0 ? (
        <p className="label-screen__soon">Personne dans l’équipe pour l’instant.</p>
      ) : (
        <table className="label-table">
          <caption>Équipe</caption>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">Rôle</th>
              <th scope="col">Niveau</th>
              <th scope="col">Moral</th>
              <th scope="col">Progression</th>
              <th scope="col">Salaire</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {parNiveau(p.equipe).map((m) => (
              <tr key={m.id}>
                <th scope="row">
                  {m.nom}
                  <small>
                    {m.trait}
                    {m.specialite ? ` · ${m.specialite}` : ''}
                  </small>
                </th>
                <td>{m.role}</td>
                <td className="mono">{m.niveau}</td>
                <td className="mono">{m.moral}</td>
                <td className="mono">
                  {progressionNiveau(m.experience, p.experiencePourNiveau)} %
                </td>
                <td className="mono">{eur(m.salaire)}</td>
                <td>
                  <Button type="button" onClick={() => agir({ type: 'licencier', membreId: m.id })}>
                    Licencier {m.nom}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Marché de l’emploi</h3>
      {p.candidats.length === 0 ? (
        <p className="label-screen__soon">Aucun candidat pour l’instant.</p>
      ) : (
        <ul className="label-list">
          {parNiveau(p.candidats).map((c) => (
            <li key={c.id}>
              {c.nom} — {c.role}
              {c.specialite ? ` (${c.specialite})` : ''}, niveau{' '}
              <span className="mono">{c.niveau}</span>, {c.trait}, {eur(c.salaire)} par semaine{' '}
              <Button
                type="button"
                tone="gold"
                disabled={pleine}
                onClick={() => agir({ type: 'embaucher', membreId: c.id })}
              >
                Embaucher {c.nom}
              </Button>
            </li>
          ))}
        </ul>
      )}
      {pleine ? <p>L’équipe est pleine : licencie ou agrandis les bureaux.</p> : null}

      <Delegation d={p.delegation} genres={p.genres} />
    </section>
  );
}
