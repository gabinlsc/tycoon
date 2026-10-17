# @tycoon/label-tycoon

Règles de **Label Tycoon** en TypeScript pur : ni DOM ni React. L'interface vit dans `apps/web`.

- `src/balance/` : **toutes** les constantes d'équilibrage, typées et commentées. Aucun nombre magique dans les règles.
- `src/content/` : genres, noms, événements, textes de contenu (données typées, séparées de la logique).
- `src/strings/` : toutes les chaînes affichées (français), pour une future traduction.
- `src/pipeline.ts` : ordre des phases d'un tick. Chaque système enregistre sa phase sous un nom connu.
- `src/game.ts` : `createLabelGame`, `newGame`.

Les mêmes règles de déterminisme que `@tycoon/core` s'appliquent (voir son README) : pas de `Math.random`, de `Date`, de fonctions transcendantes natives. Vérifié par ESLint et par le test d'architecture.

Voir `docs/games/label-tycoon/gdd.md`.
