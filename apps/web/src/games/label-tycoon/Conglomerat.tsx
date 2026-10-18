import { useState } from 'react';
import type { LabelAction } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;
const nombre = (n: number): string => n.toLocaleString('fr-FR');

/** Lecture de l'arbitrage : ce que rapporte l'exclusivité selon la portée de la plateforme. */
export function lectureArbitrage(exclusivite: number, portee: number): string {
  if (exclusivite === 0) return 'Tout ton catalogue reste sur les plateformes externes.';
  if (portee < 30)
    return `Ta plateforme touche trop peu d’abonnés (${portee} %) : l’exclusivité te fait perdre des écoutes.`;
  if (portee < 70)
    return `Ta plateforme touche ${portee} % des écoutes exclusives : l’arbitrage est encore incertain.`;
  return `Ta plateforme touche ${portee} % des écoutes exclusives : l’exclusivité rapporte plus que le marché externe.`;
}

/** Palier Conglomérat : plateforme maison, studios de synchro, festivals possédés. */
export function Conglomerat() {
  const { vue, envoyer } = useLabel();
  const [exclusivite, setExclusivite] = useState(0);
  const [budget, setBudget] = useState(0);
  if (!vue) return null;
  const c = vue.conglomerat;
  const fonds = vue.finances.tresorerie;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });

  if (!c.debloque)
    return (
      <section className="label-screen" aria-labelledby="conglo-titre">
        <h2 id="conglo-titre">Conglomérat</h2>
        <p className="label-screen__soon">
          La plateforme maison, les studios de synchro et les festivals s’ouvrent au palier
          Conglomérat. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );

  const p = c.plateforme;
  return (
    <section className="label-screen" aria-labelledby="conglo-titre">
      <h2 id="conglo-titre">Conglomérat</h2>

      <h3>Plateforme maison</h3>
      {p === null ? (
        <>
          <p>
            Lance ta propre plateforme de streaming : elle diffuse la part exclusive de ton
            catalogue et vit d’abonnements. Marché potentiel : {nombre(c.marche)} d’abonnés.
          </p>
          <Button
            type="button"
            tone="gold"
            disabled={fonds < c.coutPlateforme}
            onClick={() => agir({ type: 'creer-plateforme' })}
          >
            Lancer la plateforme ({eur(c.coutPlateforme)})
          </Button>
        </>
      ) : (
        <>
          <p>
            <strong className="mono">{nombre(p.abonnes)}</strong> abonnés · marge{' '}
            <span className="mono">{eur(p.margeHebdo)}</span> par semaine · résultat cumulé{' '}
            <span className="mono">{eur(p.cumul)}</span>.
          </p>
          <p>{lectureArbitrage(p.exclusivite, p.portee)}</p>
          <div className="label-nego__form">
            <label className="label-field">
              Catalogue exclusif (%)
              <input
                type="number"
                min={0}
                max={100}
                value={exclusivite}
                onChange={(e) =>
                  setExclusivite(Math.min(100, Math.max(0, Math.round(Number(e.target.value)))))
                }
              />
            </label>
            <label className="label-field">
              Budget hebdomadaire d’acquisition (€)
              <input
                type="number"
                min={0}
                max={Math.round(c.budgetMax / 100)}
                step={100_000}
                value={budget}
                onChange={(e) => setBudget(Math.max(0, Math.round(Number(e.target.value))))}
              />
            </label>
          </div>
          <Button
            type="button"
            tone="gold"
            onClick={() => agir({ type: 'regler-plateforme', exclusivite, budget: budget * 100 })}
          >
            Régler la plateforme
          </Button>
          <p>
            Réglage actuel : {p.exclusivite} % d’exclusivité, budget {eur(p.budget)} par semaine.
          </p>
        </>
      )}

      <h3>Studios de synchro</h3>
      <p>
        Niveau {c.studios.niveau} / {c.studios.max} · offres ×{c.studios.chance} · cachets ×
        {c.studios.cachet} · revenu passif sur ton catalogue de qualité.
      </p>
      <Button
        type="button"
        disabled={c.studios.niveau >= c.studios.max || fonds < c.studios.cout}
        onClick={() => agir({ type: 'acheter-studio-synchro' })}
      >
        Acheter un studio de synchro ({eur(c.studios.cout)})
      </Button>

      <h3>Festivals possédés</h3>
      <p>
        {c.festivals.possedes} / {c.festivals.max} festival(s) · revenu annuel estimé par festival{' '}
        {eur(c.festivals.revenuAnnuel)}, qui monte avec la notoriété de ton roster ; les artistes du
        roster y gagnent de la hype.
      </p>
      <Button
        type="button"
        disabled={c.festivals.possedes >= c.festivals.max || fonds < c.festivals.cout}
        onClick={() => agir({ type: 'acheter-festival' })}
      >
        Acheter un festival ({eur(c.festivals.cout)})
      </Button>
    </section>
  );
}
