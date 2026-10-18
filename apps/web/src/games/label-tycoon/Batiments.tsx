import type { LabelAction, VueBatiment } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Raison pour laquelle on ne peut pas construire le niveau suivant, ou `null` si c'est possible. */
export function raisonBlocage(b: VueBatiment, tresorerie: number): string | null {
  if (b.travaux) return `Travaux en cours jusqu’à la semaine ${b.travaux.fin}.`;
  if (b.coutSuivant === null) return 'Niveau maximal atteint.';
  if (!b.palierAtteint) return `Palier ${b.palierRequis} requis.`;
  if (tresorerie < b.coutSuivant) return 'Trésorerie insuffisante.';
  return null;
}

/** Bâtiments du label : niveaux, travaux en cours, entretien et construction du niveau suivant. */
export function Batiments() {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const entretien = vue.batiments.reduce((somme, b) => somme + b.entretien, 0);
  return (
    <section className="label-screen" aria-labelledby="batiments-titre">
      <h2 id="batiments-titre">Bâtiments</h2>
      <p>
        Entretien hebdomadaire des niveaux au-delà du départ :{' '}
        <strong className="mono">{eur(entretien)}</strong>.
      </p>
      <div className="label-cards">
        {vue.batiments.map((b) => {
          const blocage = raisonBlocage(b, vue.finances.tresorerie);
          return (
            <article key={b.id} className="label-card" aria-label={b.nom}>
              <h3>{b.nom}</h3>
              <p>{b.effet}</p>
              <p>
                Niveau{' '}
                <strong className="mono">
                  {b.niveau} / {b.niveauMax}
                </strong>
                {b.entretien > 0 ? ` · entretien ${eur(b.entretien)} par semaine` : ''}
              </p>
              {b.coutSuivant !== null ? (
                <p>
                  Niveau suivant : {eur(b.coutSuivant)}, {b.semainesTravaux} semaines de travaux.
                </p>
              ) : null}
              <Button
                type="button"
                tone="gold"
                disabled={blocage !== null}
                onClick={() =>
                  void envoyer({
                    type: 'action',
                    action: {
                      type: 'construire',
                      batiment: b.id as Extract<LabelAction, { type: 'construire' }>['batiment'],
                    },
                  })
                }
              >
                Construire : {b.nom}
              </Button>
              {blocage ? <p className="label-screen__soon">{blocage}</p> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
