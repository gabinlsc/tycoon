import { Link } from 'react-router-dom';
import { FEATURED_SLUG, GAMES, findGame } from '../../data/games';
import { useParallax } from '../../lib/useParallax';
import { usePointerParallax } from '../../lib/usePointerParallax';
import { Button } from './ui/Button';
import { GameIcon } from './ui/GameIcon';
import { StatBar } from './ui/StatBar';

/** Une : titre, accroche, et la carte du jeu mis en avant entourée des emblèmes des autres jeux. */
export function Hero() {
  const art = useParallax<HTMLDivElement>(0.1);
  const tilt = usePointerParallax<HTMLDivElement>();
  const featured = findGame(FEATURED_SLUG);
  const others = GAMES.filter((g) => g.slug !== FEATURED_SLUG).slice(0, 3);

  return (
    <section className="hero page" aria-labelledby="hero-titre">
      <div className="hero__copy">
        <p className="hero__chip">Gratuit · sans e-mail · dans ton navigateur</p>
        <h1 id="hero-titre" className="hero__title">
          <span className="hero__line">Six jeux.</span>
          <span className="hero__line hero__line--accent">Six empires.</span>
          <span className="hero__line">À toi de jouer.</span>
        </h1>
        <p className="hero__lead">
          Signe des artistes, ouvre un food truck, sors tes propres baskets, monte un festival,
          dirige un club de foot ou bâtis un syndicat. Chaque tycoon est un jeu à part entière, avec
          ses règles et sa sauvegarde.
        </p>
        <div className="hero__actions">
          <Button as={Link} to="/jeux" tone="gold" size="lg">
            Voir les jeux
          </Button>
          <Button as={Link} to="/compte" tone="ghost" size="lg">
            Créer mon pseudo
          </Button>
        </div>
      </div>

      <div className="hero__art" ref={art}>
        <div className="hero__tilt" ref={tilt}>
          {others.map((game, index) => (
            <Link
              key={game.slug}
              to={`/jeux/${game.slug}`}
              className={`hero__orb hero__orb--${index + 1} game-bg game-bg--${game.color}`}
              aria-label={game.name}
            >
              <GameIcon name={game.icon} size={44} />
            </Link>
          ))}
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
              <Button as={Link} to={`/jeux/${featured.slug}`} tone="purple">
                Découvrir
              </Button>
            </article>
          ) : null}
        </div>
      </div>
    </section>
  );
}
