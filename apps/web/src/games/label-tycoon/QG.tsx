import type { VueJeu } from '@tycoon/label-tycoon';
import { OBJECTIF_TEXTES } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import type { EcranId } from './ecrans';
import { GraphCourbe } from './graphiques/Graphiques';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

export interface Alerte {
  id: string;
  niveau: 'danger' | 'info';
  texte: string;
  ecran?: EcranId;
}

/** Alertes du tableau de bord « par exceptions » : seulement ce qui demande de l'attention. */
export function alertes(vue: VueJeu): Alerte[] {
  const out: Alerte[] = [];
  if (vue.finances.faillite)
    out.push({ id: 'faillite', niveau: 'danger', texte: 'Faillite : la partie est terminée.' });
  else if (vue.finances.semainesNegatives > 0)
    out.push({
      id: 'tresorerie',
      niveau: 'danger',
      texte: `Trésorerie négative depuis ${vue.finances.semainesNegatives} semaine(s) : la faillite menace à 8.`,
    });
  if (vue.decisions.length > 0)
    out.push({
      id: 'decisions',
      niveau: 'info',
      texte: `${vue.decisions.length} décision(s) en attente.`,
      ecran: 'boite',
    });
  for (const e of vue.echeances)
    if (e.type === 'contrat' && e.semaine - vue.semaine <= 4)
      out.push({
        id: `contrat-${e.artisteId}`,
        niveau: 'info',
        texte: `Le contrat de ${e.nom} arrive à terme (semaine ${e.semaine}).`,
        ecran: 'roster',
      });
  return out;
}

export const progressionObjectif = (o: VueJeu['objectifs'][number]): number => {
  if (o.kind === 'tresorerie') return Math.min(1, Math.max(0, o.progression / o.cible));
  return Math.min(1, Math.max(0, (o.progression - o.base) / o.cible));
};

/** Tableau de bord : trésorerie, alertes, échéances, objectifs, dernières actus. */
export function QG({ allerA }: { allerA: (ecran: EcranId) => void }) {
  const { vue } = useLabel();
  if (!vue) return null;
  const liste = alertes(vue);
  const points = vue.historiqueTresorerie.map((c) => Math.round(c / 100));

  return (
    <div className="label-qg">
      <section className="label-screen label-qg__alerts" aria-labelledby="qg-alertes">
        <h2 id="qg-alertes">Alertes</h2>
        {liste.length === 0 ? (
          <p className="label-screen__soon">Tout est calme. Aucune alerte.</p>
        ) : (
          <ul className="label-alerts">
            {liste.map((a) => (
              <li key={a.id} className={`label-alert label-alert--${a.niveau}`}>
                {a.texte}
                {a.ecran ? (
                  <Button type="button" tone="ghost" onClick={() => allerA(a.ecran as EcranId)}>
                    Voir
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="label-screen" aria-labelledby="qg-finances">
        <h2 id="qg-finances">Finances</h2>
        <p className="label-qg__big mono">
          <Terme id="tresorerie">{eur(vue.finances.tresorerie)}</Terme>
        </p>
        {points.length >= 2 ? (
          <GraphCourbe
            titre="Trésorerie des dernières semaines (en euros)"
            etiquettes={points.map((_, i) => `S${vue.semaine - points.length + i + 1}`)}
            series={[{ nom: 'Trésorerie', valeurs: points }]}
            aire
          />
        ) : (
          <p className="label-screen__soon">La courbe apparaîtra après quelques semaines.</p>
        )}
        {vue.rapport ? (
          <p>
            Dernier mois : {vue.rapport.net >= 0 ? '+' : ''}
            {eur(vue.rapport.net)} · {vue.rapport.reussites} réussite(s), {vue.rapport.echecs}{' '}
            échec(s).
          </p>
        ) : null}
      </section>

      <section className="label-screen" aria-labelledby="qg-echeances">
        <h2 id="qg-echeances">Échéances</h2>
        {vue.echeances.length === 0 ? (
          <p className="label-screen__soon">Rien de prévu.</p>
        ) : (
          <ul className="label-list">
            {vue.echeances.map((e) => (
              <li key={`${e.type}-${e.artisteId}-${e.semaine}`}>
                <span className="mono">sem. {e.semaine}</span> —{' '}
                {e.type === 'projet' ? 'Sortie de' : 'Fin de contrat de'} {e.nom}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="label-screen" aria-labelledby="qg-objectifs">
        <h2 id="qg-objectifs">Objectifs</h2>
        <ul className="label-list">
          {vue.objectifs.map((o) => (
            <li key={o.id}>
              {OBJECTIF_TEXTES[o.kind as keyof typeof OBJECTIF_TEXTES] ?? o.kind}
              <progress
                max={1}
                value={progressionObjectif(o)}
                aria-label={`Progression : ${OBJECTIF_TEXTES[o.kind as keyof typeof OBJECTIF_TEXTES] ?? o.kind}`}
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="label-screen" aria-labelledby="qg-actus">
        <h2 id="qg-actus">Dernières actus</h2>
        {vue.fil.length === 0 ? (
          <p className="label-screen__soon">Le Fil se remplira au fil des semaines.</p>
        ) : (
          <ul className="label-list">
            {vue.fil.slice(0, 5).map((a) => (
              <li key={a.id}>
                <strong>{a.titre}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
