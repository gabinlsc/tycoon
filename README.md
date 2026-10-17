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

1. Ajouter une entrée dans `GAMES`, dans `apps/web/src/data/games.ts` : la carte, la page `/jeux/<slug>` et le pied de page se mettent à jour tout seuls. Champs : `slug` (unique, sert d'URL et de clé de sauvegarde), `name`, `symbol`, `pitch`, `tagline`, `genre`, `status`, `mechanic`, `playtime`, `color`, `icon`, `stats`.
2. Quand le jeu est jouable : créer `apps/web/src/games/<slug>/index.tsx` (export par défaut du composant), l'enregistrer dans `apps/web/src/games/registry.ts` avec `lazy(() => import('./<slug>'))`, puis passer son statut à `Disponible`.
3. Dans le jeu, lire et écrire la sauvegarde avec `useGameSave(slug)` : elle est isolée par compte et par jeu.

Chaque jeu est indépendant : rien n'est partagé entre eux (monnaie, progression, données).

## Comptes

Pas d'e-mail ni de mot de passe : un pseudo réservé et huit codes de récupération à usage unique. La connexion est automatique dans le navigateur. Le code est dans `apps/web/src/accounts`.

Pour l'instant le stockage est local (`localStorage`, classe `LocalAccountStore`) : un pseudo n'est réservé que sur l'appareil et le compte ne se retrouve pas ailleurs. Pour passer à un vrai serveur, il suffit d'implémenter l'interface `AccountStore` (`accounts/types.ts`) et de l'instancier dans `AccountProvider`.

## Hébergement

Le site utilise des URL propres (`/jeux/syndicate`) : l'hébergeur doit renvoyer `index.html` pour toutes les routes. `apps/web/public/_redirects` le fait pour Netlify et Cloudflare Pages ; à adapter ailleurs.

## Modifier les tokens

Couleurs, polices, espacements, durées et easings vivent dans `apps/web/src/styles/arcade/tokens.css`, thèmes Jour et Nuit compris. Les composants n'utilisent que ces variables.

Le nom du site et le domaine sont dans `apps/web/src/config/site.ts`.

## Pour aller plus loin

- [Direction artistique et animations](docs/design.md)
- [Contribuer](docs/contributing.md)
