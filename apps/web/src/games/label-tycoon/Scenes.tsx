import { useState } from 'react';
import type { VueSceneVille, VueSuivi } from '@tycoon/label-tycoon';
import { Coins, Flame, MapPin, Mic2, Radar, Sparkles, Users } from 'lucide-react';
import { Avatar, couleurDuGenre } from './avatar';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Niveau de chaleur en toutes lettres : l'information ne repose pas sur la couleur. */
export const libelleChaleur = (s: Pick<VueSceneVille, 'chaleur' | 'emergente'>): string =>
  s.emergente ? 'émergente' : s.chaleur >= 70 ? 'brûlante' : s.chaleur >= 45 ? 'active' : 'calme';

/** Une à quatre flammes selon la chaleur, pour lire la scène d'un coup d'œil. */
function Flammes({ chaleur }: { chaleur: number }) {
  const n = chaleur >= 75 ? 4 : chaleur >= 50 ? 3 : chaleur >= 25 ? 2 : 1;
  return (
    <span className="lt-flammes" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <Flame key={i} size={20} className={i < n ? 'is-allumee' : ''} />
      ))}
    </span>
  );
}

function Ville({
  scene,
  tresorerie,
  onReperer,
}: {
  scene: VueSceneVille;
  tresorerie: number;
  onReperer: (ville: string) => void;
}) {
  const ton = couleurDuGenre(scene.genre);
  const chaleur = libelleChaleur(scene);
  return (
    <li className={`lt-ville lt-ville--${ton}${scene.emergente ? ' is-emergente' : ''}`}>
      <header className="lt-ville__tete">
        <span className="lt-ville__pin" aria-hidden="true">
          <MapPin size={22} strokeWidth={2.6} />
        </span>
        <h3>{scene.ville}</h3>
        {scene.emergente ? (
          <span className="lt-ville__ruban">
            <Sparkles aria-hidden="true" size={14} /> Émergente
          </span>
        ) : null}
      </header>
      <p className="lt-ville__genres">
        <span className={`lt-puce lt-puce--${ton}`}>{scene.genreNom}</span>
        <span className="lt-puce lt-puce--secondaire">{scene.secondaireNom}</span>
      </p>
      <div
        className="lt-ville__chaleur"
        role="img"
        aria-label={`Scène ${chaleur}, ${scene.chaleur} sur 100`}
      >
        <Flammes chaleur={scene.chaleur} />
        <span className="lt-ville__thermo" aria-hidden="true">
          <span style={{ width: `${Math.max(4, Math.min(100, scene.chaleur))}%` }} />
        </span>
      </div>
      <p className="lt-ville__pied">
        {scene.artistes > 0 ? (
          <span className="lt-chip">
            <Users aria-hidden="true" size={14} /> {scene.artistes} chez toi
          </span>
        ) : null}
        <span className="lt-chip">
          <Coins aria-hidden="true" size={14} /> {eur(scene.cout)}
        </span>
      </p>
      <button
        type="button"
        className="lt-ville__go"
        disabled={tresorerie < scene.cout}
        onClick={() => onReperer(scene.ville)}
      >
        <Radar aria-hidden="true" size={18} />
        <span className="visually-hidden">
          Repérer à {scene.ville} ({eur(scene.cout)})
        </span>
        <span aria-hidden="true">Repérer ici</span>
      </button>
    </li>
  );
}

/** Scènes des villes : cartes de villes par chaleur, repérage sur place sans quitter l'écran. */
export function Scenes() {
  const { vue, envoyer } = useLabel();
  const [trouvailles, setTrouvailles] = useState<{ ville: string; talents: VueSuivi[] } | null>(
    null,
  );
  if (!vue) return null;

  const reperer = async (ville: string) => {
    const avant = new Set(vue.suivis.map((s) => s.id));
    const r = await envoyer({ type: 'action', action: { type: 'reperer-scene', ville } });
    if (r.type === 'vue')
      setTrouvailles({ ville, talents: r.vue.suivis.filter((s) => !avant.has(s.id)) });
  };

  const villes = [...vue.scenesVilles].sort((a, b) => b.chaleur - a.chaleur);
  return (
    <section className="label-screen" aria-labelledby="scenes-titre">
      <h2 id="scenes-titre">Scènes locales</h2>
      <p className="lt-sous-titre">Les villes qui montent : repère là où ça brûle.</p>
      {trouvailles ? (
        <section className="lt-trouvailles" aria-label="Résultat du repérage" role="status">
          <header>
            <Mic2 aria-hidden="true" size={22} />
            <strong>
              {trouvailles.talents.length > 0
                ? `${trouvailles.talents.length} talent${trouvailles.talents.length > 1 ? 's' : ''} repéré${trouvailles.talents.length > 1 ? 's' : ''} à ${trouvailles.ville}`
                : `Rien de neuf à ${trouvailles.ville} cette fois`}
            </strong>
            <button
              type="button"
              className="lt-trouvailles__fermer"
              onClick={() => setTrouvailles(null)}
            >
              Fermer
            </button>
          </header>
          <ul>
            {trouvailles.talents.map((t) => (
              <li key={t.id}>
                <Avatar nom={t.nom} genre={t.genre} />
                <span>{t.nom}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <ul className="lt-villes">
        {villes.map((s) => (
          <Ville
            key={s.ville}
            scene={s}
            tresorerie={vue.finances.tresorerie}
            onReperer={(v) => void reperer(v)}
          />
        ))}
      </ul>
    </section>
  );
}
