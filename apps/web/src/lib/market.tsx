import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { GAMES } from '../data/games';
import { mulberry32 } from './prng';
import { seededHistory, stepPrice } from './randomWalk';

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  /** Cours à l'ouverture (premier point de l'historique). */
  open: number;
  /** Variation depuis l'ouverture, en %. */
  change: number;
  history: readonly number[];
}

const HISTORY_LENGTH = 48;
const TICK_MS = 2200;

type Histories = Record<string, number[]>;

function initialHistories(): Histories {
  return Object.fromEntries(
    GAMES.map((g) => [g.symbol, seededHistory(g.seed, g.price, g.volatility, HISTORY_LENGTH)]),
  );
}

const MarketContext = createContext<readonly Quote[]>([]);

/**
 * Marché fictif partagé par le ticker et la cote.
 * Toutes les 2,2 s, deux symboles tirés au sort font un pas de marche aléatoire : on obtient un
 * rythme irrégulier, comme un vrai tableau d'affichage. Le tirage utilise un générateur à graine
 * fixe, mais l'ordre des ticks dépend du moment de la visite, ce qui est le but.
 * Avec `prefers-reduced-motion`, le marché est figé.
 */
export function MarketProvider({ children }: { children: ReactNode }) {
  const [histories, setHistories] = useState<Histories>(initialHistories);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rand = mulberry32(Date.now() % 100_000);
    const id = window.setInterval(() => {
      setHistories((prev) => {
        const next: Histories = { ...prev };
        for (let n = 0; n < 2; n += 1) {
          const game = GAMES[Math.floor(rand() * GAMES.length)];
          if (!game) continue;
          const series = next[game.symbol] ?? [];
          const last = series[series.length - 1] ?? game.price;
          next[game.symbol] = [
            ...series.slice(-(HISTORY_LENGTH - 1)),
            stepPrice(last, game.price, game.volatility, rand),
          ];
        }
        return next;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const quotes = useMemo<Quote[]>(
    () =>
      GAMES.map((g) => {
        const history = histories[g.symbol] ?? [g.price];
        const price = history[history.length - 1] ?? g.price;
        const open = history[0] ?? price;
        return {
          symbol: g.symbol,
          name: g.name,
          price,
          open,
          change: ((price - open) / open) * 100,
          history,
        };
      }),
    [histories],
  );

  return <MarketContext.Provider value={quotes}>{children}</MarketContext.Provider>;
}

export function useMarket(): readonly Quote[] {
  return useContext(MarketContext);
}
