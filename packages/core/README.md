# @tycoon/core

Moteur de simulation **générique**, partagé par tous les tycoons. Il ne contient rien de spécifique à un jeu.

## Règles

- **Déterminisme** : pas de `Math.random`, `Date`, `performance`, ni de DOM. Tout l'aléatoire passe par le générateur à graine stocké dans l'état. Ces règles sont vérifiées par ESLint (`eslint.config.js`) et par `src/architecture.test.ts`.
- **Argent en centimes**, en entiers.
- **Fonctions pures** : `(état, action | tick) → nouvel état`.
- Les tests qui ont besoin d'une horloge (bancs de performance) sont dans des fichiers `*.test.ts` : ils sont exemptés des règles ci-dessus.

Voir `docs/games/label-tycoon/gdd.md` (section 3) pour l'architecture complète.
