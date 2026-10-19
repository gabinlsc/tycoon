import { useEffect, useRef, useState } from 'react';
import type { VueSuivi } from '@tycoon/label-tycoon';
import { Eye, PackageOpen, Sparkles } from 'lucide-react';
import { fr } from '@tycoon/label-tycoon';
import { jouer } from './audio/useAudio';
import { CarteArtiste, type StatCarte } from './CarteArtiste';
import { Confettis } from './Ceremonie';
import { type Rarete, rangRarete, rareteDe, scoreSuivi } from './rarete';

const COMPETENCES: Record<string, string> = {
  plume: 'Plume',
  flow: 'Flow',
  voix: 'Voix',
  charisme: 'Charisme',
  scene: 'Scène',
};

/** Statistiques d'une carte de talent repéré : les fourchettes de ses compétences. */
export function statsDuSuivi(s: Pick<VueSuivi, 'fourchettes'>): StatCarte[] {
  return Object.entries(s.fourchettes).map(([cle, [bas, haut]]) => ({
    libelle: COMPETENCES[cle] ?? cle,
    valeur: Math.round((bas + haut) / 2),
    plage: [bas, haut] as const,
  }));
}

export const genreNomDe = (genre: string): string =>
  fr.genres[genre as keyof typeof fr.genres] ?? genre;

/** Meilleure rareté d'un lot de talents. */
export const meilleureRarete = (talents: readonly VueSuivi[]): Rarete =>
  talents.reduce<Rarete>((m, t) => {
    const r = rareteDe(scoreSuivi(t));
    return rangRarete(r) > rangRarete(m) ? r : m;
  }, 'commun');

/**
 * Ouverture d'un pack de repérage : une enveloppe scellée à déchirer, puis les talents trouvés,
 * face cachée, à retourner un par un (les raretés élevées font briller l'écran).
 */
export function Pack({
  source,
  talents,
  fermer,
}: {
  source: string;
  talents: readonly VueSuivi[];
  fermer: () => void;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [reveles, setReveles] = useState<ReadonlySet<number>>(new Set());
  const principal = useRef<HTMLButtonElement>(null);
  const meilleure = meilleureRarete(talents);
  const toutVu = talents.length > 0 && reveles.size === talents.length;
  const legendaireVue = [...reveles].some(
    (i) => talents[i] && rareteDe(scoreSuivi(talents[i])) === 'legendaire',
  );

  useEffect(() => {
    principal.current?.focus();
  }, [ouvert]);
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'Escape') fermer();
    };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [fermer]);

  const retourner = (i: number) => {
    if (reveles.has(i)) return;
    const t = talents[i];
    if (!t) return;
    const r = rareteDe(scoreSuivi(t));
    jouer(rangRarete(r) >= 2 ? 'revelation' : 'carte');
    setReveles(new Set([...reveles, i]));
  };

  return (
    <div
      className="lt-pack"
      role="dialog"
      aria-modal="true"
      aria-label={`Pack de repérage : ${source}`}
    >
      {legendaireVue ? <Confettis /> : null}
      <div className={`lt-pack__lueur lt-pack__lueur--${meilleure}`} aria-hidden="true" />
      {!ouvert ? (
        <div className="lt-pack__scene">
          <p className="lt-cer__surtitre">Nouveau pack</p>
          <h2 className="lt-cer__titre">{source}</h2>
          <button
            ref={principal}
            type="button"
            className="lt-pack__enveloppe"
            onClick={() => {
              jouer('revelation');
              setOuvert(true);
            }}
          >
            <span className="lt-pack__sachet" aria-hidden="true">
              <PackageOpen size={64} strokeWidth={1.8} />
              <small>
                {talents.length} carte{talents.length > 1 ? 's' : ''}
              </small>
            </span>
            <span className="lt-cer__go">Ouvrir le pack</span>
          </button>
        </div>
      ) : (
        <div className="lt-pack__scene">
          <p className="lt-cer__surtitre">
            {talents.length === 0 ? 'Pack vide' : 'Touche une carte pour la retourner'}
          </p>
          {talents.length === 0 ? (
            <p className="lt-cer__sous">
              Personne de nouveau cette fois : les talents déjà suivis sont écartés.
            </p>
          ) : (
            <ul className="lt-pack__cartes">
              {talents.map((t, i) => {
                const rarete = rareteDe(scoreSuivi(t));
                const vue = reveles.has(i);
                return (
                  <li key={t.id} style={{ '--i': i } as React.CSSProperties}>
                    <button
                      type="button"
                      className={`lt-flip${vue ? ' is-retournee' : ''}`}
                      onClick={() => retourner(i)}
                      aria-label={vue ? `${t.nom}, carte ${rarete}` : `Retourner la carte ${i + 1}`}
                    >
                      <span className="lt-flip__face lt-flip__face--dos">
                        <CarteArtiste
                          nom={t.nom}
                          genre={t.genre}
                          genreNom=""
                          rarete="commun"
                          stats={[]}
                          dos
                        />
                      </span>
                      <span className="lt-flip__face lt-flip__face--avant">
                        <CarteArtiste
                          nom={t.nom}
                          genre={t.genre}
                          genreNom={genreNomDe(t.genre)}
                          rarete={rarete}
                          stats={statsDuSuivi(t)}
                        />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="lt-pack__actions">
            {!toutVu && talents.length > 1 ? (
              <button
                type="button"
                className="lt-cer__passer"
                onClick={() => {
                  jouer('carte');
                  setReveles(new Set(talents.map((_, i) => i)));
                }}
              >
                <Eye aria-hidden="true" size={18} /> Tout retourner
              </button>
            ) : null}
            <button ref={principal} type="button" className="lt-cer__go" onClick={fermer}>
              <Sparkles aria-hidden="true" size={20} /> Ajouter à mon carnet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
