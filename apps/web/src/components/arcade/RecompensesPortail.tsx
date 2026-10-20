import { CalendarCheck, Gift, Star } from 'lucide-react';
import { useAbonnement } from '../../lib/pass';
import {
  BONUS_MENSUEL,
  GAINS_QUOTIDIENS,
  appliquer,
  cleJour,
  cleMois,
  gainDuJour,
  mensuelDisponible,
  positionDuCycle,
  quotidienDisponible,
  reclamerMensuel,
  reclamerQuotidien,
  useRecompenses,
} from '../../lib/recompenses';
import { Button } from './ui/Button';
import { Coin } from './ui/Coin';
import { SectionTitle } from './ui/SectionTitle';

/** Calendrier de connexion : un cadeau par jour sur sept jours, un bonus par mois. */
export function RecompensesPortail() {
  const etat = useRecompenses();
  const { offre } = useAbonnement();
  const jour = cleJour();
  const mois = cleMois();
  const dispo = quotidienDisponible(etat, jour);
  const position = positionDuCycle(etat, jour);
  const moisDispo = mensuelDisponible(etat, mois);

  return (
    <section id="recompenses" className="recomp page" aria-labelledby="recomp-titre">
      <SectionTitle
        level="6"
        id="recomp-titre"
        title="Reviens chaque jour"
        kicker="Un cadeau par jour, un bonus par mois : des pièces à dépenser dans la boutique de chaque jeu."
      />
      <p className="recomp__solde" aria-live="polite">
        <Coin size={30} />
        <strong>{etat.pieces.toLocaleString('fr-FR')}</strong> pièces
        {etat.serie > 1 ? <small>Série de {etat.serie} jours</small> : null}
      </p>

      <ol className="recomp__jours" aria-label="Cycle de sept jours">
        {GAINS_QUOTIDIENS.map((gain, i) => {
          const fait = dispo ? i < position : i <= position;
          const courant = dispo && i === position;
          return (
            <li
              key={i}
              className={`recomp__jour${fait ? ' is-fait' : ''}${courant ? ' is-courant' : ''}${i === 6 ? ' is-gros' : ''}`}
            >
              <span className="recomp__num">J{i + 1}</span>
              {i === 6 ? <Gift aria-hidden="true" size={30} /> : <Coin size={30} />}
              <strong>+{gain}</strong>
              {fait ? <span className="recomp__coche">Reçu</span> : null}
            </li>
          );
        })}
      </ol>

      <div className="recomp__actions">
        <Button
          type="button"
          tone="gold"
          size="lg"
          disabled={!dispo}
          onClick={() => appliquer((e) => reclamerQuotidien(e, jour, offre))}
        >
          <CalendarCheck aria-hidden="true" size={20} />{' '}
          {dispo ? `Récupérer ${gainDuJour(etat, jour, offre)} pièces` : 'Reviens demain'}
        </Button>
        <div className="recomp__mois card">
          <Star aria-hidden="true" size={22} />
          <div>
            <strong>Bonus du mois</strong>
            <small>{BONUS_MENSUEL[offre]} pièces avec ton offre</small>
          </div>
          <Button
            type="button"
            tone="green"
            disabled={!moisDispo}
            onClick={() => appliquer((e) => reclamerMensuel(e, mois, offre))}
          >
            {moisDispo ? 'Récupérer' : 'Déjà reçu'}
          </Button>
        </div>
      </div>
    </section>
  );
}
