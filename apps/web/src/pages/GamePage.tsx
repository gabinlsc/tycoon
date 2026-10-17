import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/arcade/ui/Button';
import { GameIcon } from '../components/arcade/ui/GameIcon';
import { StatBar } from '../components/arcade/ui/StatBar';
import { GameIntro } from '../components/game/GameIntro';
import { GameStage } from '../components/game/GameStage';
import { GAMES, findGame, type Game } from '../data/games';
import { useGameIntro } from '../lib/useGameIntro';
import { usePageTitle } from '../lib/usePageTitle';
import { NotFoundPage } from './NotFoundPage';

function GameView({ game }: { game: Game }) {
  const { playing, finish, replay } = useGameIntro(game.slug);
  const others = GAMES.filter((g) => g.slug !== game.slug);

  return (
    <>
      {playing ? <GameIntro game={game} onDone={finish} /> : null}
      {/* Les animations d'entrée de la page attendent la fin du rideau */}
      <article className={`game-page page${playing ? '' : ' is-ready'}`}>
        <header className={`game-page__hero card game-bg game-bg--${game.color}`}>
          <div className="game-page__rays" aria-hidden="true" />
          <div className="game-page__emblem">
            <GameIcon name={game.icon} size={150} />
          </div>
          <div className="game-page__heading">
            <p className="game-page__genre">{game.genre}</p>
            <h1 className="game-page__title">
              {[...game.name].map((letter, index) => (
                <span
                  key={index}
                  className="game-page__letter"
                  style={{ '--i': index } as React.CSSProperties}
                  aria-hidden="true"
                >
                  {letter === ' ' ? ' ' : letter}
                </span>
              ))}
              <span className="visually-hidden">{game.name}</span>
            </h1>
            <p className="game-page__tagline">{game.tagline}</p>
          </div>
        </header>

        <GameStage game={game} />

        <div className="game-page__body">
          <p className="game-page__pitch">{game.pitch}</p>
          <div className="game-page__stats card">
            <StatBar label="Profit" value={game.stats.profit} />
            <StatBar label="Difficulté" value={game.stats.difficulty} />
            <StatBar label="Profondeur" value={game.stats.depth} />
            <p>
              <strong>Mécanique :</strong> {game.mechanic}
            </p>
            <p>
              <strong>Une partie :</strong> {game.playtime}
            </p>
            <p className="game-page__status">{game.status}</p>
          </div>
        </div>

        <nav className="game-page__others" aria-label="Autres jeux">
          <h2 className="game-page__others-title">Les autres jeux</h2>
          <ul>
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  to={`/jeux/${other.slug}`}
                  className={`other game-bg game-bg--${other.color}`}
                  aria-label={other.name}
                  title={other.name}
                >
                  <GameIcon name={other.icon} size={44} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Button type="button" tone="ghost" onClick={replay} className="game-page__replay">
          Revoir l'introduction
        </Button>
      </article>
    </>
  );
}

export function GamePage() {
  const { slug } = useParams();
  const game = findGame(slug);
  usePageTitle(game?.name);
  if (!game) return <NotFoundPage />;
  // key : changer de jeu repart d'un état neuf (introduction comprise)
  return <GameView key={game.slug} game={game} />;
}
