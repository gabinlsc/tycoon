import { useState } from 'react';
import { Check, Crown, Gem, ShieldCheck, Sparkles } from 'lucide-react';
import { GAMES } from '../../data/games';
import {
  OFFRES,
  type OffreId,
  choisirOffre,
  offreDe,
  prixTexte,
  useAbonnement,
} from '../../lib/pass';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';
import { SectionTitle } from './ui/SectionTitle';

const ICONES = { gratuit: Sparkles, pro: Gem, legende: Crown } as const;

/** Le Pass Tycoon : un abonnement, les six jeux. Démonstration, aucun paiement. */
export function PassTycoon() {
  const { offre: actuelle } = useAbonnement();
  const [demande, setDemande] = useState<OffreId | null>(null);

  const choisir = (id: OffreId) => {
    if (id === 'gratuit') choisirOffre('gratuit');
    else setDemande(id);
  };

  return (
    <section id="pass" className="pass page" aria-labelledby="pass-titre">
      <SectionTitle
        level="5"
        id="pass-titre"
        title="Un pass, six jeux"
        kicker="Un seul abonnement pour tous les jeux du portail, avec de vrais avantages dans chacun."
      />
      <p className="pass__demo">
        <ShieldCheck aria-hidden="true" size={16} /> Démonstration : aucun paiement, aucune carte
        demandée.
      </p>

      <ul className="pass__jeux" aria-label="Jeux inclus dans le pass">
        {GAMES.map((jeu) => (
          <li key={jeu.slug} className={`pass__jeu pass__jeu--${jeu.color}`}>
            <span className="pass__sigle">{jeu.symbol}</span>
            <span className="pass__nom">{jeu.name}</span>
            <small>{jeu.status === 'Disponible' ? 'Jouable' : 'À venir'}</small>
          </li>
        ))}
      </ul>

      <ul className="pass__offres">
        {OFFRES.map((o, i) => {
          const Icone = ICONES[o.id];
          const active = o.id === actuelle;
          return (
            <li key={o.id}>
              <Reveal delay={i * 90}>
                <article
                  className={`pass__offre pass__offre--${o.id}${active ? ' is-active' : ''}`}
                >
                  {o.id === 'legende' ? <span className="pass__ruban">Le plus complet</span> : null}
                  <span className="pass__icone" aria-hidden="true">
                    <Icone size={34} strokeWidth={2.2} />
                  </span>
                  <h3>{o.nom}</h3>
                  <p className="pass__prix">
                    <strong>{prixTexte(o.prixMensuel)}</strong>
                    {o.prixMensuel > 0 ? <small> / mois</small> : null}
                  </p>
                  <p className="pass__accroche">{o.accroche}</p>
                  <ul className="pass__avantages">
                    {o.avantages.map((a) => (
                      <li key={a}>
                        <Check aria-hidden="true" size={16} /> {a}
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    tone={active ? 'ghost' : 'gold'}
                    disabled={active}
                    onClick={() => choisir(o.id)}
                    aria-label={active ? `Offre ${o.nom} active` : `Choisir l’offre ${o.nom}`}
                  >
                    {active
                      ? 'Offre active'
                      : o.prixMensuel === 0
                        ? 'Revenir au gratuit'
                        : 'Essayer (démo)'}
                  </Button>
                </article>
              </Reveal>
            </li>
          );
        })}
      </ul>

      {demande ? (
        <div
          className="pass__voile"
          role="dialog"
          aria-modal="true"
          aria-label="Confirmer l’abonnement (démonstration)"
        >
          <div className="pass__modale card">
            <h3>Offre {offreDe(demande).nom}</h3>
            <p>
              {prixTexte(offreDe(demande).prixMensuel)} par mois, <strong>sans aucun débit</strong>{' '}
              : l’abonnement n’existe que dans ce navigateur.
            </p>
            <div className="pass__actions">
              <Button type="button" tone="ghost" onClick={() => setDemande(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                tone="gold"
                onClick={() => {
                  choisirOffre(demande);
                  setDemande(null);
                }}
              >
                Activer l’offre {offreDe(demande).nom}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
