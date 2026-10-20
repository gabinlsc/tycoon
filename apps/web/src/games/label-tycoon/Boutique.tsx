import { Check, Gem, Image, Palette } from 'lucide-react';
import { Coin } from '../../components/arcade/ui/Coin';
import { JEU_BOUTIQUE, definirAbonnement, droitsDe, useAbonnement } from '../../lib/pass';
import { acheter, useAchats } from '../../lib/boutique';
import { useRecompenses } from '../../lib/recompenses';
import { CATALOGUE, type ObjetBoutique } from './boutiqueLabel';
import { Panneau } from './Visuels';

/** Boutique du jeu : des cosmétiques achetés avec les pièces gagnées sur le portail (fictif). */
export function Boutique() {
  const { pieces } = useRecompenses();
  const achats = useAchats(JEU_BOUTIQUE);
  const etat = useAbonnement();
  const droits = droitsDe(etat.offre, achats);

  const possede = (o: ObjetBoutique) =>
    o.kind === 'theme' ? droits.themes.includes(o.valeur) : droits.cadres.includes(o.valeur);
  const equipe = (o: ObjetBoutique) => (o.kind === 'theme' ? etat.theme : etat.cadre) === o.valeur;
  const equiper = (o: ObjetBoutique) =>
    definirAbonnement(o.kind === 'theme' ? { theme: o.valeur } : { cadre: o.valeur });

  return (
    <section className="label-screen" aria-labelledby="boutique-titre">
      <h2 id="boutique-titre">Boutique</h2>
      <p className="lt-boutique__solde">
        <Coin size={28} /> <strong>{pieces.toLocaleString('fr-FR')}</strong> pièces
        <a className="lt-chip" href="/#recompenses">
          Gagner des pièces
        </a>
      </p>
      <Panneau titre="Cosmétiques" Icone={Gem} ton="pink" id="boutique-objets">
        <ul className="lt-boutique">
          {CATALOGUE.map((o) => {
            const Icone = o.kind === 'theme' ? Palette : Image;
            const mien = possede(o);
            return (
              <li key={o.id} className={`lt-boutique__objet lt-boutique__objet--${o.valeur}`}>
                <span className="lt-boutique__vignette" aria-hidden="true">
                  <Icone size={30} strokeWidth={2.2} />
                </span>
                <strong>{o.nom}</strong>
                <small>{o.accroche}</small>
                {mien ? (
                  <button
                    type="button"
                    className="lt-boutique__bouton"
                    disabled={equipe(o)}
                    onClick={() => equiper(o)}
                  >
                    {equipe(o) ? (
                      <>
                        <Check aria-hidden="true" size={16} /> Équipé
                      </>
                    ) : (
                      'Équiper'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="lt-boutique__bouton lt-boutique__bouton--achat"
                    disabled={pieces < o.prix}
                    aria-label={`Acheter ${o.nom} pour ${o.prix} pièces`}
                    onClick={() => {
                      if (acheter(JEU_BOUTIQUE, o.id, o.prix)) equiper(o);
                    }}
                  >
                    <Coin size={18} /> {o.prix}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Panneau>
    </section>
  );
}
