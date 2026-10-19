import type { VueConcurrence } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { Coins, Flame, Handshake, Swords, Trophy } from 'lucide-react';
import { Avatar } from './avatar';
import { GraphBarres } from './graphiques/Graphiques';
import { useLabel } from './LabelContext';
import { Barre, Panneau } from './Visuels';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

/** Rivaux triés du plus valorisé au moins valorisé. */
export const parValorisation = (rivaux: VueConcurrence['rivaux']): VueConcurrence['rivaux'] =>
  [...rivaux].sort((a, b) => b.valorisation - a.valorisation || a.nom.localeCompare(b.nom, 'fr'));

/** Les labels rivaux, leurs artistes, les offres de rachat et la part de marché par genre. */
export function Concurrence() {
  const { vue, envoyer } = useLabel();
  if (!vue) return null;
  const c = vue.concurrence;
  const parts = c.parts.filter((p) => p.joueur + p.rivaux + p.libres > 0);

  return (
    <section className="label-screen" aria-labelledby="concurrence-titre">
      <h2 id="concurrence-titre">Concurrence</h2>

      {c.offres.length > 0 ? (
        <Panneau titre="Offres de rachat reçues" Icone={Handshake} ton="gold" id="conc-offres">
          <ul className="lt-cartes-fin">
            {c.offres.map((o) => (
              <li key={o.id} className="lt-carte-fin">
                <strong>{o.artiste}</strong>
                <span className="lt-chip">{o.rival}</span>
                <span className="lt-chip">
                  <Coins aria-hidden="true" size={14} /> {eur(o.prix)}
                </span>
                <span className="lt-chip">expire sem. {o.expire}</span>
                <span className="lt-carte-fin__actions">
                  <Button
                    type="button"
                    tone="gold"
                    onClick={() =>
                      void envoyer({
                        type: 'action',
                        action: { type: 'accepter-rachat', offreId: o.id },
                      })
                    }
                  >
                    Accepter l’offre de {o.rival}
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      void envoyer({
                        type: 'action',
                        action: { type: 'refuser-rachat', offreId: o.id },
                      })
                    }
                  >
                    Refuser l’offre de {o.rival}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </Panneau>
      ) : null}

      <Panneau titre="Labels rivaux" Icone={Swords} ton="red" id="conc-rivaux">
        {c.rivaux.length === 0 ? (
          <p className="lt-rien">Aucun rival pour l’instant.</p>
        ) : (
          <ul className="lt-rivaux">
            {parValorisation(c.rivaux).map((r) => (
              <li key={r.id} className="lt-rival" aria-label={r.nom}>
                <header className="lt-rival__tete">
                  <Avatar nom={r.nom} genre={r.genreFetiche} taille="lg" />
                  <div>
                    <h4>{r.nom}</h4>
                    <small>
                      {r.personnalite} · <Flame aria-hidden="true" size={13} /> {r.genreFetiche}
                    </small>
                  </div>
                </header>
                <Barre libelle="Réputation" valeur={r.reputation} ton="gold" />
                <p className="lt-rival__puces">
                  <span className="lt-chip">
                    <Coins aria-hidden="true" size={14} /> {eur(r.tresorerie)}
                  </span>
                  <span className="lt-chip">
                    <Trophy aria-hidden="true" size={14} /> {eur(r.valorisation)}
                  </span>
                </p>
                {r.roster.length === 0 ? (
                  <p className="lt-rien">Aucun artiste sous contrat.</p>
                ) : (
                  <ul className="lt-rival__roster">
                    {r.roster.map((a) => (
                      <li key={a.id}>
                        <Avatar nom={a.nom} genre={a.genreNom} />
                        <span>
                          <strong>{a.nom}</strong>
                          <small>
                            {a.genreNom} · notoriété <span className="mono">{a.notoriete}</span>
                          </small>
                        </span>
                        <Button
                          type="button"
                          disabled={vue.finances.tresorerie < a.prixRachat}
                          onClick={() =>
                            void envoyer({
                              type: 'action',
                              action: { type: 'racheter-artiste', artisteId: a.id },
                            })
                          }
                        >
                          Racheter {a.nom} ({eur(a.prixRachat)})
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Parts de marché par genre" Icone={Flame} ton="orange" id="conc-parts">
        {parts.length === 0 ? (
          <p className="lt-rien">Aucun artiste actif pour l’instant.</p>
        ) : (
          <GraphBarres
            titre="Artistes par genre : toi, les rivaux, libres"
            etiquettes={parts.map((p) => p.nom.slice(0, 8))}
            series={[
              { nom: 'Toi', valeurs: parts.map((p) => p.joueur) },
              { nom: 'Rivaux', valeurs: parts.map((p) => p.rivaux) },
              { nom: 'Libres', valeurs: parts.map((p) => p.libres) },
            ]}
          />
        )}
      </Panneau>

      <Panneau titre="Affrontements récents" Icone={Swords} ton="pink" id="conc-affr">
        {c.affrontements.length === 0 ? (
          <p className="lt-rien">Rien à signaler.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {c.affrontements.map((a) => (
              <li key={a.id} className="lt-carte-fin">
                <strong>{a.titre}</strong>
                <span className="lt-chip">sem. {a.semaine}</span>
                <small>{a.texte}</small>
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </section>
  );
}
