import { formatPercent, formatPrice } from '../../lib/format';
import { useMarket, type Quote } from '../../lib/market';
import { FlipDigits } from '../ui/FlipDigits';

function Direction({ change }: { change: number }) {
  if (change > 0) return <span className="ticker__delta ticker__delta--up">▲</span>;
  if (change < 0) return <span className="ticker__delta ticker__delta--down">▼</span>;
  return <span className="ticker__delta">■</span>;
}

function TickerItem({ quote }: { quote: Quote }) {
  const tone = quote.change > 0 ? 'up' : quote.change < 0 ? 'down' : 'flat';
  return (
    <li className={`ticker__item ticker__item--${tone}`}>
      <span className="ticker__symbol mono">{quote.symbol}</span>
      <FlipDigits value={formatPrice(quote.price)} />
      <Direction change={quote.change} />
      <FlipDigits value={formatPercent(quote.change)} />
    </li>
  );
}

/**
 * Bandeau boursier. Deux copies de la liste défilent en boucle (translation de -50 %),
 * ce qui rend la boucle invisible. La version animée est cachée aux lecteurs d'écran ;
 * une liste statique équivalente leur est proposée.
 */
export function Ticker() {
  const quotes = useMarket();

  return (
    <section className="ticker" aria-label="Cours des jeux">
      <div className="ticker__viewport" aria-hidden="true">
        <div className="ticker__track">
          {[0, 1].map((copy) => (
            <ul key={copy} className="ticker__list">
              {quotes.map((q) => (
                <TickerItem key={q.symbol} quote={q} />
              ))}
            </ul>
          ))}
        </div>
      </div>
      <ul className="visually-hidden">
        {quotes.map((q) => (
          <li key={q.symbol}>
            {q.name} ({q.symbol}) : {formatPrice(q.price)} euros, {formatPercent(q.change)}.
          </li>
        ))}
      </ul>
    </section>
  );
}
