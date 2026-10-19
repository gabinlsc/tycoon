import type { LabelAction, VueBatiment } from '@tycoon/label-tycoon';
import {
  Briefcase,
  Coins,
  Disc3,
  Drum,
  Hammer,
  type LucideIcon,
  Mic2,
  Speaker,
} from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

const ICONES: Readonly<Record<string, LucideIcon>> = {
  studio: Mic2,
  repetition: Drum,
  bureaux: Briefcase,
  pressage: Disc3,
  concert: Speaker,
};

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
          const Icone = ICONES[b.id] ?? Mic2;
          return (
            <article key={b.id} className={`label-card lt-bat lt-bat--${b.id}`} aria-label={b.nom}>
              <header className="lt-bat__tete">
                <span className="lt-bat__icone" aria-hidden="true">
                  <Icone size={30} strokeWidth={2.4} />
                </span>
                <h3>{b.nom}</h3>
              </header>
              <span className="lt-bat__niveaux" aria-hidden="true">
                {Array.from({ length: b.niveauMax }, (_, i) => (
                  <span
                    key={i}
                    className={
                      i < b.niveau ? 'is-acquis' : b.travaux && i === b.niveau ? 'is-travaux' : ''
                    }
                  />
                ))}
              </span>
              <p>{b.effet}</p>
              <p>
                Niveau{' '}
                <strong className="mono">
                  {b.niveau} / {b.niveauMax}
                </strong>
                {b.entretien > 0 ? ` · entretien ${eur(b.entretien)} par semaine` : ''}
              </p>
              {b.coutSuivant !== null ? (
                <p className="lt-bat__prochain">
                  <span className="lt-chip">
                    <Coins aria-hidden="true" size={14} /> {eur(b.coutSuivant)}
                  </span>
                  <span className="lt-chip">
                    <Hammer aria-hidden="true" size={14} /> {b.semainesTravaux} semaines
                  </span>
                  <span className="visually-hidden">
                    Niveau suivant : {eur(b.coutSuivant)}, {b.semainesTravaux} semaines de travaux.
                  </span>
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
