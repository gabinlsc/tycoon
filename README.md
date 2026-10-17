# Tycoon Hub

Portail de jeux de gestion (tycoons) jouables dans le navigateur, au look cartoon / jeu mobile. Pour l'instant, seule la page d'accueil existe ; les jeux arrivent ensuite.

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

Ajouter une entrée dans `GAMES`, dans `apps/web/src/data/games.ts`. Rien d'autre : la grille de jeux, le schéma des crossovers et le pied de page se mettent à jour tout seuls.

Champs principaux : `name`, `symbol` (unique), `color`, `icon`, `stats`, `tagline`, `genre`, `status`, `mechanic`, `playtime`, `crossovers` (liens vers d'autres symboles) et, une fois le jeu en ligne, `href`.

## Modifier les tokens

Couleurs, polices, espacements, durées et easings vivent dans `apps/web/src/styles/arcade/tokens.css`, thèmes Jour et Nuit compris. Les composants n'utilisent que ces variables.

Le nom du site et le domaine sont dans `apps/web/src/config/site.ts`.

## Pour aller plus loin

- [Direction artistique et animations](docs/design.md)
- [Contribuer](docs/contributing.md)
