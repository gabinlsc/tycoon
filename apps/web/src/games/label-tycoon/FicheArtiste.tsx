import type { VueArtiste, VueJeu } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { Terme } from './Infobulle';
import { useLabel } from './LabelContext';
import { Pochette } from './pochettes/Pochette';

const LIBELLES_COMPETENCES: Record<string, string> = {
  plume: 'Plume',
  flow: 'Flow',
  voix: 'Voix',
  charisme: 'Charisme',
  scene: 'Scène',
};

const TYPES_SORTIE: Record<string, string> = {
  single: 'Single',
  ep: 'EP',
  album: 'Album',
  mixtape: 'Mixtape',
};
const STATUTS: Record<string, string> = {
  production: 'En production',
  prete: 'Prête à sortir',
  sortie: 'Sortie',
};

/** Jauge 0-100 accessible (élément `meter`). */
function Jauge({
  libelle,
  valeur,
  terme,
  inverse = false,
}: {
  libelle: string;
  valeur: number;
  terme?: string;
  inverse?: boolean;
}) {
  return (
    <div className="label-meter">
      <span>{terme ? <Terme id={terme}>{libelle}</Terme> : libelle}</span>
      <meter
        min={0}
        max={100}
        low={inverse ? 60 : 33}
        high={inverse ? 85 : 66}
        optimum={inverse ? 0 : 100}
        value={valeur}
        aria-label={`${libelle} : ${valeur} sur 100`}
      />
      <span className="mono">{valeur}</span>
    </div>
  );
}

/** Projets d'un artiste, du plus récent au plus ancien. */
export const projetsDe = (vue: VueJeu, artisteId: number) =>
  vue.projets.filter((p) => p.artisteId === artisteId).sort((a, b) => b.id - a.id);

export function FicheArtiste({
  artiste,
  retour,
  vers,
}: {
  artiste: VueArtiste;
  retour: () => void;
  vers: (ecran: 'studio') => void;
}) {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const projets = projetsDe(vue, artiste.id);

  return (
    <section className="label-screen label-fiche" aria-labelledby="fiche-titre">
      <Button type="button" tone="ghost" onClick={retour}>
        ← Retour au roster
      </Button>
      <header className="label-fiche__head">
        <Pochette
          graine={`artiste-${artiste.id}`}
          genre={artiste.genre}
          titre={artiste.nom}
          taille={120}
        />
        <div>
          <h2 id="fiche-titre">{artiste.nom}</h2>
          <p>
            {artiste.genreNom} · {artiste.phaseNom} · {artiste.age} ans · {artiste.ville}
          </p>
          {artiste.traits.length > 0 ? (
            <p className="label-fiche__traits">{artiste.traits.join(' · ')}</p>
          ) : null}
          <p className="mono">{artiste.fans.toLocaleString('fr-FR')} fans</p>
        </div>
      </header>

      <div className="label-fiche__cols">
        <div>
          <h3>Compétences</h3>
          {Object.entries(artiste.competences).map(([cle, v]) => (
            <Jauge key={cle} libelle={LIBELLES_COMPETENCES[cle] ?? cle} valeur={v} />
          ))}
        </div>
        <div>
          <h3>État</h3>
          <Jauge libelle="Notoriété" terme="notoriete" valeur={artiste.notoriete} />
          <Jauge libelle="Hype" terme="hype" valeur={artiste.hype} />
          <Jauge libelle="Moral" terme="moral" valeur={artiste.moral} />
          <Jauge libelle="Fatigue" terme="fatigue" valeur={artiste.fatigue} inverse />
        </div>
      </div>

      <h3>Contrat</h3>
      {artiste.contrat ? (
        <p>
          Jusqu’à la semaine <span className="mono">{artiste.contrat.echeance}</span> (
          {artiste.contrat.echeance - vue.semaine} sem. restantes) · l’artiste touche{' '}
          <span className="mono">{Math.round(artiste.contrat.royaltiesBps / 100)} %</span> des{' '}
          <Terme id="royalties">royalties</Terme>.
        </p>
      ) : (
        <p className="label-screen__soon">Pas de contrat enregistré.</p>
      )}

      <h3>Sorties</h3>
      {projets.length === 0 ? (
        <p className="label-screen__soon">Aucune sortie pour l’instant.</p>
      ) : (
        <ul className="label-projects">
          {projets.map((p) => (
            <li key={p.id}>
              <Pochette
                graine={`projet-${p.id}`}
                genre={artiste.genre}
                titre={TYPES_SORTIE[p.type] ?? p.type}
                taille={72}
              />
              <span>
                {TYPES_SORTIE[p.type] ?? p.type} — {STATUTS[p.statut] ?? p.statut}
                {p.qualite !== null ? ` · qualité ${p.qualite}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="label-fiche__actions">
        <Button type="button" tone="gold" onClick={() => vers('studio')}>
          Aller au studio
        </Button>
        <Button
          type="button"
          tone="green"
          onClick={() =>
            void envoyer({
              type: 'action',
              action: { type: 'organiser-concert', artisteId: artiste.id, salle: 'bar', prix: 10 },
            })
          }
        >
          Organiser un concert (bar)
        </Button>
      </div>
    </section>
  );
}
