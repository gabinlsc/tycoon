import { GAMES, FEATURED_SYMBOL } from '../../data/games';
import { formatPercent, formatPrice } from '../../lib/format';
import { useMarket } from '../../lib/market';
import { useParallax } from '../../lib/useParallax';
import { Reveal } from '../ui/Reveal';
import { StampButton } from '../ui/StampButton';

export function Headline() {
  const quotes = useMarket();
  const parallax = useParallax<HTMLHeadingElement>();
  const featured = GAMES.find((g) => g.symbol === FEATURED_SYMBOL);
  const quote = quotes.find((q) => q.symbol === FEATURED_SYMBOL);

  return (
    <article className="headline page" aria-labelledby="une-titre">
      <p className="headline__kicker mono">À la une · Économie</p>
      <h1 id="une-titre" className="headline__title" ref={parallax}>
        Six empires à bâtir, aucun héritage requis
      </h1>
      <div className="headline__body">
        <div className="headline__text">
          <p className="headline__lead">
            Un camion de tacos, une cave transformée en club, un label qui n'a pas encore signé son
            premier artiste : à l'ouverture, tout le monde part avec zéro euro de plus que son
            voisin, et sans compte à créer.
          </p>
          <p className="headline__byline mono">Par la rédaction · Lecture : 2 minutes</p>
          <Reveal className="headline__columns">
            <p>
              Le Tycoon publie six jeux de gestion qui se jouent dans le navigateur, sans
              installation. Une partie dure entre quinze et cinquante minutes. Chaque jeu est coté
              ici comme une entreprise : un symbole, un cours, une courbe qui monte quand les
              joueurs s'y pressent.
            </p>
            <p>
              Les empires se parlent. Le label musical place un DJ dans la boîte de nuit, la marque
              de baskets habille le club de football, et la pègre, elle, trouve toujours une façade
              commode. Votre progression voyage d'un titre à l'autre.
            </p>
          </Reveal>
        </div>
        {featured && quote ? (
          <aside className="headline__featured" aria-label="Jeu mis en avant">
            <p className="headline__featured-label mono">Valeur du jour</p>
            <p className="headline__featured-symbol mono">{featured.symbol}</p>
            <h2 className="headline__featured-name">{featured.name}</h2>
            <p className="headline__featured-price mono">
              {formatPrice(quote.price)} €{' '}
              <span className={quote.change >= 0 ? 'is-up' : 'is-down'}>
                {formatPercent(quote.change)}
              </span>
            </p>
            <p className="headline__featured-text">{featured.tagline}</p>
            <StampButton href="#abonnement">Réserver mon exemplaire</StampButton>
            <p className="headline__featured-status mono">{featured.status}</p>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
