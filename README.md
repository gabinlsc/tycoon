# Le Tycoon

Portail de jeux de gestion jouables dans le navigateur, présenté comme la une d'un quotidien financier fictif. Chaque jeu est une entreprise cotée en bourse. Pour l'instant, seule la page d'accueil existe ; les jeux arrivent ensuite.

## Lancer le projet

Prérequis : Node 20 ou plus, pnpm 10.

```
pnpm install
pnpm dev        # http://localhost:5173
pnpm check      # lint, typecheck, tests et build
```

## Structure

- `apps/web` : le portail (Vite, React, TypeScript strict).
- `packages/core` : futur moteur de simulation partagé entre les jeux (vide pour l'instant).
- `docs/` : direction artistique et guide de contribution.

## Ajouter un jeu

Ajouter une entrée dans `GAMES`, dans `apps/web/src/data/games.ts`. Rien d'autre : le ticker, la cote, le schéma des crossovers et le pied de page se mettent à jour tout seuls.

Champs principaux : `name`, `symbol` (unique), `tagline`, `genre`, `status`, `mechanic`, `playtime`, `price`, `volatility`, `seed`, `crossovers` (liens vers d'autres symboles) et, une fois le jeu en ligne, `href`.

## Modifier les tokens

Couleurs, polices, espacements, durées et easings vivent dans `apps/web/src/styles/tokens.css`, thème clair et « Édition du soir » compris. Les composants n'utilisent que ces variables.

Le nom du site et le domaine sont dans `apps/web/src/config/site.ts`.

## Pour aller plus loin

- [Direction artistique et animations](docs/design.md)
- [Contribuer](docs/contributing.md)
