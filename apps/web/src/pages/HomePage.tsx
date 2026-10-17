import { GameGrid } from '../components/arcade/GameGrid';
import { Hero } from '../components/arcade/Hero';
import { HowToPlay } from '../components/arcade/HowToPlay';
import { SubscribeBox } from '../components/arcade/SubscribeBox';
import { usePageTitle } from '../lib/usePageTitle';

export function HomePage() {
  usePageTitle();
  return (
    <>
      <Hero />
      <GameGrid />
      <HowToPlay />
      <SubscribeBox />
    </>
  );
}
