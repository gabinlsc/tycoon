import type { CSSProperties, ReactNode } from 'react';
import { useAbonnement } from './offres';
import { couleurDuGenre } from './avatar';
import { NOMS_RARETE, type Rarete } from './rarete';
import { humeurDuMoral, Visage } from './Visage';

export interface StatCarte {
  libelle: string;
  valeur: number;
  /** Fourchette connue (talent pas encore évalué) : la carte dessine la plage plutôt que la valeur. */
  plage?: readonly [number, number];
}

/**
 * Carte d'artiste à collectionner : visage dessiné, rareté, reflet holographique, statistiques.
 * `dos` montre le dos de la carte (pack pas encore révélé).
 */
export function CarteArtiste({
  nom,
  genre,
  genreNom,
  rarete,
  stats,
  pied,
  dos = false,
  moral,
}: {
  nom: string;
  genre: string;
  genreNom: string;
  rarete: Rarete;
  stats: readonly StatCarte[];
  pied?: ReactNode;
  dos?: boolean;
  /** Moral de l'artiste : le visage en prend l'expression. */
  moral?: number;
}) {
  const ton = couleurDuGenre(genre);
  const { cadre } = useAbonnement();
  return (
    <div
      className={`lt-cc lt-cc--${rarete} lt-cc--${ton} lt-cc--cadre-${cadre}${dos ? ' is-dos' : ''}`}
      style={{ '--n': nom.length } as CSSProperties}
    >
      {dos ? (
        <div className="lt-cc__dos" aria-hidden="true">
          <span>?</span>
        </div>
      ) : (
        <>
          <div className="lt-cc__tete">
            <span className="lt-cc__rarete">{NOMS_RARETE[rarete]}</span>
            <span className="lt-cc__genre">{genreNom}</span>
          </div>
          <div className="lt-cc__portrait">
            <Visage
              graine={nom}
              taille={110}
              humeur={moral === undefined ? 'neutre' : humeurDuMoral(moral)}
            />
          </div>
          <strong className="lt-cc__nom">{nom}</strong>
          <ul className="lt-cc__stats">
            {stats.map((s) => (
              <li key={s.libelle}>
                <span>{s.libelle}</span>
                <span
                  className="lt-cc__barre"
                  role="img"
                  aria-label={
                    s.plage
                      ? `${s.libelle} : entre ${s.plage[0]} et ${s.plage[1]}`
                      : `${s.libelle} : ${s.valeur} sur 100`
                  }
                >
                  {s.plage ? (
                    <span
                      className="lt-cc__plage"
                      style={{
                        left: `${s.plage[0]}%`,
                        width: `${Math.max(3, s.plage[1] - s.plage[0])}%`,
                      }}
                    />
                  ) : (
                    <span style={{ width: `${Math.max(2, Math.min(100, s.valeur))}%` }} />
                  )}
                </span>
                <b className="mono">{s.plage ? `${s.plage[0]}–${s.plage[1]}` : s.valeur}</b>
              </li>
            ))}
          </ul>
          {pied ? <div className="lt-cc__pied">{pied}</div> : null}
          <span className="lt-cc__holo" aria-hidden="true" />
        </>
      )}
    </div>
  );
}
