import { GameGrid } from '../components/arcade/GameGrid';
import { usePageTitle } from '../lib/usePageTitle';

export function GamesPage() {
  usePageTitle('Les jeux');
  return (
    <div className="page-top">
      <GameGrid />
    </div>
  );
}
