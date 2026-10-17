import { GAMES } from '../data/games';

export interface CrossoverEdge {
  from: string;
  to: string;
  label: string;
}

/**
 * Liens entre jeux, déduits de games.ts. Chaque paire n'apparaît qu'une fois, même si
 * les deux jeux se déclarent mutuellement : la première déclaration fait foi.
 */
export function crossoverEdges(): CrossoverEdge[] {
  const seen = new Set<string>();
  const edges: CrossoverEdge[] = [];
  for (const game of GAMES) {
    for (const link of game.crossovers) {
      const key = [game.symbol, link.with].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: game.symbol, to: link.with, label: link.label });
    }
  }
  return edges;
}

export interface NodePosition {
  symbol: string;
  name: string;
  x: number;
  y: number;
}

/** Répartit les jeux sur une ellipse, le premier en haut, dans le sens horaire. */
export function layoutNodes(width: number, height: number, margin: number): NodePosition[] {
  const rx = width / 2 - margin;
  const ry = height / 2 - margin;
  return GAMES.map((game, index) => {
    const angle = (index / GAMES.length) * Math.PI * 2 - Math.PI / 2;
    return {
      symbol: game.symbol,
      name: game.name,
      x: width / 2 + rx * Math.cos(angle),
      y: height / 2 + ry * Math.sin(angle),
    };
  });
}
