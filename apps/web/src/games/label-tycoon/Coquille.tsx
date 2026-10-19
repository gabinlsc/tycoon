import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Disc3, Lock, LogOut, Menu, Save, X } from 'lucide-react';
import { TIERS } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { ECRANS, GROUPES, type EcranId } from './ecrans';
import { ICONES_ECRANS } from './icones';
import { Hud } from './Hud';
import { useEcranEtroit } from './useEcranEtroit';
import { useLabel } from './LabelContext';
import { ECRANS_SIMPLES } from './ecransSimples';
import { BandeauDefi } from './BandeauDefi';
import { Tutoriel } from './Tutoriel';
import { BandeauScenario } from './BandeauScenario';
import { BoiteReception, notificationsNonLues } from './BoiteReception';
import { FicheArtiste } from './FicheArtiste';
import { QG } from './QG';
import { Negociation } from './Negociation';
import { Reperage } from './Reperage';
import { Roster } from './Roster';
import { Studio } from './Studio';
import { NouvellePartie } from './NouvellePartie';
import { useRaccourcis } from './Raccourcis';

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

/** Rang d'un palier (0 = home-studio), pour savoir si un écran est encore verrouillé. */
const rangPalier = (id: string): number => TIERS.findIndex((t) => t.id === id);

/**
 * Cadre du jeu, plein écran façon jeu vidéo : barre latérale groupée (tiroir sur mobile), HUD en
 * haut, contenu au centre, barre d'onglets en bas sur petit écran.
 */
export function Coquille({ sauvegardes }: { sauvegardes?: ReactNode } = {}) {
  const { etat, vue, erreur, refus } = useLabel();
  const [ecran, setEcranBrut] = useState<EcranId>('qg');
  const [dernierLu, setDernierLu] = useState(0);
  const [fiche, setFiche] = useState<number | null>(null);
  const [negociation, setNegociation] = useState<number | null>(null);
  const [pleinEcran, setPleinEcran] = useState(true);
  const [tiroir, setTiroir] = useState(false);
  const [panneauSauvegarde, setPanneauSauvegarde] = useState(false);
  const etroit = useEcranEtroit();
  const contenu = useRef<HTMLDivElement>(null);
  const setEcran = useCallback((id: EcranId) => {
    setEcranBrut(id);
    setTiroir(false);
    contenu.current?.scrollTo?.({ top: 0 });
  }, []);
  useRaccourcis(setEcran, vue !== null);

  // L'écran actif reste visible dans la navigation (longue liste, tiroir sur mobile).
  useEffect(() => {
    document
      .querySelector<HTMLElement>('.label-nav [aria-current="page"]')
      ?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
  }, [ecran, vue === null]);

  const enJeu = vue !== null && pleinEcran;
  // Plein écran : la page du portail ne défile plus derrière le jeu.
  useEffect(() => {
    if (!enJeu) return;
    document.documentElement.classList.add('lt-verrou');
    return () => document.documentElement.classList.remove('lt-verrou');
  }, [enJeu]);

  if (etat === 'chargement') return <p className="stage__loading">Chargement du moteur…</p>;
  if (etat === 'erreur')
    return (
      <p role="alert" className="label-error">
        {erreur ?? 'Le moteur du jeu n’a pas pu démarrer.'}
      </p>
    );
  if (!vue)
    return (
      <>
        {sauvegardes}
        <NouvellePartie />
      </>
    );

  if (!pleinEcran)
    return (
      <div className="lt-reprendre card">
        <Disc3 aria-hidden="true" size={40} />
        <p>
          Partie en cours : <strong>{vue.label.nom}</strong> · {vue.label.palier} · an{' '}
          {vue.date.annee}
        </p>
        <Button type="button" tone="green" size="lg" onClick={() => setPleinEcran(true)}>
          Reprendre la partie
        </Button>
        {sauvegardes}
      </div>
    );

  const ficheArtiste = vue.roster.find((a) => a.id === fiche) ?? null;
  const badges = vue.decisions.length + notificationsNonLues(vue.fil, dernierLu).length;
  const rang = rangPalier(vue.label.palierId);
  const verrou = (e: (typeof ECRANS)[number]) =>
    'palier' in e && rangPalier(e.palier) > rang
      ? (TIERS.find((t) => t.id === e.palier)?.id ?? null)
      : null;

  // Rendu dans <body> : un ancêtre transformé (animations de la page) casserait `position: fixed`.
  return createPortal(
    <div className={`lt-app${tiroir ? ' is-tiroir-ouvert' : ''}`}>
      <aside className="lt-side" id="lt-menu">
        <div className="lt-side__marque">
          <span className="lt-logo" aria-hidden="true">
            <Disc3 size={30} strokeWidth={2.5} />
          </span>
          <div>
            <strong className="label-bar__name">{vue.label.nom}</strong>
            <span className="label-bar__tier lt-palier">{vue.label.palier}</span>
          </div>
          {etroit ? (
            <button
              type="button"
              className="lt-side__fermer"
              onClick={() => setTiroir(false)}
              aria-label="Fermer le menu"
            >
              <X aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <nav className="label-nav lt-nav" aria-label="Écrans du jeu">
          {GROUPES.map((g) => (
            <div key={g.id} className="lt-nav__groupe">
              <p className="lt-nav__titre" aria-hidden="true">
                {g.titre}
              </p>
              {ECRANS.filter((e) => e.groupe === g.id).map((e) => {
                const Icone = ICONES_ECRANS[e.id];
                const index = ECRANS.findIndex((x) => x.id === e.id);
                const ferme = verrou(e);
                return (
                  <button
                    key={e.id}
                    type="button"
                    className={`label-nav__item lt-nav__item${ferme ? ' is-verrouille' : ''}`}
                    aria-current={ecran === e.id ? 'page' : undefined}
                    data-ecran={e.id}
                    onClick={() => setEcran(e.id)}
                    title={`${e.description}${index < 9 ? ` (touche ${index + 1})` : ''}`}
                  >
                    <Icone aria-hidden="true" size={20} strokeWidth={2.4} />
                    <span className="lt-nav__nom">{e.titre}</span>
                    {ferme ? (
                      <span className="lt-nav__verrou">
                        <Lock aria-hidden="true" size={14} />
                        <span className="visually-hidden"> (verrouillé)</span>
                      </span>
                    ) : null}
                    {e.id === 'boite' && badges > 0 ? (
                      <span className="label-badge" aria-label={`${badges} à lire`}>
                        {badges}
                      </span>
                    ) : index < 9 ? (
                      <kbd className="lt-nav__touche" aria-hidden="true">
                        {index + 1}
                      </kbd>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="lt-side__pied">
          {sauvegardes ? (
            <button
              type="button"
              className="lt-side__action"
              aria-expanded={panneauSauvegarde}
              onClick={() => setPanneauSauvegarde((o) => !o)}
            >
              <Save aria-hidden="true" size={18} /> Sauvegardes
            </button>
          ) : null}
          <button type="button" className="lt-side__action" onClick={() => setPleinEcran(false)}>
            <LogOut aria-hidden="true" size={18} /> Quitter le jeu
          </button>
        </div>
      </aside>
      {tiroir ? (
        <button
          type="button"
          className="lt-voile"
          aria-label="Fermer le menu"
          onClick={() => setTiroir(false)}
        />
      ) : null}

      <Hud />

      <div className="lt-contenu" ref={contenu}>
        {sauvegardes ? (
          <div className="lt-sauvegardes" hidden={!panneauSauvegarde}>
            {sauvegardes}
          </div>
        ) : null}
        {vue.scenario ? <BandeauScenario scenario={vue.scenario} /> : null}
        {vue.defi ? <BandeauDefi defi={vue.defi} /> : null}
        <Tutoriel allerA={setEcran} ecran={ecran} />
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
              <Roster ouvrir={setFiche} allerA={setEcran} />
            )
          ) : ecran === 'studio' ? (
            <Studio allerA={setEcran} />
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

      {etroit ? (
        <nav className="lt-onglets" aria-label="Accès rapide">
          {(['qg', 'roster', 'reperage', 'studio'] as const).map((id) => {
            const Icone = ICONES_ECRANS[id];
            const e = ECRANS.find((x) => x.id === id);
            return (
              <button
                key={id}
                type="button"
                className="lt-onglet"
                data-ecran={id}
                aria-current={ecran === id ? 'page' : undefined}
                onClick={() => setEcran(id)}
              >
                <Icone aria-hidden="true" size={22} />
                <span>{e?.titre}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="lt-onglet"
            aria-expanded={tiroir}
            aria-controls="lt-menu"
            onClick={() => setTiroir(true)}
          >
            <Menu aria-hidden="true" size={22} />
            <span>Menu{badges > 0 ? ` (${badges})` : ''}</span>
          </button>
        </nav>
      ) : null}
    </div>,
    document.body,
  );
}
