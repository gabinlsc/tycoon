import { GAMES } from '../../data/games';
import { GameCard } from './GameCard';
import { Reveal } from './ui/Reveal';
import { SectionTitle } from './ui/SectionTitle';

export function GameGrid({ pageTitle = false }: { pageTitle?: boolean }) {
  return (
    <section id="jeux" className="games page" aria-labelledby="jeux-titre">
      <SectionTitle
        as={pageTitle ? 'h1' : 'h2'}
        level="1"
        id="jeux-titre"
        title="Choisis ton empire"
        kicker="Six jeux, six métiers. Chacun a ses règles et sa propre sauvegarde."
      />
      <div className="games__grid">
        {GAMES.map((game, index) => (
          <Reveal key={game.slug} delay={(index % 3) * 90}>
            <GameCard game={game} as={pageTitle ? 'h2' : 'h3'} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
