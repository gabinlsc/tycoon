import { Link, useParams } from 'react-router-dom';
import { Button } from '../components/arcade/ui/Button';
import { GameIcon } from '../components/arcade/ui/GameIcon';
import { StatBar } from '../components/arcade/ui/StatBar';
import { findGame } from '../data/games';
import { usePageTitle } from '../lib/usePageTitle';
import { NotFoundPage } from './NotFoundPage';

/** Page d'un jeu. L'introduction animée et l'emplacement de jeu arrivent avec la feature suivante. */
export function GamePage() {
  const { slug } = useParams();
  const game = findGame(slug);
  usePageTitle(game?.name);
  if (!game) return <NotFoundPage />;

  return (
    <article className="game-page page">
      <header className={`game-page__hero card game-bg game-bg--${game.color}`}>
        <GameIcon name={game.icon} size={140} />
        <div>
          <p className="game-page__genre">{game.genre}</p>
          <h1 className="game-page__title">{game.name}</h1>
          <p className="game-page__tagline">{game.tagline}</p>
        </div>
      </header>
      <div className="game-page__body">
        <p className="game-page__pitch">{game.pitch}</p>
        <div className="game-page__stats card">
          <StatBar label="Profit" value={game.stats.profit} />
          <StatBar label="Difficulté" value={game.stats.difficulty} />
          <StatBar label="Profondeur" value={game.stats.depth} />
          <p>
            <strong>Une partie :</strong> {game.playtime}
          </p>
          <p className="game-page__status">{game.status}</p>
        </div>
      </div>
      <Button as={Link} to="/#abonnement" tone="gold" size="lg">
        Me prévenir de la sortie
      </Button>
    </article>
  );
}
