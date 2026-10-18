import { useState } from 'react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

/** Générations : légendes du label, parrainage des jeunes talents et relève d'artistes célèbres. */
export function Generations() {
  const { vue, envoyer } = useLabel();
  const [protege, setProtege] = useState<Record<number, number>>({});
  if (!vue) return null;
  const g = vue.generations;
  const jeunes = vue.roster.filter((a) => a.phase === 'emergent' || a.phase === 'montee');
  return (
    <section className="label-screen" aria-labelledby="gen-titre">
      <h2 id="gen-titre">Générations</h2>
      <p>
        {g.retraites} artiste(s) à la retraite · {g.legendes.length} légende(s) du label
        {g.legendes.length > 0 ? ` (+${g.reputationParAn} de réputation par an)` : ''}.
      </p>

      <h3>Légendes du label</h3>
      {g.legendes.length === 0 ? (
        <p>
          Quand un artiste de ton label prend sa retraite en restant célèbre, il devient une légende
          : il parraine tes jeunes talents et inspire les diplômés de ton académie.
        </p>
      ) : (
        <ul className="label-list">
          {g.legendes.map((l) => {
            const choix = protege[l.id] ?? jeunes.find((j) => j.genre === l.genre)?.id;
            const candidats = jeunes.filter((j) => j.genre === l.genre);
            return (
              <li key={l.id}>
                <strong>{l.nomScene}</strong> — retraité à {l.ageRetraite} ans,{' '}
                {l.fans.toLocaleString('fr-FR')} fans
                {l.mentoree ? ` · parraine ${l.mentoree}` : ''}
                {l.mentoree === null && candidats.length > 0 ? (
                  <>
                    {' '}
                    <label className="label-field">
                      Protégé de {l.nomScene}
                      <select
                        value={choix ?? ''}
                        onChange={(e) => setProtege({ ...protege, [l.id]: Number(e.target.value) })}
                      >
                        {candidats.map((j) => (
                          <option key={j.id} value={j.id}>
                            {j.nom}
                          </option>
                        ))}
                      </select>
                    </label>{' '}
                    <Button
                      type="button"
                      disabled={choix === undefined}
                      onClick={() =>
                        choix !== undefined &&
                        void envoyer({
                          type: 'action',
                          action: { type: 'parrainer', mentorId: l.id, protegeId: choix },
                        })
                      }
                    >
                      Faire parrainer par {l.nomScene}
                    </Button>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <h3>La relève</h3>
      {g.enfants.length === 0 ? (
        <p>Les enfants d’artistes célèbres apparaissent quelques années après leur retraite.</p>
      ) : (
        <ul className="label-list">
          {g.enfants.map((e) => (
            <li key={e.id}>
              <strong>{e.nomScene}</strong>, enfant de {e.parent}
              {e.sousContrat ? ' · signé chez toi' : ' · cherche un label'}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
