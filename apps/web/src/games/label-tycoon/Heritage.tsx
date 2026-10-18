import { useState } from 'react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { configDepuisPartie } from './partie';
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
      <p>
        Règne n° {bilan.generation} de <strong>{bilan.label}</strong> · valorisation{' '}
        <strong className="mono">{eur(bilan.valorisation)}</strong> · {bilan.disquesCertifies}{' '}
        disque(s) certifié(s) · {bilan.legendes} légende(s).
      </p>

      <h3>Bonus d’héritage</h3>
      <ul className="label-list">
        {bilan.bonus.map((b) => (
          <li key={b.id}>
            <strong>{BONUS[b.id]?.nom ?? b.id}</strong> — {BONUS[b.id]?.effet}{' '}
            {b.atteint ? (
              <span>{b.herite ? '(déjà hérité)' : '(acquis)'}</span>
            ) : (
              <span>
                ({BONUS[b.id]?.objectif(b.cible)} ·{' '}
                {Math.min(100, Math.round((b.valeur / b.cible) * 100))} %)
              </span>
            )}
          </li>
        ))}
      </ul>

      <h3>Clore le règne</h3>
      {!closable ? (
        <p className="label-screen__soon">
          Un règne peut être clos à partir du palier groupe ou après dix ans de carrière. Tu es
          actuellement un {NOMS_PALIERS[bilan.palier] ?? bilan.palier}.
        </p>
      ) : clos ? (
        <>
          <p>
            Le règne de {bilan.label} entre au Panthéon. Un héritier peut reprendre le flambeau.
          </p>
          <p>
            Il repart avec {bilan.heritage.reputation} point(s) de réputation et{' '}
            {bilan.heritage.bonus.length} bonus.
          </p>
          <Button type="button" tone="green" onClick={repartir}>
            Fonder la génération suivante
          </Button>
        </>
      ) : (
        <>
          <p>
            Clore le règne l’inscrit au Panthéon avec sa valorisation et ses records. Ta partie
            actuelle reste sauvegardée ; tu pars ensuite avec les bonus acquis.
          </p>
          <Button type="button" tone="gold" onClick={clore}>
            Clore le règne
          </Button>
        </>
      )}

      <h3>Panthéon</h3>
      {pantheon.length === 0 ? (
        <p>Aucun règne n’a encore été clos sur cet appareil.</p>
      ) : (
        <ol className="label-list">
          {pantheon.map((e) => (
            <li key={`${e.clotureLe}:${e.label}`}>
              <strong>{e.label}</strong> (règne {e.generation}) — {eur(e.valorisation)} ·{' '}
              {NOMS_PALIERS[e.palier] ?? e.palier} · {Math.round(e.semaines / 52)} ans ·{' '}
              {e.disquesCertifies} disque(s) certifié(s)
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
