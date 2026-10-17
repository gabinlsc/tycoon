import { Masthead } from './components/Masthead/Masthead';
import { DailyChallenge } from './components/DailyChallenge/DailyChallenge';
import { Headline } from './components/Headline/Headline';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { Quotes } from './components/Quotes/Quotes';
import { Ticker } from './components/Ticker/Ticker';
import { MarketProvider } from './lib/market';

export function App() {
  return (
    <MarketProvider>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <Masthead />
      <Ticker />
      <main id="contenu">
        <Headline />
        <Quotes />
        <DailyChallenge />
        <Leaderboard />
      </main>
    </MarketProvider>
  );
}
