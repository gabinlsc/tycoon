# @tycoon/core

Moteur de simulation **générique**, partagé par tous les tycoons. Il ne contient rien de spécifique à un jeu.

## Règles

- **Déterminisme** : pas de `Math.random`, `Date`, `performance`, ni de DOM. Tout l'aléatoire passe par le générateur à graine stocké dans l'état. Ces règles sont vérifiées par ESLint (`eslint.config.js`) et par `src/architecture.test.ts`.
- **Mathématiques portables** : `Math.exp`, `log`, `pow`, `sin`, `cos` et `**` ne sont pas identiques d'un moteur à l'autre. Utiliser `exp`, `ln`, `pow`, `powInt`, `sin`, `cos` de `@tycoon/core` (opérations IEEE exactes uniquement). Interdit par lint.
- **Argent en centimes**, en entiers.
- **Fonctions pures** : `(état, action | tick) → nouvel état`.
- Les tests qui ont besoin d'une horloge (bancs de performance) sont dans des fichiers `*.test.ts` : ils sont exemptés des règles ci-dessus.

Voir `docs/games/label-tycoon/gdd.md` (section 3) pour l'architecture complète.

## Budgets de performance

Vérifiés par `src/perf.test.ts` (seuils larges, pour attraper une régression d'ordre de grandeur sans être fragiles en intégration continue). Mesures sur une machine de développement standard :

| Opération                              | Mesure | Seuil du test |
| -------------------------------------- | ------ | ------------- |
| Copie d'un état de 2 000 artistes      | 1 ms   | 25 ms         |
| Hash de ce même état                   | 11 ms  | 60 ms         |
| 52 semaines de 12 phases (moteur seul) | 0,7 ms | 20 ms         |
| 52 semaines sur 2 000 artistes         | 12 ms  | 120 ms        |
| 1 million de tirages entiers           | 74 ms  | 400 ms        |
| 200 000 gaussiens                      | 53 ms  | 400 ms        |
| 200 000 × `exp`, `ln`, `sin`, `cos`    | 88 ms  | 400 ms        |

Objectif du jeu : 52 semaines en moins de 200 ms (≈ 3,8 ms par semaine) et 10 ans en moins de 3 s. Le moteur n'en consomme qu'une petite part.

## Expliquer un calcul

`explain()` (module `explain`) construit un résultat **et** la liste ordonnée des termes qui l'ont produit (`term`, `scale`, `offset`, `limit`). La somme des contributions est toujours exactement la valeur finale. Les formules du jeu renvoient un `Explained` plutôt qu'un nombre nu, et l'interface en fait une infobulle (« d'où vient ce chiffre »). Les termes portent une clé, jamais de texte : les libellés sont dans les chaînes du jeu.
