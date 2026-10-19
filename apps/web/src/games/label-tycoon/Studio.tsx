import { useEffect, useRef, useState } from 'react';
import { PRODUCTION, RELEASE_TYPES } from '@tycoon/label-tycoon';
import type { ClipSize, ReleaseType } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';
import {
  Clapperboard,
  Coins,
  Disc,
  Disc3,
  Film,
  Hourglass,
  Layers,
  Mic2,
  Music,
  Rocket,
  Sparkles,
  Video,
} from 'lucide-react';
import { Avatar } from './avatar';
import { EtatVide } from './EtatVide';
import type { EcranId } from './ecrans';
import { Pochette } from './pochettes/Pochette';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;
const TYPES: ReleaseType[] = ['single', 'ep', 'album', 'mixtape'];
const NOMS_TYPE: Record<ReleaseType, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
  mixtape: 'Mixtape',
};
const CLIPS: { id: ClipSize; nom: string; Icone: typeof Film }[] = [
  { id: 'aucun', nom: 'Sans clip', Icone: Music },
  { id: 'petit', nom: 'Petit clip', Icone: Video },
  { id: 'gros', nom: 'Gros clip', Icone: Clapperboard },
];
const ICONES_TYPE: Record<ReleaseType, typeof Film> = {
  single: Disc,
  ep: Layers,
  album: Disc3,
  mixtape: Mic2,
};

/** Jauge en demi-cercle de la qualité estimée : l'arc coloré est la fourchette, jamais une valeur exacte. */
function JaugeQualite({ plage }: { plage: readonly [number, number] }) {
  const [bas, haut] = plage;
  const pt = (v: number, r: number) => {
    const a = Math.PI * (1 - Math.max(0, Math.min(100, v)) / 100);
    return `${100 + r * Math.cos(a)} ${100 - r * Math.sin(a)}`;
  };
  return (
    <svg
      viewBox="0 0 200 120"
      className="lt-jauge-q"
      role="img"
      aria-label={`Qualité estimée entre ${bas} et ${haut} sur 100`}
    >
      <path d={`M ${pt(0, 80)} A 80 80 0 0 1 ${pt(100, 80)}`} className="lt-jauge-q__fond" />
      <path d={`M ${pt(bas, 80)} A 80 80 0 0 1 ${pt(haut, 80)}`} className="lt-jauge-q__plage" />
      <text x="100" y="92" textAnchor="middle" className="lt-jauge-q__valeur">
        {bas}–{haut}
      </text>
      <text x="100" y="112" textAnchor="middle" className="lt-jauge-q__legende">
        qualité estimée
      </text>
    </svg>
  );
}

/** Console au trait : trois faders qui reflètent les réglages (décoratif, la saisie se fait au-dessous). */
export function Console({ reglages }: { reglages: { nom: string; valeur: number }[] }) {
  return (
    <svg viewBox="0 0 240 110" className="label-console" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="232"
        height="102"
        rx="12"
        fill="none"
        stroke="var(--outline)"
        strokeWidth="4"
      />
      {reglages.map((r, i) => {
        const x = 40 + i * 80;
        const y = 90 - (Math.max(0, Math.min(100, r.valeur)) / 100) * 64;
        return (
          <g key={r.nom}>
            <line
              x1={x}
              x2={x}
              y1="22"
              y2="90"
              stroke="var(--outline)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {[0, 1, 2, 3, 4].map((t) => (
              <line
                key={t}
                x1={x - 12}
                x2={x - 6}
                y1={90 - t * 16}
                y2={90 - t * 16}
                stroke="var(--text-soft)"
                strokeWidth="2"
              />
            ))}
            <rect
              x={x - 14}
              y={y - 7}
              width="28"
              height="14"
              rx="4"
              fill="var(--gold)"
              stroke="var(--outline)"
              strokeWidth="4"
            />
            <text x={x} y="104" textAnchor="middle" className="graph__axis">
              {r.nom}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Studio : lancer des sorties avec une estimation de qualité, suivre la production, publier. */
export function Studio({ allerA }: { allerA?: (ecran: EcranId) => void } = {}) {
  const { vue, envoyer } = useLabel();
  const [artisteId, setArtisteId] = useState<number | null>(null);
  const [sortie, setSortie] = useState<ReleaseType>('single');
  const [clip, setClip] = useState<ClipSize>('aucun');
  const [studio, setStudio] = useState(20);
  const [producteur, setProducteur] = useState(40);
  const [mixage, setMixage] = useState(500);
  const [estimation, setEstimation] = useState<{
    qualite: readonly [number, number];
    cout: number;
    semaines: number;
    studioMax: number;
    capacite: number;
    enCours: number;
  } | null>(null);
  const numero = useRef(0);

  const roster = vue?.roster ?? [];
  const choisi = artisteId ?? roster[0]?.id ?? null;

  useEffect(() => {
    if (choisi === null) return;
    const n = (numero.current += 1);
    void envoyer({
      type: 'estimer-sortie',
      artisteId: choisi,
      sortie,
      clip,
      studio,
      producteur,
      mixage: mixage * 100,
    }).then((r) => {
      if (n === numero.current && r.type === 'estimation') setEstimation(r);
    });
  }, [choisi, sortie, clip, studio, producteur, mixage, envoyer]);

  if (!vue) return null;
  if (roster.length === 0)
    return (
      <section className="label-screen" aria-labelledby="studio-titre">
        <h2 id="studio-titre">Studio</h2>
        <EtatVide
          Icone={Disc3}
          titre="Le studio attend sa première voix"
          texte="Signe d’abord un artiste : le studio produit les sorties de ton roster."
          action="Trouver un talent"
          {...(allerA ? { onAction: () => allerA('reperage') } : {})}
        />
      </section>
    );

  const projets = [...vue.projets].sort((a, b) => b.id - a.id);
  const nomArtiste = (id: number) => roster.find((a) => a.id === id)?.nom ?? 'Artiste';
  const complet = estimation ? estimation.enCours >= estimation.capacite : false;

  return (
    <section className="label-screen" aria-labelledby="studio-titre">
      <h2 id="studio-titre">Studio</h2>
      <Console
        reglages={[
          { nom: 'Studio', valeur: studio },
          { nom: 'Producteur', valeur: producteur },
          { nom: 'Mixage', valeur: Math.min(100, mixage / 15) },
        ]}
      />
      <ul className="lt-artistes-puces" aria-label="Choisir l’artiste">
        {roster.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className={`lt-artiste-puce${a.id === choisi ? ' is-actif' : ''}`}
              aria-pressed={a.id === choisi}
              onClick={() => setArtisteId(a.id)}
            >
              <Avatar nom={a.nom} genre={a.genre} />
              <span>{a.nom}</span>
            </button>
          </li>
        ))}
      </ul>
      <fieldset className="lt-choix">
        <legend>Type de sortie</legend>
        {TYPES.map((t) => {
          const Icone = ICONES_TYPE[t];
          return (
            <button
              key={t}
              type="button"
              className={`lt-choix__carte${t === sortie ? ' is-actif' : ''}`}
              aria-pressed={t === sortie}
              onClick={() => setSortie(t)}
            >
              <Icone aria-hidden="true" size={30} strokeWidth={2.2} />
              <strong>{NOMS_TYPE[t]}</strong>
              <small>
                {RELEASE_TYPES[t].titres} titre{RELEASE_TYPES[t].titres > 1 ? 's' : ''}
              </small>
            </button>
          );
        })}
      </fieldset>
      <fieldset className="lt-choix lt-choix--clip">
        <legend>Clip</legend>
        {CLIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`lt-choix__carte${c.id === clip ? ' is-actif' : ''}`}
            aria-pressed={c.id === clip}
            onClick={() => setClip(c.id)}
          >
            <c.Icone aria-hidden="true" size={30} strokeWidth={2.2} />
            <strong>{c.nom}</strong>
          </button>
        ))}
      </fieldset>
      <div className="label-nego__form">
        <label className="label-field lt-cache">
          Artiste
          <select value={choisi ?? ''} onChange={(e) => setArtisteId(Number(e.target.value))}>
            {roster.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="label-field lt-cache">
          Type de sortie
          <select value={sortie} onChange={(e) => setSortie(e.target.value as ReleaseType)}>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {NOMS_TYPE[t]} ({RELEASE_TYPES[t].titres} titre
                {RELEASE_TYPES[t].titres > 1 ? 's' : ''})
              </option>
            ))}
          </select>
        </label>
        <label className="label-field lt-cache">
          Clip
          <select value={clip} onChange={(e) => setClip(e.target.value as ClipSize)}>
            {CLIPS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="label-field">
          Niveau du studio : <strong className="mono">{studio}</strong>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={studio}
            onChange={(e) => setStudio(Number(e.target.value))}
          />
        </label>
        <label className="label-field">
          Producteur : <strong className="mono">{producteur}</strong>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={producteur}
            onChange={(e) => setProducteur(Number(e.target.value))}
          />
        </label>
        <label className="label-field">
          Budget de mixage par titre : <strong className="mono">{mixage} €</strong>
          <input
            type="range"
            min={0}
            max={1500}
            step={50}
            value={mixage}
            onChange={(e) => setMixage(Number(e.target.value))}
          />
        </label>
      </div>
      {estimation ? (
        <div className="label-estimate lt-estimation" aria-live="polite">
          <JaugeQualite plage={estimation.qualite} />
          <p className="lt-estimation__note">
            <Terme id="qualite">Qualité</Terme> : un tirage reste à venir, jamais une valeur exacte.
          </p>
          <p className="lt-estimation__puces">
            <span className="lt-chip">
              <Coins aria-hidden="true" size={14} /> {eur(estimation.cout)}
            </span>
            <span className="lt-chip">
              <Hourglass aria-hidden="true" size={14} /> {estimation.semaines} sem.
            </span>
            <span className="lt-chip">
              <Disc3 aria-hidden="true" size={14} /> studio {estimation.enCours}/
              {estimation.capacite}
            </span>
          </p>
          {studio > estimation.studioMax ? (
            <p className="label-warn">
              Ton studio ne permet pas plus de {estimation.studioMax} : le niveau sera plafonné.
            </p>
          ) : null}
          <Button
            type="button"
            tone="green"
            size="lg"
            disabled={complet || vue.finances.tresorerie < estimation.cout || choisi === null}
            onClick={() =>
              void envoyer({
                type: 'action',
                action: {
                  type: 'lancer-projet',
                  artisteId: choisi as number,
                  sortie,
                  clip,
                  studio,
                  producteur,
                  mixage: mixage * 100,
                },
              })
            }
          >
            <Rocket aria-hidden="true" size={20} /> Lancer la production
          </Button>
          {complet ? (
            <p className="label-warn">Studio complet ({PRODUCTION.capacity} projets au départ).</p>
          ) : null}
        </div>
      ) : null}
      <h3>Projets</h3>
      {projets.length === 0 ? (
        <p className="label-screen__soon">Aucun projet pour l’instant.</p>
      ) : (
        <ul className="label-projects lt-projets">
          {projets.map((p) => {
            const avance =
              p.statut === 'production' && p.fin > p.debut
                ? Math.max(0, Math.min(1, (vue.semaine - p.debut) / (p.fin - p.debut)))
                : 1;
            return (
              <li key={p.id} className={`lt-projet lt-projet--${p.statut}`}>
                <Pochette
                  graine={`projet-${p.id}`}
                  genre={vue.roster.find((a) => a.id === p.artisteId)?.genre ?? ''}
                  titre={NOMS_TYPE[p.type as ReleaseType] ?? p.type}
                  taille={72}
                />
                <span className="lt-projet__texte">
                  <strong>{nomArtiste(p.artisteId)}</strong>
                  <small>
                    {NOMS_TYPE[p.type as ReleaseType] ?? p.type} ·{' '}
                    {p.statut === 'production'
                      ? `fin prévue semaine ${p.fin}`
                      : p.statut === 'prete'
                        ? 'prête à sortir'
                        : 'sortie'}
                    {p.qualite !== null ? ` · qualité ${p.qualite}` : ''}
                  </small>
                  {p.statut === 'production' ? (
                    <progress
                      max={1}
                      value={avance}
                      aria-label={`Avancement de la production de ${nomArtiste(p.artisteId)}`}
                    />
                  ) : null}
                </span>
                {p.statut === 'prete' ? (
                  <Button
                    type="button"
                    tone="gold"
                    onClick={() =>
                      void envoyer({
                        type: 'action',
                        action: { type: 'sortir-projet', projetId: p.id },
                      })
                    }
                  >
                    <Sparkles aria-hidden="true" size={18} /> Sortir
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
