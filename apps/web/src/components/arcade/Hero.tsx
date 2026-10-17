import { FEATURED_SYMBOL, GAMES } from '../../data/games';
import { useParallax } from '../../lib/useParallax';
import { Button } from './ui/Button';
import { Coin } from './ui/Coin';
import { GameIcon } from './ui/GameIcon';
import { StatBar } from './ui/StatBar';

export function Hero() {
  const art = useParallax<HTMLDivElement>(0.1);
  const featured = GAMES.find((g) => g.symbol === FEATURED_SYMBOL);

  return (
    <section id="top" className="hero page" aria-labelledby="hero-titre">
      <div className="hero__copy">
        <p className="hero__chip">Gratuit · sans compte · dans ton navigateur</p>
        <h1 id="hero-titre" className="hero__title">
          Bâtis ton empire.
          <span className="hero__money"> Empile les&nbsp;$.</span>
        </h1>
        <p className="hero__lead">
          Six tycoons à lancer en un clic : signe des artistes, ouvre un food truck, sors tes
          propres baskets, monte un festival, dirige un club de foot ou bâtis un syndicat. Même
          fortune, six façons de la faire grossir.
        </p>
        <div className="hero__actions">
          <Button href="#abonnement" tone="gold" size="lg">
            Me prévenir au lancement
          </Button>
          <Button href="#jeux" tone="ghost" size="lg">
            Voir les jeux
          </Button>
        </div>
        <ul className="hero__facts">
          <li>
            <strong className="mono">6</strong> jeux
          </li>
          <li>
            <strong className="mono">15–50</strong> min la partie
          </li>
          <li>
            <strong className="mono">1</strong> défi par jour
          </li>
        </ul>
      </div>

      <div className="hero__art" ref={art}>
        <Coin size={72} className="hero__coin hero__coin--a" />
        <Coin size={48} className="hero__coin hero__coin--b" />
        <Coin size={60} className="hero__coin hero__coin--c" />
        {featured ? (
          <article className="hero__card card" aria-label="Jeu mis en avant">
            <p className="hero__card-flag">Prochaine sortie</p>
            <div className={`hero__card-icon game-bg game-bg--${featured.color}`}>
              <GameIcon name={featured.icon} size={110} />
            </div>
            <h2 className="hero__card-name">{featured.name}</h2>
            <p className="hero__card-text">{featured.tagline}</p>
            <StatBar label="Profit" value={featured.stats.profit} />
            <StatBar label="Difficulté" value={featured.stats.difficulty} />
            <StatBar label="Profondeur" value={featured.stats.depth} />
          </article>
        ) : null}
      </div>
    </section>
  );
}
