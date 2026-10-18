# Défi du jour : contrat d'API

Le défi du jour est le même monde pour tous : la graine découle de la date (UTC). Le client joue 52 semaines, puis envoie son **journal d'actions** ; le serveur **rejoue** la partie avec le même code que le jeu et ne retient que le score qu'il a lui-même recalculé. Dans cette version, le serveur est simulé dans le navigateur (`creerServeurSimule`) ; un vrai serveur le remplacera sans toucher au jeu (`creerServeurHttp` implémente déjà le client).

Les types vivent dans `packages/label-tycoon/src/defi-validation.ts` ; le code de validation (`validerSoumission`) est pur, sans dépendance au navigateur, et peut tourner tel quel côté serveur.

## Règles du défi

- **Date** : jour UTC, au format `AAAA-MM-JJ`.
- **Graine** : `defi-AAAA-MM-JJ`. Une graine qui ne correspond pas à la date est refusée par le moteur.
- **Réglages** : difficulté normale, mode `defi`, aucune option de bac à sable. Ils sont fixés par `configDefi(date)`.
- **Durée** : exactement 52 semaines. Au-delà, le moteur n'avance plus et refuse toute action (`defi-termine`).
- **Score** : valorisation finale du label en euros, entière ; 0 en cas de faillite.

## Journal d'actions

Le journal contient les actions **acceptées** par le jeu, dans l'ordre, chacune avec la semaine (`tick`, nombre de semaines déjà simulées) à laquelle elle a été jouée. L'avance du temps n'est pas une action : elle se déduit des semaines. Les actions sont de la donnée JSON simple (voir `LabelAction`).

```json
{ "tick": 12, "action": { "type": "reperer", "source": "battle" } }
```

## Soumettre un défi

`POST /defi/soumissions`, corps JSON :

```json
{
  "version": 1,
  "date": "2026-10-18",
  "semaines": 52,
  "scoreAnnonce": 184250,
  "pseudo": "Gabin",
  "journal": [{ "tick": 0, "action": { "type": "renommer-label", "nom": "Neon Dust" } }]
}
```

| Champ          | Contrainte                                                                                |
| -------------- | ----------------------------------------------------------------------------------------- |
| `version`      | `1` (version du contrat)                                                                  |
| `date`         | `AAAA-MM-JJ`, date réelle                                                                 |
| `semaines`     | exactement `52`                                                                           |
| `scoreAnnonce` | nombre fini                                                                               |
| `pseudo`       | facultatif ; affiché dans le classement (« Anonyme » sinon)                               |
| `journal`      | liste d'au plus 5 000 entrées `{ tick, action }`, `tick` entier ≥ 0, `action.type` chaîne |

### Réponse

Toujours un corps JSON de type `ReponseValidation`. Un refus n'est pas une erreur serveur : HTTP 200 ou 422 sont tous deux acceptés par le client, qui lit le corps dans les deux cas.

Succès :

```json
{ "statut": "valide", "date": "2026-10-18", "semaines": 52, "score": 184250 }
```

Refus :

```json
{
  "statut": "refuse",
  "code": "score-different",
  "message": "Le rejeu donne 90000 € et non 184250 € : score refusé.",
  "scoreRecalcule": 90000
}
```

| Code                | Cause                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------- |
| `format`            | corps qui n'est pas un objet, score ou journal du mauvais type                          |
| `version`           | version de contrat inconnue                                                             |
| `date`              | date invalide                                                                           |
| `semaines`          | durée différente de 52                                                                  |
| `journal-trop-long` | plus de 5 000 entrées                                                                   |
| `journal-invalide`  | entrée mal formée, ou journal impossible à rejouer                                      |
| `action-refusee`    | une action est refusée au rejeu, ou le journal est mal ordonné ou dépasse la semaine 52 |
| `score-different`   | le score rejoué diffère du score annoncé (`scoreRecalcule` donne le vrai)               |

## Validation par rejeu

```text
graine  = "defi-" + date
état    = initialState(graine, configDefi(date))
session = labelGame.replay(graine, état, journal, 52)
score   = scoreDefi(session.engine.data, 52)
valide  = (score == scoreAnnonce)
```

Le rejeu est déterministe (voir `docs/games/label-tycoon/` et les tests du cœur) : même graine, mêmes actions, même résultat, au bit près. Un journal falsifié donne un autre déroulé ; il est refusé soit parce qu'une action n'est plus valide, soit parce que le score diffère. `validerSoumission` ne lève jamais d'exception.

## Classement

`GET /defi/classement?date=AAAA-MM-JJ` renvoie les dix meilleurs scores **validés** du jour, du plus haut au plus bas, un score par pseudo :

```json
[{ "pseudo": "Gabin", "score": 184250 }]
```

## Ce que le serveur doit en plus (hors de cette version)

- Authentifier le pseudo (compte), sinon n'importe qui peut usurper un pseudo.
- Limiter le débit des soumissions (un rejeu de 52 semaines coûte quelques dizaines de millisecondes).
- Refuser les dates trop éloignées du jour courant.
