import { useState } from 'react';
import type { LabelAction } from '@tycoon/label-tycoon';
import { Clapperboard, Coins, PartyPopper, Radio, Users } from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { Barre, Panneau, Tuile, Tuiles } from './Visuels';

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
        <p className="lt-rien">
          La plateforme maison, les studios de synchro et les festivals s’ouvrent au palier
          Conglomérat. Tu es actuellement un {vue.label.palier}.
        </p>
      </section>
    );

  const p = c.plateforme;
  return (
    <section className="label-screen" aria-labelledby="conglo-titre">
      <h2 id="conglo-titre">Conglomérat</h2>

      <Panneau titre="Plateforme maison" Icone={Radio} ton="purple" id="cg-plateforme">
        {p === null ? (
          <>
            <p className="lt-sous-titre">
              Ta propre plateforme de streaming diffuse la part exclusive de ton catalogue et vit
              d’abonnements · marché potentiel : {nombre(c.marche)} d’abonnés.
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
            <Tuiles label="Plateforme">
              <Tuile Icone={Users} valeur={nombre(p.abonnes)} libelle="abonnés" ton="purple" />
              <Tuile
                Icone={Coins}
                valeur={eur(p.margeHebdo)}
                libelle="marge par semaine"
                ton="green"
              />
              <Tuile Icone={Coins} valeur={eur(p.cumul)} libelle="résultat cumulé" ton="gold" />
            </Tuiles>
            <Barre libelle="Portée" valeur={p.portee} ton="teal" />
            <p className="lt-sous-titre">{lectureArbitrage(p.exclusivite, p.portee)}</p>
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
            <p className="lt-puces-info">
              <span className="lt-chip">
                Réglage actuel : {p.exclusivite} % d’exclusivité, budget {eur(p.budget)} par
                semaine.
              </span>
            </p>
          </>
        )}
      </Panneau>

      <Panneau titre="Studios de synchro" Icone={Clapperboard} ton="pink" id="cg-synchro">
        <Barre libelle="Niveau" valeur={c.studios.niveau} max={c.studios.max} ton="pink" />
        <p className="lt-puces-info">
          <span className="lt-chip">
            Niveau {c.studios.niveau} / {c.studios.max}
          </span>
          <span className="lt-chip">offres ×{c.studios.chance}</span>
          <span className="lt-chip">cachets ×{c.studios.cachet}</span>
        </p>
        <Button
          type="button"
          disabled={c.studios.niveau >= c.studios.max || fonds < c.studios.cout}
          onClick={() => agir({ type: 'acheter-studio-synchro' })}
        >
          Acheter un studio de synchro ({eur(c.studios.cout)})
        </Button>
      </Panneau>

      <Panneau titre="Festivals possédés" Icone={PartyPopper} ton="orange" id="cg-festivals">
        <Barre
          libelle="Festivals"
          valeur={c.festivals.possedes}
          max={c.festivals.max}
          ton="orange"
        />
        <p className="lt-puces-info">
          <span className="lt-chip">
            {c.festivals.possedes} / {c.festivals.max} festival(s)
          </span>
          <span className="lt-chip">{eur(c.festivals.revenuAnnuel)} par an et par festival</span>
        </p>
        <Button
          type="button"
          disabled={c.festivals.possedes >= c.festivals.max || fonds < c.festivals.cout}
          onClick={() => agir({ type: 'acheter-festival' })}
        >
          Acheter un festival ({eur(c.festivals.cout)})
        </Button>
      </Panneau>
    </section>
  );
}
