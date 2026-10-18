import { useState } from 'react';
import type { VueCertification } from '@tycoon/label-tycoon';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';
import { HitParade } from './graphiques/Graphiques';

const NOMS_NIVEAU: Record<string, string> = {
  or: 'Disque d’or',
  platine: 'Disque de platine',
  diamant: 'Disque de diamant',
};

/** Part (0-1) du chemin vers la prochaine certification. */
export const progressionCertification = (c: VueCertification): number =>
  c.prochain ? Math.min(1, Math.max(0, c.ventes / c.prochain.seuil)) : 1;

/** Classements de la semaine, certifications et historique des sorties du joueur. */
export function Classements() {
  const { vue } = useLabel();
  const [chart, setChart] = useState<'singles' | 'albums'>('singles');
  if (!vue) return null;
  const lignes = vue.classements[chart];
  const mes = vue.historiqueClassements.filter((h) => h.position !== null);

  return (
    <section className="label-screen" aria-labelledby="clas-titre">
      <h2 id="clas-titre">Classements</h2>
      <div className="label-time__speeds" role="group" aria-label="Classement affiché">
        <button
          type="button"
          className="label-time__btn"
          aria-pressed={chart === 'singles'}
          onClick={() => setChart('singles')}
        >
          Singles
        </button>
        <button
          type="button"
          className="label-time__btn"
          aria-pressed={chart === 'albums'}
          onClick={() => setChart('albums')}
        >
          Albums
        </button>
      </div>
      {lignes.length === 0 ? (
        <p className="label-screen__soon">
          Le classement s’établira à la fin de la première semaine.
        </p>
      ) : (
        <HitParade
          titre={`Top ${lignes.length} ${chart === 'singles' ? 'singles' : 'albums'} (écoutes de la semaine)`}
          lignes={lignes
            .slice(0, 20)
            .map((l) => ({ rang: l.rang, nom: l.nom, valeur: l.streams, joueur: l.joueur }))}
        />
      )}
      <h3>Tes sorties classées</h3>
      {mes.length === 0 ? (
        <p className="label-screen__soon">
          Aucune de tes sorties n’est au classement cette semaine.
        </p>
      ) : (
        <ul className="label-list">
          {mes.map((h) => (
            <li key={h.projetId}>
              <strong>{h.nom}</strong> — n° {h.position} (
              {h.classement === 'singles' ? 'singles' : 'albums'}) · meilleure place {h.meilleure} ·{' '}
              {h.semaines} sem. classée(s)
            </li>
          ))}
        </ul>
      )}
      <h3>
        <Terme id="certification">Certifications</Terme>
      </h3>
      {vue.certifications.length === 0 ? (
        <p className="label-screen__soon">Aucune sortie publiée pour l’instant.</p>
      ) : (
        <ul className="label-list">
          {vue.certifications.map((c) => (
            <li key={c.projetId}>
              {c.nom} — {c.niveau ? NOMS_NIVEAU[c.niveau] : 'pas encore certifié'} ·{' '}
              {c.ventes.toLocaleString('fr-FR')} ventes équivalentes
              {c.prochain ? (
                <>
                  {' '}
                  (prochain : {NOMS_NIVEAU[c.prochain.niveau]} à{' '}
                  {c.prochain.seuil.toLocaleString('fr-FR')})
                  <progress
                    max={1}
                    value={progressionCertification(c)}
                    aria-label={`Progression vers ${NOMS_NIVEAU[c.prochain.niveau]}`}
                  />
                </>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
