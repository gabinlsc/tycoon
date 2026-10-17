import { useMemo } from 'react';
import { SITE } from '../../config/site';
import { dailyChallenge, dailyPodium, dayKey, previousDayKey } from '../../lib/daily';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';
import { StampButton } from '../ui/StampButton';
import { Countdown } from './Countdown';
import { Podium } from './Podium';

const money = new Intl.NumberFormat(SITE.locale);

/** Encart « grille du jour » : même seed pour tout le monde, compte à rebours, podium de la veille. */
export function DailyChallenge() {
  const { challenge, podium } = useMemo(() => {
    const now = new Date();
    return {
      challenge: dailyChallenge(dayKey(now)),
      podium: dailyPodium(previousDayKey(now)),
    };
  }, []);

  return (
    <section id="defi-du-jour" className="daily page" aria-labelledby="defi-titre">
      <SectionHeading
        number="02"
        id="defi-titre"
        title="Le défi du jour"
        kicker="Une seule grille par jour, la même pour tous. À minuit, elle disparaît."
      />
      <div className="daily__layout">
        <Reveal mask="right" className="daily__grid">
          <p className="daily__grid-number mono">Grille n° {challenge.grid}</p>
          <h3 className="daily__game">{challenge.game.name}</h3>
          <dl className="daily__rules">
            <div>
              <dt className="mono">Capital de départ</dt>
              <dd className="mono">{money.format(challenge.capital)} €</dd>
            </div>
            <div>
              <dt className="mono">Objectif</dt>
              <dd className="mono">{money.format(challenge.target)} €</dd>
            </div>
            <div>
              <dt className="mono">Temps imparti</dt>
              <dd className="mono">{challenge.minutes} minutes</dd>
            </div>
            <div>
              <dt className="mono">Contrainte</dt>
              <dd>{challenge.constraint}</dd>
            </div>
          </dl>
          <Countdown />
          <StampButton href="#abonnement">Relever le défi</StampButton>
        </Reveal>
        <div className="daily__podium">
          <h3 className="daily__podium-title">Podium d'hier</h3>
          <Podium entries={podium} />
        </div>
      </div>
    </section>
  );
}
