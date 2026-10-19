import { useState } from 'react';
import { Crown, Gem, Landmark, ScrollText, Trophy } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { configDepuisPartie } from './partie';
import { Panneau, Tuile, Tuiles } from './Visuels';
import { type EntreePantheon, enregistrerRegne, lirePantheon } from './pantheon';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

const BONUS: Record<string, { nom: string; effet: string; objectif: (cible: number) => string }> = {
  fondation: {
    nom: 'Fondation héritée',
    effet: 'De l’influence dès le palier Institution.',
    objectif: (c) => `Donner ${eur(c)} avec la fondation`,
  },
  catalogue: {
    nom: 'Catalogue',
    effet: 'Des droits résiduels qui financent le départ.',
    objectif: (c) => `Obtenir ${c} disques certifiés`,
  },
  prestige: {
    nom: 'Prestige',
    effet: 'Un nom qui ouvre les portes : plus de réputation au départ.',
    objectif: (c) => `Atteindre une valorisation de ${eur(c)}`,
  },
  reseau: {
    nom: 'Réseau',
    effet: 'Des contacts dans tous les genres : crédibilité de départ.',
    objectif: (c) => `Signer ${c} artistes`,
  },
};

const NOMS_PALIERS: Record<string, string> = {
  'home-studio': 'home-studio',
  independant: 'indépendant',
  etabli: 'établi',
  major: 'major',
  groupe: 'groupe',
  conglomerat: 'conglomérat',
  institution: 'institution',
};

/** Héritage : clore le règne du label, entrer au Panthéon et repartir avec des bonus. */
export function Heritage() {
  const { vue, nouvellePartie } = useLabel();
  const [pantheon, setPantheon] = useState<EntreePantheon[]>(() => lirePantheon());
  const [clos, setClos] = useState(false);
  if (!vue) return null;
  const { closable, bilan } = vue.heritage;

  const clore = () => {
    setPantheon(enregistrerRegne(bilan));
    setClos(true);
  };
  const repartir = () =>
    void nouvellePartie(Date.now().toString(36), {
      ...configDepuisPartie(vue.partie),
      mode: 'carriere',
      heritage: bilan.heritage,
    });

  return (
    <section className="label-screen" aria-labelledby="heritage-titre">
      <h2 id="heritage-titre">Héritage</h2>
      <p className="lt-sous-titre">
        Règne n° {bilan.generation} de <strong>{bilan.label}</strong>
      </p>
      <Tuiles label="Bilan du règne">
        <Tuile Icone={Gem} valeur={eur(bilan.valorisation)} libelle="Valorisation" ton="purple" />
        <Tuile
          Icone={Trophy}
          valeur={bilan.disquesCertifies}
          libelle="disque(s) certifié(s)"
          ton="gold"
        />
        <Tuile Icone={Crown} valeur={bilan.legendes} libelle="légende(s)" ton="pink" />
      </Tuiles>

      <Panneau titre="Bonus d’héritage" Icone={Gem} ton="teal" id="her-bonus">
        <ul className="lt-cartes-fin">
          {bilan.bonus.map((b) => (
            <li key={b.id} className={`lt-carte-fin lt-bonus${b.atteint ? ' is-atteint' : ''}`}>
              <strong>{BONUS[b.id]?.nom ?? b.id}</strong>
              <small>{BONUS[b.id]?.effet}</small>
              {b.atteint ? (
                <span className="lt-chip lt-chip--bon">{b.herite ? 'déjà hérité' : 'acquis'}</span>
              ) : (
                <>
                  <small>{BONUS[b.id]?.objectif(b.cible)}</small>
                  <progress
                    max={1}
                    value={Math.min(1, b.valeur / Math.max(1, b.cible))}
                    aria-label={`Avancement : ${BONUS[b.id]?.nom ?? b.id}`}
                  />
                </>
              )}
            </li>
          ))}
        </ul>
      </Panneau>

      <Panneau titre="Clore le règne" Icone={Landmark} ton="orange" id="her-clore">
        {!closable ? (
          <p className="lt-rien">
            Un règne peut être clos à partir du palier groupe ou après dix ans de carrière. Tu es
            actuellement un {NOMS_PALIERS[bilan.palier] ?? bilan.palier}.
          </p>
        ) : clos ? (
          <>
            <p>
              Le règne de {bilan.label} entre au Panthéon. Un héritier peut reprendre le flambeau.
            </p>
            <p className="lt-puces-info">
              <span className="lt-chip">{bilan.heritage.reputation} point(s) de réputation</span>
              <span className="lt-chip">{bilan.heritage.bonus.length} bonus</span>
            </p>
            <Button type="button" tone="green" onClick={repartir}>
              Fonder la génération suivante
            </Button>
          </>
        ) : (
          <>
            <p className="lt-sous-titre">
              Inscris le règne au Panthéon : ta partie reste sauvegardée et tu repars avec les bonus
              acquis.
            </p>
            <Button type="button" tone="gold" onClick={clore}>
              Clore le règne
            </Button>
          </>
        )}
      </Panneau>

      <Panneau titre="Panthéon" Icone={ScrollText} ton="purple" id="her-pantheon">
        {pantheon.length === 0 ? (
          <p className="lt-rien">Aucun règne n’a encore été clos sur cet appareil.</p>
        ) : (
          <ol className="lt-cartes-fin">
            {pantheon.map((e) => (
              <li key={`${e.clotureLe}:${e.label}`} className="lt-carte-fin">
                <strong>{e.label}</strong>
                <span className="lt-chip">règne {e.generation}</span>
                <span className="lt-chip">{eur(e.valorisation)}</span>
                <span className="lt-chip">{NOMS_PALIERS[e.palier] ?? e.palier}</span>
                <span className="lt-chip">{Math.round(e.semaines / 52)} ans</span>
                <span className="lt-chip">{e.disquesCertifies} disque(s) certifié(s)</span>
              </li>
            ))}
          </ol>
        )}
      </Panneau>
    </section>
  );
}
