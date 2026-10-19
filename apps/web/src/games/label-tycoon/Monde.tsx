import { type CSSProperties, useEffect, useRef, useState } from 'react';
import type { VueJeu } from '@tycoon/label-tycoon';
import { Briefcase, Disc3, Flame, Inbox, Radar, X } from 'lucide-react';
import { calculerSerie, dateDuJour, lireJours } from './serie';
import { Batiments } from './Batiments';
import { Immeuble, type CibleMonde } from './Immeuble';
import { Personnel } from './Personnel';
import { Reperage } from './Reperage';
import { Roster } from './Roster';
import { Studio } from './Studio';
import { Tournees } from './Tournees';
import type { EcranId } from './ecrans';
import { useAbonnement } from './offres';

/** Palette du ciel selon la saison (mois 1 à 12) : le monde change au fil de l'année. */
export function saisonDuMois(mois: number): 'hiver' | 'printemps' | 'ete' | 'automne' {
  if (mois <= 2 || mois === 12) return 'hiver';
  if (mois <= 5) return 'printemps';
  if (mois <= 8) return 'ete';
  return 'automne';
}

const TITRES: Record<CibleMonde, string> = {
  studio: 'Studio',
  bureaux: 'Bureaux',
  repetition: 'Salle de répétition',
  pressage: 'Usine de pressage',
  concert: 'Salle de concert',
  roster: 'Tes artistes',
  reperage: 'Repérage',
};

/** Tours des labels rivaux dans la ville : hauteur proportionnelle à leur valorisation. */
export function toursRivales(
  rivaux: VueJeu['concurrence']['rivaux'],
  nombre = 4,
): { id: number | string; nom: string; hauteur: number }[] {
  const tries = [...rivaux].sort((a, b) => b.valorisation - a.valorisation).slice(0, nombre);
  const max = Math.max(1, ...tries.map((r) => r.valorisation));
  return tries.map((r) => ({
    id: r.id,
    nom: r.nom,
    hauteur: 38 + Math.round((r.valorisation / max) * 52),
  }));
}

function Contenu({
  cible,
  fermer,
  allerA,
  ouvrirFiche,
  negocier,
}: {
  cible: CibleMonde;
  fermer: () => void;
  allerA: (ecran: EcranId) => void;
  ouvrirFiche: (id: number) => void;
  negocier: (id: number) => void;
}) {
  const vers = (e: EcranId) => {
    fermer();
    allerA(e);
  };
  switch (cible) {
    case 'studio':
      return <Studio allerA={vers} />;
    case 'bureaux':
      return <Personnel />;
    case 'repetition':
    case 'pressage':
      return <Batiments />;
    case 'concert':
      return <Tournees />;
    case 'roster':
      return (
        <Roster
          ouvrir={(id) => {
            fermer();
            ouvrirFiche(id);
          }}
          allerA={vers}
        />
      );
    case 'reperage':
      return (
        <Reperage
          onNegocier={(id) => {
            fermer();
            negocier(id);
          }}
        />
      );
  }
}

/**
 * Le monde du label : la ville au fil des saisons, les tours des rivaux, ton immeuble au centre.
 * Un clic sur un étage, la porte ou le panneau « dénicher » ouvre l'écran correspondant dans un
 * tiroir, sans quitter la scène.
 */
export function Monde({
  vue,
  allerA,
  ouvrirFiche,
  negocier,
}: {
  vue: VueJeu;
  allerA: (ecran: EcranId) => void;
  ouvrirFiche: (id: number) => void;
  negocier: (id: number) => void;
}) {
  const [cible, setCible] = useState<CibleMonde | null>(null);
  const fermeture = useRef<HTMLButtonElement>(null);
  const tours = toursRivales(vue.concurrence.rivaux);
  const saison = saisonDuMois(vue.date.mois);
  const { theme } = useAbonnement();

  useEffect(() => {
    if (!cible) return;
    fermeture.current?.focus();
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCible(null);
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [cible]);

  const decisions = vue.decisions.length;
  const serie = calculerSerie(lireJours(), dateDuJour());

  return (
    <section
      className={`lt-monde lt-monde--${saison} lt-monde--theme-${theme}${cible ? ' a-tiroir' : ''}`}
      aria-label="Le monde du label"
    >
      <div className="lt-monde__ciel" aria-hidden="true">
        <span className="lt-nuage lt-nuage--1" />
        <span className="lt-nuage lt-nuage--2" />
        <span className="lt-nuage lt-nuage--3" />
        <ul className="lt-monde__tours">
          {tours.map((t, i) => (
            <li key={t.id} style={{ '--h': `${t.hauteur}%`, '--i': i } as CSSProperties}>
              <span className="lt-tour__nom">{t.nom}</span>
            </li>
          ))}
        </ul>
        <span className="lt-voiture" />
      </div>

      <div className="lt-monde__scene">
        <Immeuble vue={vue} allerA={allerA} ouvrir={setCible} />
      </div>

      <div className="lt-monde__enseignes">
        <button
          type="button"
          className="lt-enseigne lt-enseigne--reperer"
          onClick={() => setCible('reperage')}
        >
          <Radar aria-hidden="true" size={22} />
          <span>Dénicher des talents</span>
          <small>{vue.suivis.length} suivi(s)</small>
        </button>
        <button
          type="button"
          className={`lt-enseigne lt-enseigne--boite${decisions > 0 ? ' is-alerte' : ''}`}
          onClick={() => allerA('boite')}
        >
          <Inbox aria-hidden="true" size={22} />
          <span>{decisions > 0 ? `${decisions} à décider` : 'Boîte'}</span>
        </button>
        <span className="lt-enseigne lt-enseigne--projets" role="status">
          <Disc3 aria-hidden="true" size={22} />
          <span>{vue.projets.filter((p) => p.statut !== 'sortie').length} en studio</span>
        </span>
        {serie >= 2 ? (
          <span className="lt-enseigne lt-enseigne--serie" role="status">
            <Flame aria-hidden="true" size={22} />
            <span>Série : {serie} jours</span>
          </span>
        ) : null}
        <span className="lt-enseigne lt-enseigne--equipe" role="status">
          <Briefcase aria-hidden="true" size={22} />
          <span>{vue.roster.length} artiste(s)</span>
        </span>
      </div>

      {cible ? (
        <aside className="lt-tiroir-monde" aria-label={`Détail : ${TITRES[cible]}`}>
          <header>
            <p className="lt-tiroir-monde__titre">{TITRES[cible]}</p>
            <button
              ref={fermeture}
              type="button"
              className="lt-tiroir-monde__fermer"
              onClick={() => setCible(null)}
              aria-label="Fermer le panneau"
            >
              <X aria-hidden="true" size={22} />
            </button>
          </header>
          <div className="lt-tiroir-monde__corps">
            <Contenu
              cible={cible}
              fermer={() => setCible(null)}
              allerA={allerA}
              ouvrirFiche={ouvrirFiche}
              negocier={negocier}
            />
          </div>
        </aside>
      ) : null}
    </section>
  );
}
