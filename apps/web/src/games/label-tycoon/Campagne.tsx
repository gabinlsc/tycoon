import { Check, Crown, Flag, Lock, Swords } from 'lucide-react';
import { Avatar } from './avatar';
import { CHAPITRES, progression } from './chapitres';
import { useLabel } from './LabelContext';
import { Panneau } from './Visuels';

const eur = (euros: number): string => `${euros.toLocaleString('fr-FR')} €`;

/** Chemin des chapitres : un nœud par palier, les chapitres passés cochés, l'actuel qui pulse. */
export function CheminCampagne({ index }: { index: number }) {
  return (
    <ol className="lt-chemin" aria-label="Chapitres de la campagne">
      {CHAPITRES.map((c, i) => (
        <li
          key={c.palier}
          className={i < index ? 'is-fait' : i === index ? 'is-courant' : 'is-futur'}
          aria-current={i === index ? 'step' : undefined}
        >
          <span className="lt-chemin__noeud" aria-hidden="true">
            {i < index ? (
              <Check size={18} strokeWidth={3} />
            ) : i === index ? (
              <Flag size={18} />
            ) : (
              <Lock size={14} />
            )}
          </span>
          <span className="lt-chemin__titre">{c.titre}</span>
        </li>
      ))}
    </ol>
  );
}

/** Campagne : le chemin du garage à l'institution, le chapitre en cours et le rival qui te défie. */
export function Campagne() {
  const { vue } = useLabel();
  if (!vue) return null;
  const p = progression(vue);
  const rivaux = [...vue.concurrence.rivaux].sort((a, b) => a.valorisation - b.valorisation);
  const rival = rivaux[Math.min(p.index, Math.max(0, rivaux.length - 1))];

  return (
    <section className="label-screen" aria-labelledby="campagne-titre">
      <h2 id="campagne-titre">Campagne</h2>
      <CheminCampagne index={p.index} />

      <Panneau
        titre={`Chapitre ${p.index + 1} : ${p.chapitre.titre}`}
        Icone={Flag}
        ton="purple"
        id="camp-chapitre"
      >
        <p className="lt-sous-titre">{p.chapitre.histoire}</p>
        {p.dernier ? (
          <p className="lt-puces-info">
            <span className="lt-chip lt-chip--bon">
              <Crown aria-hidden="true" size={14} /> Dernier chapitre : l’institution
            </span>
          </p>
        ) : (
          <>
            <div
              className="lt-camp__anneau"
              role="img"
              aria-label={`Avancement du chapitre : ${Math.round(p.avancement * 100)} %`}
            >
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="42" className="lt-camp__fond" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="lt-camp__arc"
                  strokeDasharray={`${p.avancement * 264} 264`}
                />
              </svg>
              <strong>{Math.round(p.avancement * 100)} %</strong>
            </div>
            <ul className="lt-camp__objectifs">
              {p.objectifs.map((o) => {
                const fait = o.actuel >= o.cible;
                return (
                  <li key={o.id} className={fait ? 'is-fait' : undefined}>
                    <span>
                      {fait ? <Check aria-hidden="true" size={16} /> : null} {o.libelle}
                    </span>
                    <progress
                      max={o.cible}
                      value={Math.min(o.actuel, o.cible)}
                      aria-label={`${o.libelle} : ${o.actuel} sur ${o.cible}`}
                    />
                    <small className="mono">
                      {o.id === 'ca'
                        ? `${eur(o.actuel)} / ${eur(o.cible)}`
                        : `${o.actuel} / ${o.cible}`}
                    </small>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Panneau>

      {rival ? (
        <Panneau titre="Ton rival" Icone={Swords} ton="red" id="camp-rival">
          <div className="lt-camp__rival">
            <Avatar nom={rival.nom} genre={rival.genreFetiche} taille="lg" />
            <blockquote>
              <strong>{rival.nom}</strong>
              <p>« {p.chapitre.defi} »</p>
              <small>{rival.personnalite}</small>
            </blockquote>
          </div>
        </Panneau>
      ) : null}
    </section>
  );
}
