# Équilibrage de Label Tycoon

Ce document dit **comment on mesure l'équilibre du jeu**, **ce qui a été réglé et pourquoi**, **où l'on en est** et **ce qui reste fragile**. Les valeurs vivent dans `packages/label-tycoon/src/balance/` ; le simulateur est `packages/label-tycoon/src/sim-balance.ts`.

## Méthode

Des **bots** jouent des parties complètes avec les mêmes actions qu'un joueur (`bots.ts`). Ils servent d'instrument de mesure, pas de modèle de ce que fera un humain : ils sont plus simples, mais déterministes et reproductibles.

| Bot         | Manière de jouer                                                                                         |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| prudent     | repère par plateforme à un rythme lent, signe seulement avec 12 000 € de réserve, ne fait jamais de prêt |
| agressif    | repère très souvent, signe vite et généreusement, emprunte dès que le palier le permet                   |
| spécialiste | se concentre sur un genre, repère par battle (genres rap) ou par plateforme                              |
| aléatoire   | actions tirées au hasard : sert de plancher de référence                                                 |

Tous renouvellent les contrats qui arrivent à échéance, produisent en mode économe quand la caisse est basse, choisissent leurs talents en comptant les fans (visibles) autant que les compétences apparentes, et ne répondent jamais aux décisions d'événements (les choix par défaut s'appliquent).

Pour chaque partie (520 semaines, soit 10 ans) on relève : faillite (et la semaine), première semaine de disque d'or, valorisation du label à 1, 5 et 10 ans, genre dominant du roster, palier atteint. Chaque stratégie joue **les mêmes graines**, ce qui permet de comparer les stratégies graine par graine.

### Les cibles

Elles portent sur les trois stratégies « sérieuses » (prudent, agressif, spécialiste) ; le bot aléatoire n'est qu'un plancher.

1. **Faillite la première année sous 2 %** (pour la pire des stratégies sérieuses).
2. **Premier disque d'or entre la 2e et la 4e année** (médiane des stratégies sérieuses : semaines 104 à 208).
3. **Aucune stratégie dominante** : aucune ne gagne plus de 55 % des graines à 10 ans (meilleure valorisation, graine par graine, entre stratégies sérieuses). La simple médiane des valorisations est un mauvais critère : les résultats d'un tycoon ont une queue très lourde (une partie sur dix vaut dix fois les autres), et un écart de médiane se voit même quand aucune stratégie ne gagne systématiquement. Le rapport donne quand même cet écart, à titre indicatif.
4. **Aucun genre dominant** : aucun genre n'est celui du roster dans plus de 40 % des parties. Les sous-genres fictifs sont regroupés sur une seule ligne.

## Résultats actuels

72 graines indépendantes (trois familles de 24 graines, `doc`, `tune` et `val`) × 4 stratégies × 520 semaines. Les familles ont été simulées à part pour détecter un réglage trop ajusté à un seul jeu de graines (voir « Historique »).

| Cible                                          | Atteinte | Mesure                                                                   |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------ |
| Faillite la première année sous 2 %            | ✔        | pire stratégie : 1,4 % (1 partie sur 72)                                 |
| Premier disque d'or entre la 2e et la 4e année | ✔        | médiane semaine 137 (an 2,6)                                             |
| Aucune stratégie dominante (≤ 55 %)            | ✔        | l'agressif gagne 51,4 % des graines (prudent 30,6 %, spécialiste 18,1 %) |
| Aucun genre dominant (< 40 %)                  | ✔        | trap, 17,4 %                                                             |

| Stratégie   | Faillites sur 10 ans | Dont 1re année | Premier disque d'or              | Valorisation à 5 ans | Valorisation à 10 ans | Palier médian |
| ----------- | -------------------- | -------------- | -------------------------------- | -------------------- | --------------------- | ------------- |
| prudent     | 4,2 %                | 1,4 %          | semaine 137 (95,8 % des parties) | 4,4 M€               | 65,5 M€               | major         |
| agressif    | 5,6 %                | 0 %            | semaine 88 (94,4 %)              | 8,5 M€               | 107,7 M€              | major         |
| spécialiste | 1,4 %                | 0 %            | semaine 182 (98,6 %)             | 2,3 M€               | 34,2 M€               | établi        |
| aléatoire   | 6,9 %                | 0 %            | semaine 191 (91,7 %)             | 1,4 M€               | 3,7 M€                | indépendant   |

Le rapport complet se régénère avec `pnpm sim:balance` (voir plus bas).

## Historique des passes

Chaque passe est partie d'un rapport, a trouvé la cause, puis a vérifié l'effet.

### Point de départ

Avec 4 graines par stratégie : l'agressif dominait (×2,6 en médiane à 10 ans) et décrochait un disque d'or dès la semaine 31, le prudent à la semaine 364. Deux causes se cumulaient :

- l'**avance « juste »** d'un artiste dépendait de sa notoriété (300 € + 30 € par point) : un artiste à 200 000 fans coûtait environ 2 500 € et rapportait environ 25 000 € par single ;
- la **commission sur les concerts** (35 %) faisait de chaque artiste signé une rente linéaire.

Les bots avaient aussi des défauts qui cachaient l'économie : aucun ne renouvelait ses contrats (roster vide dès la 2e année, faillites vers les semaines 55 à 182), et la production se bloquait sous 6 000 € en caisse.

### Passe 1 : économie et production

- **Avance juste = 300 € + 0,04 € par fan** (`CONTRACTS.advancePerFan`) : un artiste établi coûte cher, un talent brut presque rien.
- **Commission sur les concerts 35 % → 25 %** (`CONCERTS.commissionBps`).
- Bots : renouvellement des contrats, production économe, prudent plus actif mais avec réserve.
- Nouveau critère de dominance (part de graines gagnées), pour la raison donnée plus haut.

### Passe 2 : marché, rivaux, personnel

- Les rivaux raflaient les talents libres : trois talents repérés pouvaient disparaître en deux semaines. `RIVAL_AI.signChance` 0,3 → 0,2 et `RIVAL_SCOUTING.weeklyBase` 0,004 → 0,002.
- **Personnel : non modifié et non mesuré.** Aucun bot n'embauche ; le simulateur ne voit donc pas l'effet du personnel (salaire 150 € + 8 € par niveau, remise du tourneur de 0,4 % par niveau). C'est une limite connue.
- **Marché : non modifié.** L'écart entre graines vient surtout des talents tirés, pas des tendances du marché.

### Passe 3 : cibles

- **Seuils de certification ×2** (`CERTIFICATIONS.thresholds`, disque d'or à 40 000 ventes équivalentes) : le premier disque d'or arrivait en médiane à la semaine 75, il arrive vers la semaine 137.
- **Mésaventures financières plafonnées** à 35 % de la trésorerie avec un plancher de 1 000 € (`EVENTS.misfortuneCashShare`) : procès (15 000 € fixes), cyberattaque, hausse de loyer, inspection, litige fiscal, panne. Un petit label ne coule plus sur un coup du sort, un gros label paie le prix plein. Faillite la première année : de 8 % à 0 % sur les premières graines.
- Le simulateur sait répartir les graines en tranches (`--from`, `--to`) et rassembler les résultats (`--merge`).

### Passe 3, suite : validation sur des graines indépendantes

Le réglage de la passe 3 avait été fait sur 24 graines. Sur 24 graines neuves, l'agressif gagnait **66,7 %** des parties (×8 en médiane) : le réglage était ajusté à ses graines. La cause était un effet d'empilement : beaucoup d'artistes et des stars très rentables donnent une croissance exponentielle plus rapide. Correctifs :

- **Fans actifs** : au-delà de 200 000 fans, l'engagement par fan décroît (`STREAMS.fanKnee`, `fanExponent` 0,75). Les très gros publics sont plus occasionnels.
- **Plafond de roster par palier** : 6, 12, 24, 48 artistes (`ROSTER_CAP`), sans limite en bac à sable. L'écran Roster l'affiche.
- **Découverte de 5 % à 8 %** de l'audience du genre (`STREAMS.discoveryRate`) : un petit artiste gagne un peu plus, ce qui réduit les départs lents fatals.
- **Crédibilité de genre** (`CREDIBILITY`) : elle n'avait aucun effet. Elle augmente maintenant le potentiel de hit (+25 % à 100) et le prestige aux yeux des artistes du genre, et se gagne avec les certifications (+3, +5, +8).
- Bots : choix du talent par les fans ; le spécialiste scoute par plateforme pour les genres hors rap.

## Limites connues

- **Les bots ne sont pas des joueurs.** Ils ne répondent pas aux décisions, n'embauchent pas, ne construisent pas de bâtiments, n'empruntent qu'un montant fixe, ne négocient pas leurs clauses (royalties fixes à 55 % pour l'artiste). Les résultats mesurent l'économie sous ces comportements, pas la richesse du jeu.
- **Le personnel, les bâtiments et les investisseurs ne sont pas mesurés.** Rien ne garantit qu'ils soient bien dosés.
- **La dominance reste le point le plus fragile.** L'agressif gagne 51 % des graines au total, mais 66,7 % sur l'une des trois familles de 24 graines : avec 72 graines, l'incertitude sur une part de victoires est d'environ ±6 points. Relancer avec d'autres graines est la bonne vérification après toute modification.
- **Valorisations très élevées** (dizaines de millions d'euros à 10 ans pour les bons bots, à partir de 20 000 € au départ). C'est un tycoon à croissance exponentielle voulu, mais l'échelle des paliers (major à 20 M€ de chiffre d'affaires annuel) n'a pas été revue ; le mode infini (phase 10) devra s'en préoccuper.
- **Faillites sur 10 ans entre 1 % et 7 %** : acceptable pour des bots, non calibré pour des joueurs débutants. Le tutoriel et le niveau « facile » sont là pour eux.
- **Signatures impossibles** quand le roster est plein : le plafond protège l'équilibre mais peut frustrer ; à surveiller dans les retours de la session de test.

## Relancer la mesure

Une partie de 520 semaines prend quelques secondes ; 72 graines × 4 stratégies demandent une quinzaine de minutes sur un cœur. Pour utiliser 4 cœurs :

```sh
for k in 0 1 2 3; do
  pnpm sim:balance --games 24 --seed doc --from $((k*6)) --to $(((k+1)*6)) --json doc-$k.json &
done
wait
pnpm sim:balance --games 24 --seed doc --merge doc-0.json,doc-1.json,doc-2.json,doc-3.json --out rapport.md
```

Répéter avec une autre graine de départ (`--seed tune`, `--seed val`) et rassembler les trois jeux de fichiers dans un seul `--merge` pour juger sur plus de parties. Pour un simple coup d'œil : `pnpm sim:balance --games 4`.

Pour essayer un réglage sans modifier le code, un script jetable peut affecter les objets de `balance/` avant `simulateRange` (les constantes sont des objets ordinaires à l'exécution) ; il faut ensuite reporter la valeur retenue dans le fichier de `balance/` et relancer les tests.
