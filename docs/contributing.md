# Contribuer

## Installation

```
pnpm install
pnpm dev        # serveur de développement
pnpm check      # lint, typecheck, tests et build
```

Prérequis : Node 20 ou plus, pnpm 10.

## Règle d'or : une feature = une PR

Une fonctionnalité, une branche, une PR, un commit sur `main` (merge en squash). On ne commit jamais directement sur `main`.

## Cycle d'une feature

1. Partir de `main` à jour.
2. Créer une branche `feat/<nom-court>` (ou `fix/`, `chore/`, `refactor/`, `docs/`).
3. Faire des commits atomiques au format Conventional Commits, en français : `feat(hero): pièces flottantes avec parallaxe`.
4. Avant de pousser, tout doit passer : `pnpm check` (lint, typecheck, tests, build). Ne jamais pousser une branche rouge.
5. Pousser la branche et ouvrir la PR. Le titre suit le format Conventional Commits, car il devient le message du commit sur `main`. La description dit ce qui change et comment tester.
6. Merger en squash et supprimer la branche.
7. Repartir de `main` à jour.

## Conventional Commits

Types : `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`. Portée entre parenthèses (`navbar`, `hero`, `jeux`, `a11y-perf`…). Sujet à l'impératif ou au présent, sans point final. Le corps explique le pourquoi quand il n'est pas évident.

## Messages et traces

Les messages de commit, titres et descriptions de PR, noms de branches, commentaires de code et documentation sont écrits comme par l'auteur du dépôt : aucun trailer (`Co-Authored-By` ou autre), aucune signature d'outil, aucun pied de page généré. Avant chaque push, vérifier les messages :

```
git log --format=%B origin/main..HEAD
```

En cas de trace, réécrire les messages concernés (`git commit --amend` ou rebase) avant de pousser.

## Conventions de code

- TypeScript strict, aucun `any`.
- Composants découpés et nommés clairement, un dossier par section dans `apps/web/src/components`.
- Styles : variables de `tokens.css` uniquement, un fichier CSS par section dans `apps/web/src/styles`.
- Contenu des jeux dans `data/games.ts`, marque et domaine dans `config/site.ts`.
- Commenter là où la logique n'est pas évidente (marche aléatoire, orchestration des animations).
- Tout le texte de l'interface en français.

## Références

La direction artistique, les tokens, les interdits et les principes d'animation sont dans [`design.md`](./design.md). À relire au début de chaque session.
