import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Disc3, Lock, LogOut, Menu, Save, Volume2, VolumeX, X } from 'lucide-react';
import { TIERS } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { ECRANS, POLES, poleDe, type EcranId, type PoleId } from './ecrans';
import { useAbonnement } from './offres';
import { enregistrerJour } from './serie';
import { useAudio, useAudioDuJeu } from './audio/useAudio';
import { ICONES_ECRANS, ICONES_POLES } from './icones';
import { Ceremonie, useCeremonie } from './Ceremonie';
import { BandeauPole } from './BandeauPole';
import { Chargement } from './Chargement';
import { Effets } from './Effets';
import { CourseClassement, useCourseClassement } from './Soirees';
import { Hud } from './Hud';
import { Notifications } from './Notifications';
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
  const [renouvellement, setRenouvellement] = useState<number | null>(null);
  const [pleinEcran, setPleinEcran] = useState(true);
  const [tiroir, setTiroir] = useState(false);
  const [panneauSauvegarde, setPanneauSauvegarde] = useState(false);
  // Dernier onglet visité de chaque pôle : un clic sur le pôle y revient.
  const [dernierOnglet, setDernierOnglet] = useState<Partial<Record<PoleId, EcranId>>>({});
  const etroit = useEcranEtroit();
  const contenu = useRef<HTMLDivElement>(null);
  const setEcran = useCallback((id: EcranId) => {
    setEcranBrut(id);
    setDernierOnglet((d) => ({ ...d, [poleDe(id).id]: id }));
    setTiroir(false);
    contenu.current?.scrollTo?.({ top: 0 });
  }, []);
  useRaccourcis(setEcran, vue !== null);
  const spectacle = useCeremonie(vue);
  useAudioDuJeu(vue);
  const course = useCourseClassement(vue);
  const audio = useAudio();
  const abonnement = useAbonnement();
  const enJeuVue = vue !== null;
  useEffect(() => {
    if (enJeuVue) enregistrerJour();
  }, [enJeuVue]);

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

  if (etat === 'chargement') return <Chargement />;
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
  const verrou = (e: (typeof ECRANS)[number] | undefined) =>
    e && 'palier' in e && rangPalier(e.palier) > rang
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
            {abonnement.offre !== 'gratuit' ? (
              <span className={`lt-badge-abo lt-badge-abo--${abonnement.offre}`}>
                {abonnement.offre === 'pro' ? 'PRO' : 'LÉGENDE'}
              </span>
            ) : null}
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
          {POLES.map((pole) => {
            const Icone = ICONES_POLES[pole.id];
            const actif = poleDe(ecran).id === pole.id;
            const ouverts = pole.ecrans.filter((id) => !verrou(ECRANS.find((e) => e.id === id)));
            const ferme = ouverts.length === 0;
            const cible = dernierOnglet[pole.id] ?? ouverts[0] ?? pole.ecrans[0];
            const index = ECRANS.findIndex((x) => x.id === pole.ecrans[0]);
            return (
              <button
                key={pole.id}
                type="button"
                className={`label-nav__item lt-nav__item${ferme ? ' is-verrouille' : ''}`}
                aria-current={actif ? 'page' : undefined}
                data-ecran={pole.ecrans.join(' ')}
                onClick={() => setEcran(cible)}
                title={pole.ecrans.map((id) => ECRANS.find((e) => e.id === id)?.titre).join(' · ')}
              >
                <Icone aria-hidden="true" size={22} strokeWidth={2.4} />
                <span className="lt-nav__nom">{pole.titre}</span>
                {ferme ? (
                  <span className="lt-nav__verrou">
                    <Lock aria-hidden="true" size={14} />
                    <span className="visually-hidden"> (verrouillé)</span>
                  </span>
                ) : null}
                {pole.id === 'boite' && badges > 0 ? (
                  <span className="label-badge" aria-label={`${badges} à lire`}>
                    {badges}
                  </span>
                ) : pole.ecrans.length === 1 && index < 9 ? (
                  <kbd className="lt-nav__touche" aria-hidden="true">
                    {index + 1}
                  </kbd>
                ) : null}
              </button>
            );
          })}
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
          <button
            type="button"
            className="lt-side__action"
            aria-pressed={audio.prefs.sons || audio.prefs.musique}
            onClick={() => {
              const actif = audio.prefs.sons || audio.prefs.musique;
              audio.regler({ sons: !actif, musique: !actif });
            }}
          >
            {audio.prefs.sons || audio.prefs.musique ? (
              <Volume2 aria-hidden="true" size={18} />
            ) : (
              <VolumeX aria-hidden="true" size={18} />
            )}{' '}
            {audio.prefs.sons || audio.prefs.musique ? 'Son activé' : 'Son coupé'}
          </button>
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
      <Notifications vue={vue} allerA={setEcran} />
      <Effets vue={vue} />
      {course.course ? (
        <CourseClassement
          nom={course.course.nom}
          position={course.course.position}
          lignes={course.course.lignes}
          fermer={course.fermer}
        />
      ) : null}
      {spectacle.ceremonie ? (
        <Ceremonie ceremonie={spectacle.ceremonie} fermer={spectacle.fermer} />
      ) : null}

      <div className="lt-contenu" ref={contenu}>
        {sauvegardes ? (
          <div className="lt-sauvegardes" hidden={!panneauSauvegarde}>
            {sauvegardes}
          </div>
        ) : null}
        {poleDe(ecran).ecrans.length > 1 ? (
          <BandeauPole pole={poleDe(ecran).id} titre={poleDe(ecran).titre} />
        ) : null}
        {poleDe(ecran).ecrans.length > 1 ? (
          <div className="lt-onglets-pole" role="tablist" aria-label={poleDe(ecran).titre}>
            {poleDe(ecran).ecrans.map((id) => {
              const e = ECRANS.find((x) => x.id === id);
              const Icone = ICONES_ECRANS[id];
              const ferme = verrou(e);
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={ecran === id}
                  className={`lt-onglet-pole${ferme ? ' is-verrouille' : ''}`}
                  data-ecran={id}
                  onClick={() => setEcran(id)}
                  title={e?.description}
                >
                  <Icone aria-hidden="true" size={20} strokeWidth={2.4} />
                  <span>{e?.titre}</span>
                  {ferme ? <Lock aria-hidden="true" size={14} /> : null}
                </button>
              );
            })}
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
        <main className="label-main lt-page" key={ecran}>
          {ecran === 'qg' ? (
            <QG
              allerA={setEcran}
              revoirCeremonie={spectacle.ouvrir}
              ouvrirFiche={(id) => {
                setFiche(id);
                setEcran('roster');
              }}
              negocier={(id) => {
                setNegociation(id);
                setEcran('reperage');
              }}
            />
          ) : ecran === 'roster' ? (
            renouvellement !== null ? (
              <Negociation
                artisteId={renouvellement}
                renouvellement
                retour={() => setRenouvellement(null)}
              />
            ) : ficheArtiste ? (
              <FicheArtiste
                artiste={ficheArtiste}
                retour={() => setFiche(null)}
                vers={setEcran}
                renouveler={() => setRenouvellement(ficheArtiste.id)}
              />
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
          {(['qg', 'artistes', 'production', 'boite'] as const).map((id) => {
            const pole = POLES.find((p) => p.id === id);
            if (!pole) return null;
            const Icone = ICONES_POLES[id];
            return (
              <button
                key={id}
                type="button"
                className="lt-onglet"
                data-ecran={pole.ecrans.join(' ')}
                aria-current={poleDe(ecran).id === id ? 'page' : undefined}
                onClick={() => setEcran(dernierOnglet[id] ?? pole.ecrans[0])}
              >
                <Icone aria-hidden="true" size={22} />
                <span>{pole.titre}</span>
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
