import type { CSSProperties } from 'react';
import type { VueArtiste, VueBatiment, VueJeu } from '@tycoon/label-tycoon';
import {
  Briefcase,
  Disc3,
  Drum,
  Hammer,
  Lock,
  type LucideIcon,
  Mic2,
  Plus,
  Speaker,
} from 'lucide-react';
import { couleurDuGenre, initiales } from './avatar';
import type { EcranId } from './ecrans';

/** Étages de l'immeuble, du toit au rez-de-chaussée. */
const ETAGES: readonly { id: string; nom: string; Icone: LucideIcon; ecran: EcranId }[] = [
  { id: 'concert', nom: 'Salle de concert', Icone: Speaker, ecran: 'batiments' },
  { id: 'pressage', nom: 'Pressage', Icone: Disc3, ecran: 'batiments' },
  { id: 'repetition', nom: 'Répétition', Icone: Drum, ecran: 'batiments' },
  { id: 'studio', nom: 'Studio', Icone: Mic2, ecran: 'studio' },
  { id: 'bureaux', nom: 'Bureaux', Icone: Briefcase, ecran: 'batiments' },
];

/** Nombre maximal de personnages dessinés par étage. */
const PIONS_MAX = 5;

/**
 * Où se trouve chaque artiste : au studio s'il enregistre, aux bureaux s'il est épuisé ou
 * démoralisé, en répétition sinon (aux bureaux tant que la salle n'existe pas).
 */
export function etageDe(a: VueArtiste, repetition: boolean): string {
  if (a.enProduction) return 'studio';
  if (a.fatigue >= 70 || a.moral <= 30) return 'bureaux';
  return repetition ? 'repetition' : 'bureaux';
}

function Pion({ artiste, index }: { artiste: VueArtiste; index: number }) {
  const fatigue = artiste.fatigue >= 70 || artiste.moral <= 30;
  return (
    <span
      className={`lt-pion lt-pion--${couleurDuGenre(artiste.genre)}${fatigue ? ' is-las' : ''}`}
      style={{ '--i': index } as CSSProperties}
      aria-hidden="true"
    >
      <span className="lt-pion__tete">{initiales(artiste.nom)}</span>
      <span className="lt-pion__corps" />
    </span>
  );
}

function Etage({
  etage,
  batiment,
  artistes,
  semaine,
  allerA,
}: {
  etage: (typeof ETAGES)[number];
  batiment: VueBatiment | undefined;
  artistes: VueArtiste[];
  semaine: number;
  allerA: (ecran: EcranId) => void;
}) {
  const niveau = batiment?.niveau ?? 0;
  const max = batiment?.niveauMax ?? 1;
  const travaux = batiment?.travaux ?? null;
  const verrouille = batiment ? !batiment.palierAtteint && niveau === 0 : true;
  const etat = travaux ? 'travaux' : niveau > 0 ? 'ouvert' : verrouille ? 'verrouille' : 'libre';
  const description = travaux
    ? `en travaux jusqu’à la semaine ${travaux.fin}`
    : niveau > 0
      ? `niveau ${niveau} sur ${max}`
      : verrouille
        ? 'pas encore accessible'
        : 'à construire';
  const visibles = artistes.slice(0, PIONS_MAX);

  return (
    <li className={`lt-etage lt-etage--${etage.id} is-${etat}`}>
      <button
        type="button"
        className="lt-etage__bouton"
        onClick={() => allerA(etage.ecran)}
        style={{ '--niveau': niveau } as CSSProperties}
      >
        <span className="lt-etage__plaque">
          <etage.Icone aria-hidden="true" size={16} strokeWidth={2.6} />
          {etage.nom}
        </span>
        <span className="visually-hidden">
          {`, ${description}`}
          {artistes.length > 0 ? `, ${artistes.map((a) => a.nom).join(', ')}` : ''}
        </span>
        <span className="lt-etage__salle" aria-hidden="true">
          <etage.Icone className="lt-etage__decor" size={54} strokeWidth={1.6} />
          {etat === 'verrouille' ? (
            <span className="lt-etage__statut">
              <Lock size={22} />
            </span>
          ) : etat === 'libre' ? (
            <span className="lt-etage__statut">
              <Plus size={22} />
            </span>
          ) : etat === 'travaux' ? (
            <span className="lt-etage__statut lt-etage__statut--travaux">
              <Hammer size={20} /> {Math.max(0, travaux ? travaux.fin - semaine : 0)} sem.
            </span>
          ) : null}
          <span className="lt-etage__pions">
            {visibles.map((a, i) => (
              <Pion key={a.id} artiste={a} index={i} />
            ))}
            {artistes.length > PIONS_MAX ? (
              <span className="lt-pion-plus">+{artistes.length - PIONS_MAX}</span>
            ) : null}
          </span>
        </span>
        <span className="lt-etage__fenetres" aria-hidden="true">
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className={i < niveau ? 'is-allumee' : ''} />
          ))}
        </span>
      </button>
    </li>
  );
}

/** Le QG dessiné : l'immeuble du label, un étage par bâtiment, les artistes à leur poste. */
export function Immeuble({ vue, allerA }: { vue: VueJeu; allerA: (ecran: EcranId) => void }) {
  const repetition = (vue.batiments.find((b) => b.id === 'repetition')?.niveau ?? 0) > 0;
  const parEtage = new Map<string, VueArtiste[]>();
  for (const a of vue.roster) {
    const id = etageDe(a, repetition);
    parEtage.set(id, [...(parEtage.get(id) ?? []), a]);
  }

  return (
    <section className="lt-immeuble" aria-labelledby="immeuble-titre">
      <h2 id="immeuble-titre" className="visually-hidden">
        Ton immeuble
      </h2>
      <div className="lt-immeuble__ciel" aria-hidden="true">
        <span className="lt-immeuble__lune" />
        <span className="lt-immeuble__ville" />
      </div>
      <div className="lt-immeuble__facade">
        <div className="lt-immeuble__toit" aria-hidden="true">
          <span className="lt-immeuble__antenne" />
          <span className="lt-immeuble__neon">{vue.label.nom}</span>
        </div>
        <ul className="lt-immeuble__etages">
          {ETAGES.map((e) => (
            <Etage
              key={e.id}
              etage={e}
              batiment={vue.batiments.find((b) => b.id === e.id)}
              artistes={parEtage.get(e.id) ?? []}
              semaine={vue.semaine}
              allerA={allerA}
            />
          ))}
        </ul>
        <div className="lt-immeuble__rdc" aria-hidden="true">
          <span className="lt-immeuble__vitrine" />
          <span className="lt-immeuble__porte" />
          <span className="lt-immeuble__vitrine" />
        </div>
      </div>
      <div className="lt-immeuble__trottoir" aria-hidden="true" />
    </section>
  );
}
