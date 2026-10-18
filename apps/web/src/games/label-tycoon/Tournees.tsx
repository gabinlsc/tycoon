import { useState } from 'react';
import { fillRate } from '@tycoon/label-tycoon';
import type { LabelAction, VueScene } from '@tycoon/label-tycoon';
import { Button } from '../../components/arcade/ui/Button';
import { useLabel } from './LabelContext';

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
        <p className="label-screen__soon">Signe un artiste pour organiser des concerts.</p>
      ) : (
        <>
          <h3>Organiser</h3>
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
            <p>
              {artiste.nom} est au repos encore {artiste.repos} semaine(s).
            </p>
          ) : null}
          <p>
            Forme : fatigue <span className="mono">{artiste.fatigue}</span>, hype{' '}
            <span className="mono">{artiste.hype}</span>.
            {artiste.fatigue >= 70 ? ' Attention au burnout : la tournée serait annulée.' : ''}
          </p>
          {prev ? (
            <p>
              Remplissage attendu{' '}
              <strong className="mono">{Math.round(prev.remplissage * 100)} %</strong> (
              {prev.spectateurs.toLocaleString('fr-FR')} spectateurs par date) · billetterie estimée{' '}
              {eur(prev.billetterie)} · coût total <span className="mono">{eur(prev.cout)}</span>.
            </p>
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
        </>
      )}

      <h3>Concerts</h3>
      {sc.concerts.length === 0 ? (
        <p className="label-screen__soon">Aucun concert pour l’instant.</p>
      ) : (
        <ul className="label-list">
          {sc.concerts.map((c) => (
            <li key={c.id}>
              {c.artiste} — {c.salle}, semaine {c.date}
              {c.tournee ? ' (tournée)' : ''} :{' '}
              {c.resolu
                ? `${c.spectateurs.toLocaleString('fr-FR')} spectateurs, ${eur(c.recette)} pour le label`
                : `billet à ${c.prix} €, à venir`}
            </li>
          ))}
        </ul>
      )}

      <h3>Tournées récentes</h3>
      {sc.tournees.length === 0 ? (
        <p className="label-screen__soon">Aucune tournée pour l’instant.</p>
      ) : (
        <ul className="label-list">
          {sc.tournees.map((t) => (
            <li key={t.id}>
              {t.artiste} : {t.tenues}/{t.dates} dates
              {t.annulee ? ' — annulée (burnout)' : ''} · merch {t.merchVendu}/{t.merchStock} vendus
            </li>
          ))}
        </ul>
      )}

      <h3>Festivals</h3>
      {sc.festivals.length === 0 ? (
        <p className="label-screen__soon">Les candidatures s’ouvrent au début de l’année.</p>
      ) : (
        <ul className="label-list">
          {sc.festivals.map((f) => (
            <li key={f.id}>
              {f.nom} — semaine {f.semaine}, notoriété minimale {f.notorieteMin}, cachet de base{' '}
              {eur(f.cachet)}
              {f.artiste ? ` · retenu : ${f.artiste}${f.tete ? ' (tête d’affiche)' : ''}` : ''}
              {f.artiste === null
                ? f.eligibles.map((e) => {
                    const nom = sc.artistes.find((a) => a.id === e.artisteId)?.nom ?? '';
                    return (
                      <span key={e.artisteId}>
                        {' '}
                        <Button
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
                      </span>
                    );
                  })
                : null}
            </li>
          ))}
        </ul>
      )}

      <h3>Synchronisations</h3>
      {sc.offresSynchro.length === 0 ? (
        <p className="label-screen__soon">Aucune offre pour l’instant.</p>
      ) : (
        <ul className="label-list">
          {sc.offresSynchro.map((o) => (
            <li key={o.id}>
              {o.marque} ({o.type}) veut un titre de {o.artiste} pour {eur(o.cachet)}, jusqu’à la
              semaine {o.expire}.{' '}
              <Button
                type="button"
                tone="gold"
                onClick={() => agir({ type: 'accepter-synchro', offreId: o.id })}
              >
                Accepter {o.marque}
              </Button>{' '}
              <Button
                type="button"
                onClick={() => agir({ type: 'refuser-synchro', offreId: o.id })}
              >
                Refuser {o.marque}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
