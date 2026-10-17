import { GAMES } from '../../data/games';
import { useMarket } from '../../lib/market';
import { SectionHeading } from '../ui/SectionHeading';
import { QuoteCard } from './QuoteCard';

/** La cote : la grille des jeux, présentée comme une page de cotations. */
export function Quotes() {
  const quotes = useMarket();

  return (
    <section id="la-cote" className="quotes page" aria-labelledby="la-cote-titre">
      <SectionHeading
        number="01"
        id="la-cote-titre"
        title="La cote"
        kicker="Six valeurs cotées à l'ouverture. Survolez un certificat pour en lire le détail."
      />
      <div className="quotes__grid">
        {GAMES.map((game) => {
          const quote = quotes.find((q) => q.symbol === game.symbol);
          return quote ? <QuoteCard key={game.symbol} game={game} quote={quote} /> : null;
        })}
      </div>
    </section>
  );
}
