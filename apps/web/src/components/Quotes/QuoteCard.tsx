import type { Game } from '../../data/games';
import { formatPercent, formatPrice } from '../../lib/format';
import type { Quote } from '../../lib/market';
import { Sparkline } from '../ui/Sparkline';

interface QuoteCardProps {
  game: Game;
  quote: Quote;
}

const STATUS_CLASS: Record<Game['status'], string> = {
  Disponible: 'available',
  'En développement': 'dev',
  Bientôt: 'soon',
};

/**
 * Une valeur de la cote, présentée comme un certificat d'actions.
 * Le détail (mécanique, durée) est toujours dans le DOM : il apparaît au survol et au focus
 * clavier via :focus-within, et reste affiché en permanence sur les écrans tactiles.
 */
export function QuoteCard({ game, quote }: QuoteCardProps) {
  const tone = quote.change > 0 ? 'up' : quote.change < 0 ? 'down' : 'flat';
  const playable = game.status === 'Disponible' && game.href;

  return (
    <article className="quote">
      <div className="quote__frame">
        <header className="quote__head">
          <span className="quote__symbol mono">{game.symbol}</span>
          <span className={`quote__status quote__status--${STATUS_CLASS[game.status]} mono`}>
            {game.status}
          </span>
        </header>
        <h3 className="quote__name">{game.name}</h3>
        <p className="quote__genre mono">{game.genre}</p>
        <p className="quote__tagline">{game.tagline}</p>
        <div className="quote__chart">
          <Sparkline values={quote.history} tone={tone} />
        </div>
        <p className="quote__price mono">
          {formatPrice(quote.price)} €{' '}
          <span className={tone === 'up' ? 'is-up' : tone === 'down' ? 'is-down' : ''}>
            {tone === 'up' ? '▲' : tone === 'down' ? '▼' : '■'} {formatPercent(quote.change)}
          </span>
        </p>
        <div className="quote__detail">
          <dl>
            <div>
              <dt className="mono">Mécanique</dt>
              <dd>{game.mechanic}</dd>
            </div>
            <div>
              <dt className="mono">Durée d'une partie</dt>
              <dd className="mono">{game.playtime}</dd>
            </div>
          </dl>
        </div>
        <a
          className="quote__link ink-link"
          href={playable ? game.href : '#abonnement'}
          aria-label={
            playable ? `Jouer à ${game.name}` : `Être prévenu de la sortie de ${game.name}`
          }
        >
          {playable ? 'Jouer' : 'Être prévenu'} →
        </a>
      </div>
    </article>
  );
}
