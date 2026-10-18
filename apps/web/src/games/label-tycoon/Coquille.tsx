import { useEffect, useState } from 'react';
import { ECRANS, type EcranId } from './ecrans';
import { useLabel } from './LabelContext';
import { ECRANS_SIMPLES } from './ecransSimples';
import { BandeauDefi } from './BandeauDefi';
import { Tutoriel } from './Tutoriel';
import { BandeauScenario } from './BandeauScenario';
import { BarreTemps } from './BarreTemps';
import { BoiteReception, notificationsNonLues } from './BoiteReception';
import { InfobulleCalcul, Terme } from './Infobulle';
import { FicheArtiste } from './FicheArtiste';
import { QG } from './QG';
import { Negociation } from './Negociation';
import { Reperage } from './Reperage';
import { Roster } from './Roster';
import { Studio } from './Studio';
import { NouvellePartie } from './NouvellePartie';
import { useRaccourcis } from './Raccourcis';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

function EcranSimple({ id }: { id: EcranId }) {
  const Ecran = ECRANS_SIMPLES[id];
  return Ecran ? <Ecran /> : <Placeholder id={id} />;
}

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
  const [dernierLu, setDernierLu] = useState(0);
  const [fiche, setFiche] = useState<number | null>(null);
  const [negociation, setNegociation] = useState<number | null>(null);
  useRaccourcis(setEcran, vue !== null);

  // Sur mobile la navigation défile : l'onglet actif reste visible.
  useEffect(() => {
    document
      .querySelector<HTMLElement>('.label-nav [aria-current="page"]')
      ?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
  }, [ecran, vue === null]);

  if (etat === 'chargement') return <p className="stage__loading">Chargement du moteur…</p>;
  if (etat === 'erreur')
    return (
      <p role="alert" className="label-error">
        {erreur ?? 'Le moteur du jeu n’a pas pu démarrer.'}
      </p>
    );
  if (!vue) return <NouvellePartie />;
  const ficheArtiste = vue.roster.find((a) => a.id === fiche) ?? null;
  const badges = vue.decisions.length + notificationsNonLues(vue.fil, dernierLu).length;

  return (
    <div className="label-shell">
      <header className="label-bar">
        <strong className="label-bar__name">{vue.label.nom}</strong>
        <span className="label-bar__tier">
          <Terme id="palier">{vue.label.palier}</Terme>
        </span>
        <span className="label-bar__date mono">
          An {vue.date.annee} · mois {vue.date.mois} · sem. {vue.date.semaineDuMois}
        </span>
        <span className="label-bar__cash mono" aria-label="Trésorerie">
          <Terme id="tresorerie">{eur(vue.finances.tresorerie)}</Terme>
        </span>
        <span className="label-bar__value mono">
          <InfobulleCalcul termes={vue.finances.termesValorisation} argent>
            Valeur {eur(vue.finances.valorisation)}
          </InfobulleCalcul>
        </span>
      </header>
      <BarreTemps />
      {vue.scenario ? <BandeauScenario scenario={vue.scenario} /> : null}
      {vue.defi ? <BandeauDefi defi={vue.defi} /> : null}
      <Tutoriel allerA={setEcran} />
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
            {e.id === 'boite' && badges > 0 ? (
              <span className="label-badge" aria-label={`${badges} à lire`}>
                {badges}
              </span>
            ) : null}
          </button>
        ))}
      </nav>
      {refus ? (
        <p role="status" className="label-refus">
          {refus}
        </p>
      ) : null}
      <main className="label-main">
        {ecran === 'qg' ? (
          <QG allerA={setEcran} />
        ) : ecran === 'roster' ? (
          ficheArtiste ? (
            <FicheArtiste artiste={ficheArtiste} retour={() => setFiche(null)} vers={setEcran} />
          ) : (
            <Roster ouvrir={setFiche} />
          )
        ) : ecran === 'studio' ? (
          <Studio />
        ) : ecran === 'reperage' ? (
          negociation !== null ? (
            <Negociation artisteId={negociation} retour={() => setNegociation(null)} />
          ) : (
            <Reperage onNegocier={setNegociation} />
          )
        ) : ecran === 'boite' ? (
          <BoiteReception dernierLu={dernierLu} onLu={setDernierLu} />
        ) : (
          <EcranSimple id={ecran} />
        )}
      </main>
    </div>
  );
}
