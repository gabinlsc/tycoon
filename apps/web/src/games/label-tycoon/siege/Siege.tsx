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
import type { EcranId } from '../ecrans';
import { HAUTEUR, H_SALLE, LARGEUR, X_FACADE, X_INT, L_INT, yEtage, zoneEtage } from './geometrie';
import { Materiaux } from './Materiaux';
import { Personnage, type Pose } from './Personnage';
import { Bureaux, Concert, Pressage, Repetition, SalleFermee, Studio, Vitre } from './Salles';

/** Ce qu'un clic dans la scène peut ouvrir. */
export type CibleMonde =
  'studio' | 'bureaux' | 'repetition' | 'pressage' | 'concert' | 'roster' | 'reperage';

export type Periode = 'aube' | 'jour' | 'soir' | 'nuit';

/** Moment de la journée d'après la semaine du mois : le temps du jeu se voit sur la façade. */
export function periodeDeLaJournee(semaineDuMois: number): Periode {
  const n = ((Math.max(1, semaineDuMois) - 1) % 4) as 0 | 1 | 2 | 3;
  return (['aube', 'jour', 'soir', 'nuit'] as const)[n];
}

const TEINTES: Record<Periode, { couleur: string; opacite: number }> = {
  aube: { couleur: '#ff9ac8', opacite: 0.16 },
  jour: { couleur: '#ffffff', opacite: 0 },
  soir: { couleur: '#ff7a3d', opacite: 0.22 },
  nuit: { couleur: '#0b0630', opacite: 0.5 },
};

interface Etage {
  id: Exclude<CibleMonde, 'roster' | 'reperage'>;
  nom: string;
  Icone: LucideIcon;
  ecran: EcranId;
}

/** Étages, du toit au rez-de-chaussée. */
export const ETAGES: readonly Etage[] = [
  { id: 'concert', nom: 'Salle de concert', Icone: Speaker, ecran: 'batiments' },
  { id: 'pressage', nom: 'Pressage', Icone: Disc3, ecran: 'batiments' },
  { id: 'repetition', nom: 'Répétition', Icone: Drum, ecran: 'batiments' },
  { id: 'studio', nom: 'Studio', Icone: Mic2, ecran: 'studio' },
  { id: 'bureaux', nom: 'Bureaux', Icone: Briefcase, ecran: 'batiments' },
];

/**
 * Où se trouve chaque artiste : au studio s'il enregistre, aux bureaux s'il est épuisé ou
 * démoralisé, en répétition sinon (aux bureaux tant que la salle n'existe pas).
 */
export function etageDe(a: VueArtiste, repetition: boolean): string {
  if (a.enProduction) return 'studio';
  if (a.fatigue >= 70 || a.moral <= 30) return 'bureaux';
  return repetition ? 'repetition' : 'bureaux';
}

/** Emplacements des personnages d'un étage : position, pose et sens. */
function emplacements(
  id: Etage['id'],
  y: number,
): { x: number; y: number; pose: Pose; retourne?: boolean; echelle?: number }[] {
  const sol = y + H_SALLE - 14;
  switch (id) {
    case 'studio':
      return [
        { x: X_INT + 366, y: sol, pose: 'chante' },
        { x: X_INT + 176, y: sol, pose: 'assis' },
        { x: X_INT + 120, y: sol, pose: 'debout' },
      ];
    case 'bureaux':
      return [0, 1, 2, 3].map((i) => ({ x: X_INT + 157 + i * 66, y: sol, pose: 'tape' as const }));
    case 'repetition':
      return [
        { x: X_INT + 190, y: sol - 2, pose: 'batterie' },
        { x: X_INT + 110, y: sol, pose: 'guitare' },
        { x: X_INT + 290, y: sol, pose: 'chante', retourne: true },
      ];
    case 'concert':
      return [
        { x: X_INT + 210, y: y + 56, pose: 'chante' },
        { x: X_INT + 150, y: y + 56, pose: 'guitare' },
        { x: X_INT + 270, y: y + 56, pose: 'danse' },
      ];
    case 'pressage':
      return [{ x: X_INT + 190, y: sol, pose: 'debout' }];
  }
}

function Salle({
  id,
  y,
  niveau,
  actif,
}: {
  id: Etage['id'];
  y: number;
  niveau: number;
  actif: boolean;
}) {
  switch (id) {
    case 'studio':
      return <Studio y={y} niveau={niveau} actif={actif} />;
    case 'bureaux':
      return <Bureaux y={y} niveau={niveau} />;
    case 'repetition':
      return <Repetition y={y} niveau={niveau} />;
    case 'pressage':
      return <Pressage y={y} niveau={niveau} />;
    case 'concert':
      return <Concert y={y} niveau={niveau} />;
  }
}

const trait = { stroke: '#1b0f3a', strokeWidth: 3, strokeLinejoin: 'round' as const };

/** Le siège du label en coupe : façade en brique, toit avec enseigne, étages décorés, personnages. */
export function Siege({
  vue,
  allerA,
  ouvrir,
}: {
  vue: VueJeu;
  allerA: (ecran: EcranId) => void;
  ouvrir?: (cible: CibleMonde) => void;
}) {
  const periode = periodeDeLaJournee(vue.date.semaineDuMois);
  const teinte = TEINTES[periode];
  const repetition = (vue.batiments.find((b) => b.id === 'repetition')?.niveau ?? 0) > 0;
  const parEtage = new Map<string, VueArtiste[]>();
  for (const a of vue.roster) {
    const id = etageDe(a, repetition);
    parEtage.set(id, [...(parEtage.get(id) ?? []), a]);
  }
  const etat = (b: VueBatiment | undefined): 'ouvert' | 'travaux' | 'verrouille' | 'libre' => {
    if (b?.travaux) return 'travaux';
    if ((b?.niveau ?? 0) > 0) return 'ouvert';
    return b && b.palierAtteint ? 'libre' : 'verrouille';
  };
  const bas = yEtage(ETAGES.length);
  const nuit = periode === 'nuit' || periode === 'soir';

  return (
    <section className={`lt-siege lt-siege--${periode}`} aria-labelledby="immeuble-titre">
      <h2 id="immeuble-titre" className="visually-hidden">
        Ton immeuble
      </h2>
      <svg
        className="lt-siege__svg"
        viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
        aria-hidden="true"
        focusable="false"
      >
        <Materiaux />
        {/* ombre portée au sol */}
        <ellipse cx={LARGEUR / 2} cy={HAUTEUR - 14} rx="250" ry="12" fill="rgb(0 0 0 / 0.35)" />
        {/* corps du bâtiment */}
        <g filter="url(#sg-ombre)">
          <rect
            x={X_FACADE}
            y="118"
            width={LARGEUR - 2 * X_FACADE}
            height={bas - 118 + 62}
            fill="url(#sg-briques)"
            {...trait}
          />
        </g>
        <rect
          x={X_FACADE}
          y="118"
          width={LARGEUR - 2 * X_FACADE}
          height={bas - 118 + 62}
          fill={teinte.couleur}
          opacity={teinte.opacite}
        />
        {/* pilastres */}
        {[X_FACADE, LARGEUR - X_FACADE - 18].map((x) => (
          <rect
            key={x}
            x={x}
            y="118"
            width="18"
            height={bas - 118 + 62}
            fill="url(#sg-beton)"
            {...trait}
          />
        ))}
        {/* dalles entre les étages */}
        {ETAGES.map((_, i) => (
          <g key={i}>
            <rect
              x={X_FACADE}
              y={yEtage(i) + H_SALLE}
              width={LARGEUR - 2 * X_FACADE}
              height={yEtage(1) - yEtage(0) - H_SALLE}
              fill="url(#sg-beton)"
              {...trait}
            />
            <rect
              x={X_FACADE - 6}
              y={yEtage(i) + H_SALLE}
              width={LARGEUR - 2 * X_FACADE + 12}
              height="3"
              fill="rgb(255 255 255 / 0.4)"
            />
          </g>
        ))}
        {/* salles */}
        {ETAGES.map((e, i) => {
          const y = yEtage(i);
          const b = vue.batiments.find((x) => x.id === e.id);
          const s = etat(b);
          const niveau = b?.niveau ?? 0;
          const gens = parEtage.get(e.id) ?? [];
          const actif = e.id === 'studio' && vue.projets.some((p) => p.statut === 'production');
          return (
            <g key={e.id}>
              {s === 'ouvert' ? (
                <>
                  <Salle id={e.id} y={y} niveau={niveau} actif={actif} />
                  {emplacements(e.id, y)
                    .slice(0, gens.length)
                    .map((p, k) => {
                      const a = gens[k];
                      if (!a) return null;
                      return (
                        <Personnage
                          key={a.id}
                          graine={a.nom}
                          x={p.x}
                          y={p.y}
                          pose={p.pose}
                          retourne={p.retourne ?? false}
                          las={a.fatigue >= 70 || a.moral <= 30}
                          retard={k * -0.4}
                        />
                      );
                    })}
                  <Vitre y={y} />
                </>
              ) : (
                <SalleFermee
                  y={y}
                  etat={s}
                  restantes={Math.max(0, (b?.travaux?.fin ?? 0) - vue.semaine)}
                />
              )}
              <rect
                x={X_INT - 2}
                y={y - 2}
                width={L_INT + 4}
                height={H_SALLE + 4}
                fill="none"
                stroke="url(#sg-metal)"
                strokeWidth="5"
                rx="2"
              />
              {nuit && s === 'ouvert' ? (
                <rect
                  x={X_INT}
                  y={y}
                  width={L_INT}
                  height={H_SALLE}
                  fill="none"
                  stroke="#ffc61a"
                  strokeOpacity="0.35"
                  strokeWidth="2"
                />
              ) : null}
            </g>
          );
        })}
        {/* toit */}
        <g>
          <rect
            x={X_FACADE - 8}
            y="104"
            width={LARGEUR - 2 * X_FACADE + 16}
            height="22"
            fill="url(#sg-beton)"
            {...trait}
          />
          <rect x="70" y="52" width="420" height="58" rx="8" fill="#15102e" {...trait} />
          <rect
            x="76"
            y="58"
            width="408"
            height="46"
            rx="5"
            fill="#0d0720"
            stroke="#ff6fb5"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 0 8px #ff2d95)' }}
          />
          <text
            x="280"
            y="92"
            textAnchor="middle"
            fontSize="38"
            fontWeight="900"
            fill="#ffe1f0"
            fontFamily="'Lilita One', system-ui, sans-serif"
            className="lt-siege__neon"
            style={{ filter: 'drop-shadow(0 0 8px #ff2d95)' }}
          >
            {vue.label.nom.length > 18 ? `${vue.label.nom.slice(0, 17)}…` : vue.label.nom}
          </text>
          <path d="M110 110v-12M450 110v-12" stroke="#8d96aa" strokeWidth="5" />
          {/* château d'eau */}
          <g transform="translate(46 56)">
            <rect x="0" y="12" width="40" height="34" rx="4" fill="#8e5a2b" {...trait} />
            <path d="M-2 12L20 0l22 12z" fill="#6b4a22" {...trait} />
            <path d="M6 46v10M34 46v10" stroke="#1b0f3a" strokeWidth="3" />
          </g>
          {/* climatiseurs */}
          <rect x="474" y="70" width="34" height="24" rx="3" fill="url(#sg-metal)" {...trait} />
          <path d="M480 78h22M480 84h22" stroke="#4a4560" strokeWidth="2" />
          {/* antenne */}
          <path d="M516 104V30M508 44h16M510 58h12" stroke="#8d96aa" strokeWidth="3" />
          <circle className="lt-siege__balise" cx="516" cy="28" r="4.5" fill="#d62b49" />
        </g>
        {/* rez-de-chaussée */}
        <g>
          <rect
            x={X_FACADE}
            y={bas}
            width={LARGEUR - 2 * X_FACADE}
            height="62"
            fill="url(#sg-beton)"
            {...trait}
          />
          <rect x="234" y={bas + 8} width="92" height="54" rx="4" fill="#2d1a5c" {...trait} />
          <rect
            x="239"
            y={bas + 13}
            width="40"
            height="49"
            fill="rgb(140 200 255 / 0.25)"
            stroke="#8d96aa"
            strokeWidth="2"
          />
          <rect
            x="283"
            y={bas + 13}
            width="38"
            height="49"
            fill="rgb(140 200 255 / 0.25)"
            stroke="#8d96aa"
            strokeWidth="2"
          />
          <path d={`M226 ${bas + 8}h108l-10 -16h-88z`} fill="#d62b49" {...trait} />
          <path
            d={`M226 ${bas + 8}h108`}
            stroke="rgb(255 255 255 / 0.4)"
            strokeWidth="3"
            strokeDasharray="14 14"
          />
          {[X_FACADE + 28, LARGEUR - X_FACADE - 128].map((x) => (
            <g key={x}>
              <rect x={x} y={bas + 14} width="100" height="40" rx="3" fill="#2d1a5c" {...trait} />
              <rect
                x={x + 4}
                y={bas + 18}
                width="92"
                height="32"
                fill={nuit ? '#ffe08a' : 'rgb(140 200 255 / 0.3)'}
                opacity={nuit ? 0.85 : 1}
              />
              <path
                d={`M${x + 4} ${bas + 50}l26 -32M${x + 40} ${bas + 50}l26 -32`}
                stroke="rgb(255 255 255 / 0.25)"
                strokeWidth="6"
              />
            </g>
          ))}
        </g>
        {/* trottoir et lampadaires */}
        <rect x="0" y={HAUTEUR - 26} width={LARGEUR} height="26" fill="#5d5470" {...trait} />
        {[28, LARGEUR - 28].map((x) => (
          <g key={x}>
            <path
              d={`M${x} ${HAUTEUR - 26}V${HAUTEUR - 130}q0-12 12-12h14`}
              fill="none"
              stroke="#3a3358"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <ellipse cx={x + 22} cy={HAUTEUR - 112} rx="12" ry="5" fill="#fff6c9" />
            {nuit ? (
              <ellipse
                cx={x + 22}
                cy={HAUTEUR - 80}
                rx="40"
                ry="48"
                fill="url(#sg-halo)"
                opacity="0.45"
              />
            ) : null}
          </g>
        ))}
      </svg>

      <ul className="lt-siege__etages">
        {ETAGES.map((e, i) => {
          const b = vue.batiments.find((x) => x.id === e.id);
          const s = etat(b);
          const niveau = b?.niveau ?? 0;
          const max = b?.niveauMax ?? 1;
          const gens = parEtage.get(e.id) ?? [];
          const description =
            s === 'travaux'
              ? `en travaux jusqu’à la semaine ${b?.travaux?.fin ?? ''}`
              : s === 'ouvert'
                ? `niveau ${niveau} sur ${max}`
                : s === 'libre'
                  ? 'à construire'
                  : 'pas encore accessible';
          return (
            <li
              key={e.id}
              className={`lt-etage lt-etage--${e.id} is-${s}`}
              style={zoneEtage(i) as CSSProperties}
            >
              <button
                type="button"
                className="lt-etage__bouton"
                onClick={() => (ouvrir ? ouvrir(e.id) : allerA(e.ecran))}
              >
                <span className="lt-etage__plaque" aria-hidden="true">
                  <e.Icone size={14} strokeWidth={2.6} />
                  {e.nom}
                  {s === 'ouvert' ? (
                    <span className="lt-etage__niveaux">
                      {Array.from({ length: max }, (_, k) => (
                        <i key={k} className={k < niveau ? 'is-on' : ''} />
                      ))}
                    </span>
                  ) : s === 'verrouille' ? (
                    <Lock size={12} />
                  ) : s === 'libre' ? (
                    <Plus size={12} />
                  ) : (
                    <Hammer size={12} />
                  )}
                </span>
                <span className="visually-hidden">
                  {e.nom}
                  {`, ${description}`}
                  {gens.length > 0 ? `, ${gens.map((a) => a.nom).join(', ')}` : ''}
                </span>
              </button>
            </li>
          );
        })}
        <li
          className="lt-siege__porte"
          style={{
            left: `${(234 / LARGEUR) * 100}%`,
            top: `${((bas + 8) / HAUTEUR) * 100}%`,
            width: `${(92 / LARGEUR) * 100}%`,
            height: `${(54 / HAUTEUR) * 100}%`,
          }}
        >
          <button
            type="button"
            className="lt-immeuble__porte"
            onClick={() => (ouvrir ? ouvrir('roster') : allerA('roster'))}
            aria-label="Porte : ton roster"
          />
        </li>
      </ul>
    </section>
  );
}
