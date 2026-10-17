import { useMemo } from 'react';
import { SITE } from '../../config/site';
import { dailyChallenge, dailyPodium, dayKey, previousDayKey } from '../../lib/daily';
import { Countdown } from '../DailyChallenge/Countdown';
import { Button } from './ui/Button';
import { Coin } from './ui/Coin';
import { GameIcon } from './ui/GameIcon';
import { Reveal } from './ui/Reveal';
import { SectionTitle } from './ui/SectionTitle';

const money = new Intl.NumberFormat(SITE.locale);
const MEDALS = { 1: 'gold', 2: 'silver', 3: 'bronze' } as const;

/** Défi du jour : une quête identique pour tous, un chrono, et le podium de la veille. */
export function DailyQuest() {
  const { challenge, podium } = useMemo(() => {
    const now = new Date();
    return {
      challenge: dailyChallenge(dayKey(now)),
      podium: dailyPodium(previousDayKey(now)),
    };
  }, []);
  const order = [podium[1], podium[0], podium[2]].filter((e) => e !== undefined);

  return (
    <section id="defi-du-jour" className="quest page" aria-labelledby="defi-titre">
      <SectionTitle
        level="2"
        id="defi-titre"
        title="Le défi du jour"
        kicker="Une quête par jour, la même pour tout le monde. Elle change à minuit."
      />
      <div className="quest__layout">
        <Reveal className="quest__card card">
          <div className={`quest__head game-bg game-bg--${challenge.game.color}`}>
            <GameIcon name={challenge.game.icon} size={72} />
            <div>
              <p className="quest__grid mono">Quête n° {challenge.grid}</p>
              <h3 className="quest__game">{challenge.game.name}</h3>
            </div>
          </div>
          <dl className="quest__rules">
            <div>
              <dt>Capital de départ</dt>
              <dd className="mono">${money.format(challenge.capital)}</dd>
            </div>
            <div>
              <dt>Objectif</dt>
              <dd className="mono">${money.format(challenge.target)}</dd>
            </div>
            <div>
              <dt>Temps imparti</dt>
              <dd className="mono">{challenge.minutes} min</dd>
            </div>
            <div className="quest__rule-wide">
              <dt>Contrainte</dt>
              <dd>{challenge.constraint}</dd>
            </div>
          </dl>
          <Countdown />
          <Button href="#abonnement" tone="gold" size="lg">
            Relever le défi
          </Button>
        </Reveal>

        <Reveal className="quest__podium" delay={120}>
          <h3 className="quest__podium-title">Podium d'hier</h3>
          <ol className="podium" aria-label="Podium de la veille">
            {order.map((entry) => (
              <li key={entry.rank} className={`podium__step podium__step--${MEDALS[entry.rank]}`}>
                <Coin size={entry.rank === 1 ? 44 : 34} />
                <span className="podium__name">{entry.name}</span>
                <span className="podium__score mono">${money.format(entry.score)}</span>
                <span className="podium__rank mono" aria-label={`Rang ${entry.rank}`}>
                  {entry.rank}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
