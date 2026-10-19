import { useState } from 'react';
import { fillRate } from '@tycoon/label-tycoon';
import type { LabelAction, VueScene } from '@tycoon/label-tycoon';
import {
  Bus,
  Coins,
  Handshake,
  Mic2,
  Music,
  PartyPopper,
  Percent,
  Ticket,
  Users,
} from 'lucide-react';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';
import { Barre, Panneau, Tuile, Tuiles } from './Visuels';

const eur = (cents: number): string => `${Math.round(cents / 100).toLocaleString('fr-FR')} €`;

type ActionTournee = Extract<LabelAction, { type: 'lancer-tournee' }>;
type SalleId = ActionTournee['salle'];

/** Bilan prévisionnel d'une tournée : remplissage attendu, billetterie et merch, coût total. */
export function previsionTournee(
  scene: VueScene,
  artiste: VueScene['artistes'][number],
  salleId: string,
  prix: number,
  dates: number,
  merch: number,
) {
  const salle = scene.salles.find((s) => s.id === salleId);
  if (!salle) return { remplissage: 0, spectateurs: 0, billetterie: 0, cout: 0 };
  const remplissage = fillRate(
    artiste.fans,
    artiste.hype,
    salleId as SalleId,
    prix,
    scene.niveauSalleMaison,
  );
  const spectateurs = Math.round(salle.capacite * remplissage);
  const cout = salle.cout * dates + scene.tournee.coutMerch * merch;
  return { remplissage, spectateurs, billetterie: spectateurs * prix * dates * 100, cout };
}

/** Tournées, concerts, festivals et offres de synchronisation. */
export function Tournees() {
  const { vue, envoyer } = useLabel();
  const [artisteId, setArtisteId] = useState(0);
  const [salleId, setSalleId] = useState('club');
  const [prix, setPrix] = useState(18);
  const [dates, setDates] = useState(5);
  const [merch, setMerch] = useState(0);
  if (!vue) return null;
  const sc = vue.scene;
  const agir = (action: LabelAction) => void envoyer({ type: 'action', action });
  const artiste = sc.artistes.find((a) => a.id === artisteId) ?? sc.artistes[0];
  const prev = artiste ? previsionTournee(sc, artiste, salleId, prix, dates, merch) : null;
  const fonds = vue.finances.tresorerie;

  return (
    <section className="label-screen" aria-labelledby="tournees-titre">
      <h2 id="tournees-titre">Tournées</h2>
      {!artiste ? (
        <p className="lt-rien">Signe un artiste pour organiser des concerts.</p>
      ) : (
        <>
          <Panneau titre="Organiser" Icone={Mic2} ton="pink" id="tour-org">
            <div className="label-nego__form">
              <label className="label-field">
                Artiste
                <select value={artiste.id} onChange={(e) => setArtisteId(Number(e.target.value))}>
                  {sc.artistes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label-field">
                Salle
                <select
                  value={salleId}
                  onChange={(e) => {
                    setSalleId(e.target.value);
                    setPrix(sc.salles.find((s) => s.id === e.target.value)?.prixRef ?? prix);
                  }}
                >
                  {sc.salles.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom} ({s.capacite.toLocaleString('fr-FR')} places, {eur(s.cout)})
                    </option>
                  ))}
                </select>
              </label>
              <label className="label-field">
                Prix du billet (€)
                <input
                  type="number"
                  min={1}
                  value={prix}
                  onChange={(e) => setPrix(Math.max(1, Math.round(Number(e.target.value))))}
                />
              </label>
              <label className="label-field">
                Dates de la tournée
                <input
                  type="number"
                  min={sc.tournee.dates.min}
                  max={sc.tournee.dates.max}
                  value={dates}
                  onChange={(e) => setDates(Math.round(Number(e.target.value)))}
                />
              </label>
              <label className="label-field">
                Merch (exemplaires, {eur(sc.tournee.coutMerch)} pièce)
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={merch}
                  onChange={(e) => setMerch(Math.max(0, Math.round(Number(e.target.value))))}
                />
              </label>
            </div>
            {artiste.repos > 0 ? (
              <p className="label-warn">
                {artiste.nom} est au repos encore {artiste.repos} semaine(s).
              </p>
            ) : null}
            <div className="lt-forme">
              <Barre libelle="Fatigue" valeur={artiste.fatigue} ton="red" />
              <Barre libelle="Hype" valeur={artiste.hype} ton="pink" />
            </div>
            {artiste.fatigue >= 70 ? (
              <p className="label-warn">Attention au burnout : la tournée serait annulée.</p>
            ) : null}
            {prev ? (
              <Tuiles label="Prévision">
                <Tuile
                  Icone={Percent}
                  valeur={`${Math.round(prev.remplissage * 100)} %`}
                  libelle="Remplissage attendu"
                  ton="green"
                />
                <Tuile
                  Icone={Users}
                  valeur={prev.spectateurs.toLocaleString('fr-FR')}
                  libelle="Spectateurs par date"
                  ton="blue"
                />
                <Tuile
                  Icone={Ticket}
                  valeur={eur(prev.billetterie)}
                  libelle="Billetterie estimée"
                  ton="teal"
                />
                <Tuile
                  Icone={Coins}
                  valeur={eur(prev.cout)}
                  libelle="Coût total"
                  ton="orange"
                  alerte={prev.cout > fonds}
                />
              </Tuiles>
            ) : null}
            <Button
              type="button"
              tone="gold"
              disabled={artiste.repos > 0 || (prev?.cout ?? 0) > fonds}
              onClick={() =>
                agir({
                  type: 'lancer-tournee',
                  artisteId: artiste.id,
                  salle: salleId as SalleId,
                  prix,
                  dates,
                  merch,
                })
              }
            >
              Lancer la tournée
            </Button>
            <Button
              type="button"
              disabled={
                artiste.repos > 0 || (sc.salles.find((s) => s.id === salleId)?.cout ?? 0) > fonds
              }
              onClick={() =>
                agir({
                  type: 'organiser-concert',
                  artisteId: artiste.id,
                  salle: salleId as SalleId,
                  prix,
                })
              }
            >
              Organiser un concert isolé
            </Button>
          </Panneau>
        </>
      )}

      <Panneau titre="Concerts" Icone={Music} ton="purple" id="tour-concerts">
        {sc.concerts.length === 0 ? (
          <p className="lt-rien">Aucun concert pour l’instant.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {sc.concerts.map((c) => (
              <li key={c.id} className="lt-carte-fin">
                <strong>{c.artiste}</strong>
                <span className="lt-chip">{c.salle}</span>
                <span className="lt-chip">semaine {c.date}</span>
                {c.tournee ? <span className="lt-chip">tournée</span> : null}
                {c.resolu ? (
                  <>
                    <span className="lt-chip">
                      <Users aria-hidden="true" size={14} /> {c.spectateurs.toLocaleString('fr-FR')}
                    </span>
                    <span className="lt-chip lt-chip--bon">
                      <Coins aria-hidden="true" size={14} /> {eur(c.recette)} pour le label
                    </span>
                  </>
                ) : (
                  <span className="lt-chip">billet à {c.prix} €, à venir</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Tournées récentes" Icone={Bus} ton="blue" id="tour-tournees">
        {sc.tournees.length === 0 ? (
          <p className="lt-rien">Aucune tournée pour l’instant.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {sc.tournees.map((t) => (
              <li key={t.id} className="lt-carte-fin">
                <strong>{t.artiste}</strong>
                <span className="lt-chip">
                  {t.tenues}/{t.dates} dates
                </span>
                {t.annulee ? (
                  <span className="lt-chip lt-chip--mauvais">annulée (burnout)</span>
                ) : null}
                <span className="lt-chip">
                  merch {t.merchVendu}/{t.merchStock} vendus
                </span>
                <progress
                  max={Math.max(1, t.dates)}
                  value={t.tenues}
                  aria-label={`Dates tenues : ${t.artiste}`}
                />
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Festivals" Icone={PartyPopper} ton="orange" id="tour-fest">
        {sc.festivals.length === 0 ? (
          <p className="lt-rien">Les candidatures s’ouvrent au début de l’année.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {sc.festivals.map((f) => (
              <li key={f.id} className="lt-carte-fin">
                <strong>{f.nom}</strong>
                <span className="lt-chip">semaine {f.semaine}</span>
                <span className="lt-chip">notoriété min. {f.notorieteMin}</span>
                <span className="lt-chip">
                  <Coins aria-hidden="true" size={14} /> cachet {eur(f.cachet)}
                </span>
                {f.artiste ? (
                  <span className="lt-chip lt-chip--bon">
                    retenu : {f.artiste}
                    {f.tete ? ' (tête d’affiche)' : ''}
                  </span>
                ) : null}
                {f.artiste === null ? (
                  <span className="lt-carte-fin__actions">
                    {f.eligibles.map((e) => {
                      const nom = sc.artistes.find((a) => a.id === e.artisteId)?.nom ?? '';
                      return (
                        <Button
                          key={e.artisteId}
                          type="button"
                          onClick={() =>
                            agir({
                              type: 'candidater-festival',
                              festivalId: f.id,
                              artisteId: e.artisteId,
                            })
                          }
                        >
                          Candidater : {nom} ({eur(e.cachet)}
                          {e.tete ? ', tête d’affiche' : ''})
                        </Button>
                      );
                    })}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panneau>

      <Panneau titre="Synchronisations" Icone={Handshake} ton="teal" id="tour-sync">
        {sc.offresSynchro.length === 0 ? (
          <p className="lt-rien">Aucune offre pour l’instant.</p>
        ) : (
          <ul className="lt-cartes-fin">
            {sc.offresSynchro.map((o) => (
              <li key={o.id} className="lt-carte-fin">
                <strong>{o.marque}</strong>
                <span className="lt-chip">{o.type}</span>
                <span className="lt-chip">titre de {o.artiste}</span>
                <span className="lt-chip">
                  <Coins aria-hidden="true" size={14} /> {eur(o.cachet)}
                </span>
                <span className="lt-chip">jusqu’à la sem. {o.expire}</span>
                <span className="lt-carte-fin__actions">
                  <Button
                    type="button"
                    tone="gold"
                    onClick={() => agir({ type: 'accepter-synchro', offreId: o.id })}
                  >
                    Accepter {o.marque}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => agir({ type: 'refuser-synchro', offreId: o.id })}
                  >
                    Refuser {o.marque}
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panneau>
    </section>
  );
}
