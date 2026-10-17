import { Link } from 'react-router-dom';
import type { Game } from '../../data/games';
import { Button } from './ui/Button';
import { GameIcon } from './ui/GameIcon';
import { StatBar } from './ui/StatBar';

const STATUS_CLASS: Record<Game['status'], string> = {
  Disponible: 'available',
  'En développement': 'dev',
  Bientôt: 'soon',
};

/** Carte de jeu : bandeau coloré avec emblème, fiche de stats, mécanique et durée. */
export function GameCard({ game }: { game: Game }) {
  const playable = game.status === 'Disponible';

  return (
    <article className="game card">
      <div className={`game__banner game-bg game-bg--${game.color}`}>
        <span className="game__symbol">{game.symbol}</span>
        <span className={`game__status game__status--${STATUS_CLASS[game.status]}`}>
          {game.status}
        </span>
        <div className="game__icon">
          <GameIcon name={game.icon} size={92} />
        </div>
      </div>
      <div className="game__body">
        <h3 className="game__name">{game.name}</h3>
        <p className="game__genre">{game.genre}</p>
        <p className="game__tagline">{game.tagline}</p>
        <div className="game__stats">
          <StatBar label="Profit" value={game.stats.profit} />
          <StatBar label="Difficulté" value={game.stats.difficulty} />
          <StatBar label="Profondeur" value={game.stats.depth} />
        </div>
        <dl className="game__facts">
          <div>
            <dt>Mécanique</dt>
            <dd>{game.mechanic}</dd>
          </div>
          <div>
            <dt>Une partie</dt>
            <dd>{game.playtime}</dd>
          </div>
        </dl>
        <Button as={Link} to={`/jeux/${game.slug}`} tone={playable ? 'green' : 'purple'}>
          {playable ? 'Jouer' : 'Découvrir'}
        </Button>
      </div>
    </article>
  );
}
