import { GAMES } from '../../data/games';
import { GameCard } from './GameCard';
import { Reveal } from './ui/Reveal';
import { SectionTitle } from './ui/SectionTitle';

export function GameGrid() {
  return (
    <section id="jeux" className="games page" aria-labelledby="jeux-titre">
      <SectionTitle
        level="1"
        id="jeux-titre"
        title="Choisis ton empire"
        kicker="Six jeux, six métiers. Chacun a ses règles, tous partagent ta fortune."
      />
      <div className="games__grid">
        {GAMES.map((game, index) => (
          <Reveal key={game.symbol} delay={(index % 3) * 90}>
            <GameCard game={game} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
