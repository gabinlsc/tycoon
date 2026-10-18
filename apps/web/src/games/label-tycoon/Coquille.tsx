import { useState } from 'react';
import { ECRANS, type EcranId } from './ecrans';
import { useLabel } from './LabelContext';
import { NouvellePartie } from './NouvellePartie';
import { useRaccourcis } from './Raccourcis';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

function Placeholder({ id }: { id: EcranId }) {
  const ecran = ECRANS.find((e) => e.id === id);
  return (
    <section className="label-screen" aria-labelledby="ecran-titre">
      <h2 id="ecran-titre">{ecran?.titre}</h2>
      <p>{ecran?.description}</p>
      <p className="label-screen__soon">Cet écran arrive bientôt.</p>
    </section>
  );
}

/** Cadre du jeu : bandeau d'état, navigation entre écrans, zone de contenu. */
export function Coquille() {
  const { etat, vue, erreur, refus } = useLabel();
  const [ecran, setEcran] = useState<EcranId>('qg');
  useRaccourcis(setEcran, vue !== null);

  if (etat === 'chargement') return <p className="stage__loading">Chargement du moteur…</p>;
  if (etat === 'erreur')
    return (
      <p role="alert" className="label-error">
        {erreur ?? 'Le moteur du jeu n’a pas pu démarrer.'}
      </p>
    );
  if (!vue) return <NouvellePartie />;

  return (
    <div className="label-shell">
      <header className="label-bar">
        <strong className="label-bar__name">{vue.label.nom}</strong>
        <span className="label-bar__tier">{vue.label.palier}</span>
        <span className="label-bar__date mono">
          An {vue.date.annee} · mois {vue.date.mois} · sem. {vue.date.semaineDuMois}
        </span>
        <span className="label-bar__cash mono" aria-label="Trésorerie">
          {eur(vue.finances.tresorerie)}
        </span>
      </header>
      <nav className="label-nav" aria-label="Écrans du jeu">
        {ECRANS.map((e, index) => (
          <button
            key={e.id}
            type="button"
            className="label-nav__item"
            aria-current={ecran === e.id ? 'page' : undefined}
            onClick={() => setEcran(e.id)}
            title={`${e.description} (touche ${index + 1})`}
          >
            <span className="label-nav__key mono" aria-hidden="true">
              {index + 1}
            </span>
            {e.titre}
          </button>
        ))}
      </nav>
      {refus ? (
        <p role="status" className="label-refus">
          {refus}
        </p>
      ) : null}
      <main className="label-main">
        <Placeholder id={ecran} />
      </main>
    </div>
  );
}
