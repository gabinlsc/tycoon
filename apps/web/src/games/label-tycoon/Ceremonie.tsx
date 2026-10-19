import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import type { VueCategorieCeremonie, VueCeremonie, VueJeu } from '@tycoon/label-tycoon';
import { Crown, Mail, Sparkles, X } from 'lucide-react';
import { Avatar } from './avatar';

const CLE = 'tycoon:label:ceremonies-vues';

function dejaVues(): string[] {
  try {
    const brut = window.localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

function marquerVue(cle: string): void {
  try {
    window.localStorage.setItem(CLE, JSON.stringify([...dejaVues().slice(-19), cle]));
  } catch {
    /* stockage indisponible : la cérémonie ne se rejouera pas pendant la session */
  }
}

/**
 * La cérémonie s'ouvre d'elle-même le soir de la remise des prix, une seule fois par année et par
 * label ; on peut la revoir ensuite depuis le QG.
 */
export function useCeremonie(vue: VueJeu | null) {
  const [ouverte, setOuverte] = useState(false);
  const c = vue?.ceremonie ?? null;
  const cle = c && vue ? `${vue.label.nom}:${c.annee}` : null;
  const resultats = c?.phase === 'resultats';

  useEffect(() => {
    if (!cle || !resultats || dejaVues().includes(cle)) return;
    marquerVue(cle);
    setOuverte(true);
  }, [cle, resultats]);

  const ouvrir = useCallback(() => setOuverte(true), []);
  const fermer = useCallback(() => setOuverte(false), []);
  return { ceremonie: ouverte && resultats ? c : null, ouvrir, fermer };
}

const COULEURS_CONFETTIS = ['#ffd23f', '#ff5ca8', '#5ad1ff', '#7cff6b', '#ffffff', '#ff8a3d'];

/** Pluie de confettis en CSS : positions fixées par l'index, rien d'aléatoire. */
export function Confettis({ nombre = 48 }: { nombre?: number }) {
  return (
    <div className="lt-confettis" aria-hidden="true">
      {Array.from({ length: nombre }, (_, i) => (
        <span
          key={i}
          style={
            {
              '--x': `${(i * 37) % 100}%`,
              '--d': `${((i * 13) % 20) / 10}s`,
              '--r': `${(i * 47) % 360}deg`,
              '--c': COULEURS_CONFETTIS[i % COULEURS_CONFETTIS.length],
              '--t': `${2.6 + ((i * 7) % 10) / 10}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Trophée en coupe, doré ou en silhouette quand il n'est pas gagné. */
export function Trophee({ or = true, taille = 96 }: { or?: boolean; taille?: number }) {
  const id = or ? 'lt-trophee-or' : 'lt-trophee-gris';
  return (
    <svg
      className={`lt-trophee${or ? ' is-or' : ''}`}
      width={taille}
      height={taille}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={or ? '#fff3b0' : '#c9c3d9'} />
          <stop offset="0.45" stopColor={or ? '#ffc93c' : '#8d86a3'} />
          <stop offset="1" stopColor={or ? '#c27a00' : '#5a5470'} />
        </linearGradient>
      </defs>
      <path
        d="M18 8h28v10c0 9-6 16-14 16s-14-7-14-16z"
        fill={`url(#${id})`}
        stroke="#1b0f3a"
        strokeWidth="2.5"
      />
      <path
        d="M18 12H9c0 8 4 13 11 14M46 12h9c0 8-4 13-11 14"
        fill="none"
        stroke="#1b0f3a"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M28 34h8v8h-8z" fill={`url(#${id})`} stroke="#1b0f3a" strokeWidth="2.5" />
      <path
        d="M20 42h24l3 10H17z"
        fill={`url(#${id})`}
        stroke="#1b0f3a"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <rect x="14" y="52" width="36" height="6" rx="2" fill="#1b0f3a" />
      {or ? <path d="M25 12c0 6 2 11 6 13" stroke="#fff" strokeWidth="2.5" fill="none" /> : null}
    </svg>
  );
}

function Nommes({ categorie, revele }: { categorie: VueCategorieCeremonie; revele: boolean }) {
  return (
    <ul className={`lt-cer__nommes${revele ? ' is-revele' : ''}`}>
      {categorie.nommes.map((n, i) => (
        <li
          key={n.ref}
          className={`lt-cer__nomme${n.joueur ? ' is-joueur' : ''}${revele && n.gagnant ? ' is-gagnant' : ''}`}
          style={{ '--i': i } as CSSProperties}
        >
          {n.joueur ? <span className="lt-cer__ruban">Ton label</span> : null}
          <Avatar nom={n.nom} genre={n.genre || n.nom} taille="lg" />
          <strong>{n.nom}</strong>
          {n.detail ? <small>{n.detail}</small> : null}
          {revele && n.gagnant ? <Trophee taille={44} /> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * Cérémonie des Trophées en plein écran : rideau, projecteurs, une catégorie à la fois,
 * l'enveloppe qu'on ouvre, puis le palmarès du label.
 */
export function Ceremonie({ ceremonie, fermer }: { ceremonie: VueCeremonie; fermer: () => void }) {
  const [etape, setEtape] = useState(0);
  const [revele, setRevele] = useState(false);
  const principal = useRef<HTMLButtonElement>(null);
  const total = ceremonie.categories.length;
  const categorie = etape >= 1 && etape <= total ? ceremonie.categories[etape - 1] : undefined;
  const final = etape > total;

  useEffect(() => {
    principal.current?.focus();
  }, [etape, revele]);

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [fermer]);

  const suivant = () => {
    setRevele(false);
    setEtape((e) => e + 1);
  };
  const gagnant = categorie?.nommes.find((n) => n.gagnant);
  const fete = (revele && gagnant?.joueur === true) || (final && ceremonie.prixDuJoueur > 0);

  return (
    <div className="lt-cer" role="dialog" aria-modal="true" aria-labelledby="cer-titre">
      <div className="lt-cer__projos" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="lt-cer__rideau lt-cer__rideau--g" aria-hidden="true" />
      <div className="lt-cer__rideau lt-cer__rideau--d" aria-hidden="true" />
      {fete ? <Confettis key={etape} /> : null}

      <header className="lt-cer__barre">
        <span className="lt-cer__marque">
          <Sparkles aria-hidden="true" size={18} /> Les Trophées · An {ceremonie.annee}
        </span>
        {final ? null : (
          <button
            type="button"
            className="lt-cer__passer"
            onClick={fermer}
            aria-label="Passer la cérémonie"
          >
            Passer <span className="lt-cer__passer-texte">la cérémonie</span>
            <X aria-hidden="true" size={18} />
          </button>
        )}
      </header>

      <div className="lt-cer__scene" key={`${etape}-${revele ? 'r' : 'n'}`}>
        {etape === 0 ? (
          <>
            <Trophee taille={150} />
            <p className="lt-cer__surtitre">Ce soir, sur le tapis rouge</p>
            <h2 id="cer-titre" className="lt-cer__titre">
              Les Trophées de la musique
            </h2>
            <p className="lt-cer__sous">
              {ceremonie.nominationsDuJoueur > 0
                ? `Ton label est nommé ${ceremonie.nominationsDuJoueur} fois. Croise les doigts.`
                : 'Ton label n’est pas nommé cette année. Observe la concurrence.'}
            </p>
            <button ref={principal} type="button" className="lt-cer__go" onClick={suivant}>
              Lever le rideau
            </button>
          </>
        ) : categorie ? (
          <>
            <p className="lt-cer__surtitre">
              Catégorie {etape} sur {total}
            </p>
            <h2 id="cer-titre" className="lt-cer__titre">
              {categorie.nom}
            </h2>
            <Nommes categorie={categorie} revele={revele} />
            {revele ? (
              <>
                <p className="lt-cer__annonce" role="status">
                  {gagnant
                    ? gagnant.joueur
                      ? `${gagnant.nom} l’emporte. Le trophée est pour ton label !`
                      : `${gagnant.nom} l’emporte.`
                    : 'Le jury n’a pas décerné ce prix.'}
                </p>
                <button ref={principal} type="button" className="lt-cer__go" onClick={suivant}>
                  {etape === total ? 'Voir le palmarès' : 'Catégorie suivante'}
                </button>
              </>
            ) : (
              <>
                <p className="lt-cer__suspense">Et le trophée est attribué à…</p>
                <button
                  ref={principal}
                  type="button"
                  className="lt-cer__go lt-cer__go--enveloppe"
                  onClick={() => setRevele(true)}
                >
                  <Mail aria-hidden="true" size={22} /> Ouvrir l’enveloppe
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="lt-cer__surtitre">Palmarès de ton label</p>
            <h2 id="cer-titre" className="lt-cer__titre">
              {ceremonie.prixDuJoueur > 0
                ? `${ceremonie.prixDuJoueur} trophée${ceremonie.prixDuJoueur > 1 ? 's' : ''} !`
                : 'Pas de trophée cette année'}
            </h2>
            <ul className="lt-cer__vitrine">
              {ceremonie.categories.map((c) => {
                const gagne = c.nommes.some((n) => n.joueur && n.gagnant);
                return (
                  <li key={c.id} className={gagne ? 'is-gagne' : ''}>
                    <Trophee or={gagne} taille={72} />
                    <span>{c.nom}</span>
                    <span className="visually-hidden">{gagne ? ' : gagné' : ' : non gagné'}</span>
                  </li>
                );
              })}
            </ul>
            {ceremonie.labelDeLAnnee ? (
              <p className="lt-cer__couronne">
                <Crown aria-hidden="true" size={34} /> Label de l’année
              </p>
            ) : null}
            <p className="lt-cer__sous">
              {ceremonie.prixDuJoueur > 0
                ? 'Ta réputation grimpe et tes artistes primés font le buzz.'
                : ceremonie.labelDeLAnnee
                  ? 'Sans trophée, mais la profession salue ton label.'
                  : 'Sors de meilleurs projets pour être nommé l’an prochain.'}
            </p>
            <button ref={principal} type="button" className="lt-cer__go" onClick={fermer}>
              Retour au label
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Bandeau du QG : le tapis rouge pendant les nominations, le palmarès une fois les prix remis. */
export function TapisRouge({
  ceremonie,
  semaine,
  revoir,
}: {
  ceremonie: VueCeremonie;
  semaine: number;
  revoir?: (() => void) | undefined;
}) {
  const nommes = ceremonie.categories.flatMap((c) =>
    c.nommes.filter((n) => n.joueur).map((n) => ({ ...n, categorie: c.nom })),
  );
  const restantes = Math.max(0, ceremonie.semaineRemise - semaine);
  return (
    <section className="lt-tapis" aria-labelledby="tapis-titre">
      <Trophee or={ceremonie.phase === 'nominations' || ceremonie.prixDuJoueur > 0} taille={72} />
      <div className="lt-tapis__texte">
        <p className="lt-tapis__surtitre">Les Trophées · An {ceremonie.annee}</p>
        <h2 id="tapis-titre">
          {ceremonie.phase === 'nominations'
            ? nommes.length > 0
              ? `${nommes.length} nomination${nommes.length > 1 ? 's' : ''} pour ton label`
              : 'Les nominations sont tombées'
            : ceremonie.prixDuJoueur > 0
              ? `${ceremonie.prixDuJoueur} trophée${ceremonie.prixDuJoueur > 1 ? 's' : ''} remporté${ceremonie.prixDuJoueur > 1 ? 's' : ''}`
              : 'La cérémonie est passée'}
        </h2>
        <p>
          {ceremonie.phase === 'nominations'
            ? restantes > 0
              ? `Remise des prix dans ${restantes} semaine${restantes > 1 ? 's' : ''}.`
              : 'Remise des prix cette semaine.'
            : ceremonie.labelDeLAnnee
              ? 'Et ton label est sacré label de l’année.'
              : 'Rendez-vous l’an prochain sur le tapis rouge.'}
        </p>
      </div>
      {nommes.length > 0 ? (
        <ul className="lt-tapis__nommes" aria-label="Tes nommés">
          {nommes.slice(0, 4).map((n) => (
            <li key={`${n.categorie}-${n.ref}`} title={`${n.nom} · ${n.categorie}`}>
              <Avatar nom={n.nom} genre={n.genre || n.nom} />
              <span className="visually-hidden">
                {n.nom}, {n.categorie}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {ceremonie.phase === 'resultats' && revoir ? (
        <button type="button" className="lt-tapis__revoir" onClick={revoir}>
          <Sparkles aria-hidden="true" size={18} /> Revoir la cérémonie
        </button>
      ) : null}
    </section>
  );
}
