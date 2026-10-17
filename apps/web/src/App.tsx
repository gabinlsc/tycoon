import { ActivityFeed } from './components/arcade/ActivityFeed';
import { CrossoverMap } from './components/arcade/CrossoverMap';
import { DailyQuest } from './components/arcade/DailyQuest';
import { GameGrid } from './components/arcade/GameGrid';
import { Hero } from './components/arcade/Hero';
import { HowToPlay } from './components/arcade/HowToPlay';
import { Leaderboard } from './components/arcade/Leaderboard';
import { Navbar } from './components/arcade/Navbar';
import { SiteFooter } from './components/arcade/SiteFooter';
import { SubscribeBox } from './components/arcade/SubscribeBox';

export function App() {
  return (
    <>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Navbar />
      <ActivityFeed />
      <main id="contenu">
        <Hero />
        <GameGrid />
        <DailyQuest />
        <Leaderboard />
        <HowToPlay />
        <CrossoverMap />
        <SubscribeBox />
      </main>
      <SiteFooter />
    </>
  );
}
