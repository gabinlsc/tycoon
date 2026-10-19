import { useState } from 'react';
import { Baby, Crown, Medal, Sprout, Users } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { Avatar } from './avatar';
import { useLabel } from './LabelContext';
import { Panneau, Tuile, Tuiles } from './Visuels';

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
      <Tuiles label="Générations">
        <Tuile Icone={Medal} valeur={g.retraites} libelle="artiste(s) à la retraite" ton="purple" />
        <Tuile Icone={Crown} valeur={g.legendes.length} libelle="légende(s) du label" ton="gold" />
        {g.legendes.length > 0 ? (
          <Tuile
            Icone={Sprout}
            valeur={`+${g.reputationParAn}`}
            libelle="réputation par an"
            ton="green"
          />
        ) : null}
      </Tuiles>

      <Panneau titre="Légendes du label" Icone={Crown} ton="gold" id="gen-legendes">
        {g.legendes.length === 0 ? (
          <p className="lt-rien">
            Un artiste célèbre qui prend sa retraite devient une légende : il parraine tes jeunes
            talents.
          </p>
        ) : (
          <ul className="lt-cartes-fin">
            {g.legendes.map((l) => {
              const choix = protege[l.id] ?? jeunes.find((j) => j.genre === l.genre)?.id;
              const candidats = jeunes.filter((j) => j.genre === l.genre);
              return (
                <li key={l.id} className="lt-carte-fin lt-legende">
                  <Avatar nom={l.nomScene} genre={l.genre} taille="lg" />
                  <strong>{l.nomScene}</strong>
                  <span className="lt-chip">retraité à {l.ageRetraite} ans</span>
                  <span className="lt-chip">
                    <Users aria-hidden="true" size={14} /> {l.fans.toLocaleString('fr-FR')} fans
                  </span>
                  {l.mentoree ? (
                    <span className="lt-chip lt-chip--bon">parraine {l.mentoree}</span>
                  ) : null}
                  {l.mentoree === null && candidats.length > 0 ? (
                    <span className="lt-carte-fin__actions">
                      <label className="label-field">
                        Protégé de {l.nomScene}
                        <select
                          value={choix ?? ''}
                          onChange={(e) =>
                            setProtege({ ...protege, [l.id]: Number(e.target.value) })
                          }
                        >
                          {candidats.map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.nom}
                            </option>
                          ))}
                        </select>
                      </label>
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
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panneau>

      <Panneau titre="La relève" Icone={Baby} ton="pink" id="gen-releve">
        {g.enfants.length === 0 ? (
          <p className="lt-rien">
            Les enfants d’artistes célèbres apparaissent quelques années après leur retraite.
          </p>
        ) : (
          <ul className="lt-cartes-fin">
            {g.enfants.map((e) => (
              <li key={e.id} className="lt-carte-fin">
                <Avatar nom={e.nomScene} genre={e.nomScene} />
                <strong>{e.nomScene}</strong>
                <span className="lt-chip">enfant de {e.parent}</span>
                <span className={`lt-chip${e.sousContrat ? ' lt-chip--bon' : ''}`}>
                  {e.sousContrat ? 'signé chez toi' : 'cherche un label'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </section>
  );
}
