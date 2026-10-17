# Label Tycoon : game design document

> Statut : **proposition soumise à validation**. Aucun code de jeu n'est écrit tant que ce document et la [roadmap](./roadmap.md) ne sont pas validés.
>
> Convention : tout ce qui est marqué **[PROPOSITION]** est une idée ajoutée par rapport à la demande initiale. Le reste en découle directement. Toutes les valeurs numériques sont des **valeurs de départ**, destinées à vivre dans `packages/label-tycoon/src/balance/` et à être recalées par simulation.

## 1. Vision

Tu dirigeras un label de musique urbaine et pop fictif, du home-studio à la major, puis au-delà. Le joueur repère des talents, les signe, produit leurs sorties, gère leurs carrières et leurs egos, bat des labels rivaux et ne doit jamais faire faillite.

Quatre piliers :

1. **Profondeur lisible** : beaucoup de systèmes, mais chaque chiffre est expliqué (infobulles, rapport mensuel). Le joueur comprend toujours pourquoi il gagne ou perd.
2. **Rejouabilité** : tout est procédural et à graine. Deux parties ne se ressemblent pas, mais une même graine se rejoue à l'identique.
3. **Équilibre mesuré** : un script de simulation joue des centaines de parties avec des bots et valide les cibles d'équilibrage.
4. **Un tycoon infini** : il n'y a pas de « fin » obligatoire. Les paliers s'enchaînent bien au-delà de la major, le monde évolue par ères, les artistes vieillissent et passent le relais. Voir la section 14.

### Durées visées

| Étape                                   | Durée de jeu visée                                      |
| --------------------------------------- | ------------------------------------------------------- |
| Tutoriel « Ton premier signataire »     | 15 à 20 min                                             |
| Premier disque d'or (joueur moyen)      | entre la 2e et la 4e année de jeu, soit 1 à 3 h réelles |
| Label établi                            | 6 à 10 h                                                |
| Major                                   | 15 à 25 h                                               |
| Au-delà (Groupe, Conglomérat, Héritage) | illimité, nouvelle partie « Héritage » à chaque cycle   |

## 2. Écarts avec la demande initiale (à valider)

Le prompt et le dépôt actuel divergent sur quelques points. Voici ce que je propose, pour que tu tranches.

1. **Direction artistique.** Le prompt décrit la direction « journal » (papier, encre, une couleur d'accent, aucun glow). Or `docs/design.md` a été réécrit : le portail est désormais **cartoon / jeu mobile** (contours épais, ombres pleines, couleurs saturées, thèmes Jour et Nuit). Les deux documents se contredisent. **Je suis `docs/design.md`**, qui est la référence à jour. L'idée « univers du disque » est conservée : pochettes de vinyles en SVG, crédits façon notes de pochette, classements façon hit-parade, console de studio dessinée au trait, le tout habillé avec les codes arcade (contours épais, pastilles, boutons 3D).
2. **Le journal.** Le portail n'a plus de journal _Le Tycoon_. Je propose d'appeler le fil d'actualité du jeu **« La Une du label »** : des coupures de presse générées, dans la direction artistique actuelle. Le nom reste modifiable (chaînes centralisées).
3. **Route.** Le portail sert les jeux sur `/jeux/<slug>` via `games/registry.ts` (chargement à la demande). Label Tycoon est donc rendu dans l'emplacement de jeu de `/jeux/label-tycoon`, avec l'introduction cinématique existante. **Je propose en plus un alias `/label`** qui redirige vers cette page, pour respecter la demande.
4. **Sauvegardes.** Le compte du portail stocke ses sauvegardes dans `localStorage` (petites données, via `useGameSave`). Une partie de Label Tycoon est trop grosse : le jeu utilise **IndexedDB**, dans une base propre, avec des clés préfixées par l'identifiant du compte (ou `invite` si personne n'est connecté). **[PROPOSITION]** J'ajoute à `AccountStore` une méthode optionnelle d'enregistrement de métadonnées de sauvegarde, pour que la page de compte affiche et efface aussi les parties de Label Tycoon.
5. **Identité Git.** Le prompt contient un e-mail à remplir (`<TON_EMAIL_NOREPLY_GITHUB>`). Je continue avec l'identité configurée depuis le début du dépôt (`Gabin LESCOAT`, `lescoatgabin@gmail.com`). Dis-moi si tu veux la changer.
6. **Dépendances à ajouter** : `fast-check` (tests de propriétés, développement), `zod` (validation des sauvegardes importées, chargé avec le jeu uniquement). Aucune autre bibliothèque de simulation, pas de bibliothèque de graphiques (SVG maison).

## 3. Architecture

### 3.1 Découpage

```
packages/core            moteur générique (aucune notion de musique)
packages/label-tycoon    règles du jeu, TypeScript pur (ni DOM ni React)
apps/web                 interface : src/games/label-tycoon/ (chargé via registry.ts)
```

Dépendances autorisées : `apps/web` → `label-tycoon` → `core`. Jamais dans l'autre sens. Un test d'architecture vérifie qu'aucun import de `react`, `window`, `document` n'existe dans les deux packages.

### 3.2 Contenu de `packages/core`

| Module    | Rôle                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `rng`     | xoshiro128**, état de 4 entiers 32 bits sérialisable. Tirages : entier, flottant, gaussien (Box-Muller sans état caché), choix pondéré, mélange, **flux indépendants** par système.  |
| `money`   | Type `Cents` (entier). Opérations : addition, multiplication par un taux, répartition proportionnelle sans perte de centime, arrondi unique et centralisé (`roundHalfEven`).         |
| `sim`     | Boucle de ticks : `step(state, ctx)` pur, avance d'une semaine par appel, pipeline de phases ordonnées et nommées.                                                                   |
| `actions` | Commandes typées du joueur, `applyAction(state, action)` pur, validation (une action invalide renvoie une erreur typée sans modifier l'état), journal ordonné `{ semaine, action }`. |
| `events`  | Moteur d'événements : conditions, poids, délai de recharge, choix, conséquences immédiates ou différées, chaînes. Tout est de la donnée typée.                                       |
| `save`    | Enveloppe versionnée `{ schema, version, createdAt, state, journal }`, migrations enchaînées, hash d'état.                                                                           |
| `replay`  | `replay(seed, journal) → état` : applique le journal semaine par semaine. Garantit l'égalité au bit près avec la partie jouée.                                                       |
| `math`    | Interpolation, courbes (logistique, exponentielle, gaussienne), `clamp`, `lerp`, tables de probabilités, moyennes pondérées, escompte (actualisation).                               |
| `hash`    | Sérialisation canonique (clés triées, pas de `undefined`) puis empreinte 64 bits (FNV-1a). Sert aux tests, au replay et à la validation du défi du jour.                             |

### 3.3 Règles de déterminisme

- Interdits dans `core` et `label-tycoon` : `Math.random`, `Date.now`, `new Date()`, `performance.now`, `crypto.getRandomValues`, itération sur un `Set` ou un `Map` dont l'ordre dépendrait de l'insertion non contrôlée. Une règle ESLint (`no-restricted-globals` et `no-restricted-properties`) fait échouer le lint.
- La date réelle n'entre jamais dans la simulation. Pour le défi du jour, la **seed est calculée par l'interface** (date → seed) puis transmise à `newGame`.
- **Un flux aléatoire par système** (`rng.market`, `rng.scouting`, `rng.production`, `rng.events`, `rng.rivals`, `rng.names`…), dérivés de la seed maîtresse. Ainsi, ajouter un tirage dans un système ne décale pas tous les autres (les replays et les graines partagées restent stables d'une version à l'autre). **[PROPOSITION]**
- L'argent est stocké en centimes, en entiers. Les formules calculent en flottants puis passent par une fonction d'arrondi unique avant d'écrire dans l'état. Aucun flottant n'est jamais persisté pour l'argent.
- La simulation est une fonction pure : `(état, action | tick) → nouvel état`. L'implémentation peut muter une copie en interne pour la performance, jamais l'état reçu.
- Les identifiants (artistes, sorties, contrats) viennent d'un compteur dans l'état, pas d'un UUID.

### 3.4 Web Worker

- Le worker possède l'état de simulation. L'interface lui envoie des **commandes** (`action`, `setSpeed`, `step`, `save`, `load`) et reçoit des **instantanés** (vues dérivées, pas l'état brut complet) et des **notifications**.
- Les écrans demandent des vues précises (`getRoster`, `getChart(week)`…) plutôt qu'un gros objet : on évite de cloner l'état entier à chaque tick à ×4.
- Le moteur tourne à vitesse maximale sans figer l'interface. Un pilote de test exécute le même code sans worker (même interface), ce qui permet les tests et le script d'équilibrage.
- **[PROPOSITION]** Le journal d'actions est tenu dans le worker et sauvegardé avec la partie : c'est lui qui permet le replay, la validation du défi du jour et un futur « mode spectateur ».

### 3.5 Données et équilibrage

- `packages/label-tycoon/src/balance/` : un fichier typé et commenté par domaine (`quality.ts`, `streams.ts`, `contracts.ts`, `finance.ts`, `staff.ts`, `buildings.ts`, `rivals.ts`, `tiers.ts`, `events.ts`, `touring.ts`, `market.ts`, `scouting.ts`, `difficulty.ts`). Aucun nombre magique dans les règles.
- `packages/label-tycoon/src/content/` : genres, noms, villes, traits, événements, scénarios, articles de presse. De la donnée typée, séparée de la logique.
- `packages/label-tycoon/src/strings/fr.ts` : toutes les chaînes affichées, avec variables typées. Aucune chaîne en dur dans les composants ni dans les règles.
- Les **réglages de difficulté** (budget de départ, agressivité des rivaux, volatilité) sont des multiplicateurs appliqués sur `balance/`, enregistrés dans la partie (ils font partie du hash).

## 4. Le temps

- 1 tick = 1 semaine, 52 semaines par an. La semaine 1 d'une année commence après la semaine 52 de la précédente.
- Vitesses : pause, ×1, ×2, ×4, « avancer d'une semaine ». Le rythme réel par semaine (par exemple 1,2 s à ×1) est un réglage de l'interface, hors simulation.
- **Pipeline d'un tick** (ordre fixe, documenté et testé) :
  1. effets différés et événements programmés qui arrivent à échéance ;
  2. marché : tendances de genre, sous-genres, ères ;
  3. rivaux : décisions (signatures, sorties, enchères) ;
  4. production : avancement des projets, retards, livraisons ;
  5. sorties de la semaine (joueur, rivaux, bruit de marché) ;
  6. streams, viralité, fanbase, hype ;
  7. classements et certifications ;
  8. concerts, tournées, merch, physique, synchro ;
  9. artistes : compétences, moral, fatigue, carrière ;
  10. personnel : moral, progression, départs, décisions déléguées ;
  11. finances : revenus, dépenses, intérêts, entretien, faillite ;
  12. tirage des événements ;
  13. palier du label, objectifs, succès ;
  14. journal de presse et notifications ; auto-pause éventuelle.
- **Auto-pause** réglable par type : décision requise, offre d'un rival, fin de contrat, crise financière, sortie importante, nomination aux cérémonies, artiste en danger (burnout). La pause se déclenche à la fin du tick qui produit la notification.
- **Boîte de réception** : notifications (lecture seule) et décisions (avec échéance en semaines). Une décision qui expire déclenche son option par défaut, affichée à l'avance dans la décision (« si tu ne réponds pas : … »).

## 5. Systèmes de jeu

### 5.1 Le label

**Ressources** : trésorerie (centimes), réputation du label (0-100), crédibilité par genre (0-100 par genre), capacité de production (projets simultanés).

**Paliers** (réputation, chiffre d'affaires annuel glissant sur 52 semaines, certifications cumulées) :

| Palier               | Réputation | CA annuel | Certifications | Débloque                                                                                     |
| -------------------- | ---------- | --------- | -------------- | -------------------------------------------------------------------------------------------- |
| 1. Home-studio       | départ     | départ    | aucune         | studio niv. 1, 2 slots de production, repérage de base                                       |
| 2. Label indépendant | 20         | 150 000 € | 1 or           | pressage, personnel (A&R, ingénieur du son), prêts bancaires, accords de distribution locaux |
| 3. Label établi      | 45         | 1,5 M€    | 1 platine      | directeur financier, bureaux, investisseurs, tournées nationales, synchro régulière          |
| 4. Major             | 75         | 20 M€     | 1 diamant      | salle de concert, export international, rachat de rivaux, sous-labels                        |

Ces seuils sont des valeurs de départ.

**Le jeu change de nature à chaque palier** :

- Home-studio : le joueur fait tout lui-même, semaine par semaine, avec très peu d'argent. Chaque décision pèse.
- Indépendant : premières délégations (dénicheur, ingénieur). Le joueur gère un petit roster et sa trésorerie.
- Établi : le personnel prend des décisions en son nom, avec des erreurs. Le joueur pilote par objectifs et budgets.
- Major : gestion de portefeuille. Le joueur définit une stratégie, des enveloppes par genre, et arbitre les exceptions.

**Valorisation (score principal)** = trésorerie + valeur du catalogue (royalties futures estimées, actualisées) + valeur des contrats en cours − dettes. Le catalogue est estimé par extrapolation de la traîne longue de chaque sortie sur un horizon borné, escomptée par un taux défini dans `balance/finance.ts`.

### 5.2 Les artistes

Tous fictifs, générés par procédure. **Aucun vrai nom d'artiste, de label ou de titre.** Un test de contenu vérifie les listes de noms contre une liste d'exclusion maison.

**Attributs statiques (0-100)** :

- visibles après repérage : `plume`, `flow` (ou `voix` pour les genres chantés), `charisme`, `scene` (présence scénique) ;
- cachés jusqu'à un repérage poussé : `potentiel`, `ethique`, `ego`, `loyaute`, `polyvalence`.

**Attributs dynamiques** : `hype`, `moral`, `fatigue` (0-100), `fanbase` (entier), `notoriete` (log de la fanbase, 0-100), `rue` (crédibilité de rue, 0-100), `affinite` avec le label (−100 à +100).

**Identité** : genre principal, genres secondaires, âge, ville d'origine fictive, nom de scène, vrai nom, 1 à 3 traits narratifs tirés d'une liste (`perfectionniste`, `fetard`, `discret`, `provocateur`, `bosseur`, `diva`, `loyal`, `opportuniste`, etc.). Chaque trait modifie des paramètres précis (ego, fatigue accumulée, probabilité de scandale, loyauté).

**Courbe de carrière** : `emergent → montee → pic → plateau → declin`, avec deux issues du déclin : `retour_en_grace` ou `culte`. Chaque artiste a un **âge de pic caché** (et une variance). Les compétences tendent vers le potentiel avec une vitesse :

```
v = base × (0,5 + éthique/100) × (0,7 + 0,6 × niveauProducteurMoyen/100) × (0,6 + 0,8 × moral/100) × courbeCharge(volumeTravail)
```

`courbeCharge` : trop peu de travail = stagnation, volume optimal = 1, trop de travail = la fatigue annule le gain.
Après le pic, le déclin se freine par une **réinvention** (changement de genre, collaboration marquante) et s'accélère par un échec, un scandale ou la fatigue.

**Moral** : dérive vers 60. Monte avec les succès, les promesses tenues et un budget à la hauteur de l'ego. Baisse avec les conflits, l'épuisement, les comparaisons défavorables avec un autre artiste du roster, les sorties repoussées. Un moral bas réduit la qualité des sorties et augmente le risque de départ ou de scandale.

**Ego** : les exigences (avance, budget, priorité, mise en avant) croissent avec la notoriété et l'ego.

**[PROPOSITION] Relations entre artistes** : chaque paire du roster a une relation (rivalité, amitié, mentor) qui évolue selon les budgets, les featurings, les classements. Elle alimente les événements (clash, collaboration spontanée) et le moral.

**[PROPOSITION] Mentorat** : un artiste au pic peut parrainer un émergent (même genre) : bonus de progression pour le second, bonus de loyauté pour le premier. Prépare la section 14 (génération suivante).

**[PROPOSITION] Santé mentale et pauses** : un artiste très fatigué peut demander un congé. L'accepter coûte une période sans sortie mais remet fatigue et moral. Le refuser fait grimper le risque de burnout.

### 5.3 Le repérage (brouillard de guerre)

- **Sources** : open mics, plateforme de streaming amateur fictive, battles, recommandations d'un artiste du roster, candidatures spontanées, rues et festivals en saison.
- Chaque talent repéré a des **fourchettes** par attribut : `[min, max]` autour de la vraie valeur. Largeur initiale selon la source. Elle se resserre avec :
  - la qualité du dénicheur (A&R),
  - le temps passé à observer (le nombre de semaines de suivi),
  - le budget d'investigation (détective privé, essais studio).
- Un dénicheur peut **se tromper** : biais systématique (± quelques points) selon son genre de prédilection, tiré une fois à l'embauche.
- Les attributs cachés (`potentiel`, `ego`…) n'apparaissent qu'au palier de repérage « poussé » (essai en studio payant).
- Les rivaux repèrent aussi : un talent suivi peut être signé ailleurs. Le jeu affiche la **probabilité** qu'un rival ait lui aussi ce talent sur son radar quand ton dénicheur est assez bon pour le savoir.
- **[PROPOSITION]** Les talents ont une **fenêtre** : s'ils ne sont pas signés assez vite, ils s'auto-produisent, montent et deviennent plus chers (ou partent chez un rival).

### 5.4 Les contrats et la négociation

**Clauses** : avance (centimes), pourcentage de royalties pour l'artiste, durée (sorties ou années), exclusivité, contrat 360 (part sur concerts, merch, synchro), clause de rachat, options de prolongation, budget minimum garanti par sortie.

**Négociation** :

- Constructeur à curseurs. Une **jauge de réaction** (mécontent, hésitant, intéressé, enthousiaste) se met à jour en direct. Elle vient d'un score d'**utilité** de l'offre pour l'artiste :

  `utilité = Σ poids_clause × valeur_clause − pénalités`, comparée à un **seuil d'acceptation** qui dépend de la notoriété, de l'ego, des offres concurrentes, de la réputation et de la crédibilité du label dans son genre.

- 3 contre-propositions maximum. Une offre **insultante** (utilité très inférieure au seuil) coûte de l'affinité avec l'artiste pour toute la partie.
- **Enchères** contre les rivaux : tours successifs, les rivaux enchérissent selon leur personnalité et leur budget.
- Les contrats sont **respectés ou rompus avec conséquences** : un artiste lésé peut aller en justice ; le juriste réduit le risque.
- Fin de contrat : renégocier, prolonger, laisser partir. Un artiste parti chez un rival devient un concurrent direct (et peut contre-attaquer par un clash).
- **[PROPOSITION]** **Clauses sociales** : exclusivité de featuring, clause de moralité, clause de territoire. Elles ajoutent de la profondeur aux gros contrats sans multiplier les curseurs de départ (elles apparaissent avec le palier « Établi »).

### 5.5 La production

**Types** : single, EP, album, mixtape (chacun avec un nombre de titres, un coût de base, une durée de base, un poids pour les classements).

**Paramètres d'une sortie** : artiste principal, featurings (internes ou externes payants), producteur (interne ou externe, avec attributs et genres de prédilection), niveau du studio, budget de mixage/mastering, clip (aucun, petit, gros), budget marketing, date de sortie.

**Durée** : type de sortie × facteur (éthique de l'artiste, charge du studio). Retards possibles, matérialisés par un événement.

**Qualité d'un titre Q (0-100)** :

```
Q_base = 0,35 × talent artistique
       + 0,20 × niveau du producteur
       + 0,15 × adéquation genre producteur / genre artiste
       + 0,10 × niveau du studio
       + 0,10 × qualité du mixage
       + 0,10 × synergie des featurings

Q = clamp(Q_base × (0,85 + 0,30 × moral/100) + N(0, 6), 0, 100)
```

`talent artistique` = moyenne pondérée de `plume` et `flow` (ou `voix`) selon le genre (poids dans `balance/quality.ts`). Le bruit gaussien vient du flux `rng.production`. Pour un EP ou un album, la qualité de la sortie est une moyenne pondérée des qualités des titres, avec une pénalité de **remplissage** pour les albums trop longs par rapport au talent.

**Potentiel de hit** :

```
H = (Q/100)^1,5 × tendanceGenre (0,5 à 1,5) × (1 + hype/100) × facteurMarketing
facteurMarketing = min(1 + 0,5 × log10(1 + budgetMarketing/1000 €), plafond)
```

**Concurrence de calendrier** : la même semaine qu'une grosse sortie rivale dans le même genre, l'exposition de la semaine 1 est fortement réduite (facteur dans `balance/streams.ts`). Les rivaux annoncent parfois leurs dates, ce qui permet de contourner.

**Estimation avant sortie** : l'écran de studio affiche une **fourchette** de qualité (pas la valeur), dont la largeur dépend de l'ingénieur du son et de l'A&R.

**[PROPOSITION]** **Réalisation de maquette** : un budget minime permet de tester un titre (un échantillon de public) pour resserrer la fourchette de qualité avant de s'engager.

### 5.6 Le marché, les streams et les classements

**Streams hebdomadaires d'une sortie** :

```
S1   = (fanbase × écoutesParFan + audienceGenre × tauxDécouverte) × H
S(t) = S1 × e^(−λ × t) + traîneLongue × S1
λ    = 0,35 − 0,20 × Q/100
```

**Performance** : seules les sorties dans leur **fenêtre active** (par exemple 26 semaines) sont simulées chaque semaine. Au-delà, la traîne est agrégée en forme fermée par sortie (revenu hebdomadaire constant décroissant lentement). Cela maintient le coût d'un tick quasi constant même avec un catalogue énorme.

**Viralité** : chaque semaine, `p = base × H × bonusCommunityManager`. En cas de déclenchement, streams × (5 à 20) pendant 3 à 6 semaines. Le tirage et la durée utilisent `rng.market`.

**Fanbase** : `Δfans = streams × tauxConversion × (charisme/50)`. **Hype** : monte avec sorties, clips, buzz, positions au classement ; baisse d'environ 5 % par semaine.

**Classements** : Top 50 singles et Top 50 albums, hebdomadaires. Ils regroupent les sorties du joueur, celles des rivaux, et un **bruit de marché** (sorties générées de façon crédible pour peupler les classements). Historique par sortie : entrée, meilleure position, semaines classées.

**Certifications** : or, platine, diamant. Seuils et conversion streams → équivalent ventes dans `balance/streams.ts`. Les seuils peuvent évoluer d'une ère à l'autre (un disque d'or est plus facile à l'ère du streaming de masse) **[PROPOSITION]**.

**Revenus** :

- streaming : revenu par stream configurable (modifié par les ères et les événements), partagé selon les royalties ;
- physique : vinyles, CD, avec commande de production, stock et invendus ;
- concerts et merch (si contrat 360) ;
- synchronisation : offres reçues par événements (publicités, films, jeux vidéo fictifs).

### 5.7 Les tendances de genre

- Chaque genre a une **popularité** qui suit une marche aléatoire avec **retour à la moyenne** et **cycles** (somme d'une composante lente et d'une composante saisonnière).
- Des **sous-genres émergent et disparaissent** : un sous-genre naît d'un genre parent (nom fictif généré), grimpe, atteint un pic, retombe. Le premier label à y signer gagne un gros bonus de crédibilité.
- **Veille** : études de marché et dénicheurs spécialisés donnent des **prévisions bruitées** (erreur proportionnelle à la qualité de l'analyste).
- Genres de départ (noms génériques) : rap, drill, afro, R&B, pop urbaine, électro-pop, trap latin, variété contemporaine… Sous-genres générés ensuite.
- **[PROPOSITION]** **Scènes locales** : chaque ville fictive a un profil de genres. Repérer dans une scène émergente donne un avantage (et alimente l'export international plus tard).

### 5.8 Le personnel

**Rôles** : dénicheur (A&R), producteur interne, ingénieur du son, attaché de presse, community manager, tourneur, juriste, directeur financier (palier « Établi »).

Chaque membre a : niveau, spécialité (genre ou domaine), salaire, moral, trait (par exemple « ambitieux » : peut partir chez un rival), expérience qui le fait progresser. Les candidats sont générés (marché de l'emploi qui se renouvelle).

**Délégation** : le joueur peut déléguer des décisions (le dénicheur propose des signatures, le directeur financier gère les prêts, l'attaché de presse répond aux crises mineures). La **qualité** de la décision déléguée dépend du niveau du membre ; une mauvaise décision est visible dans le rapport mensuel.

**[PROPOSITION]** **Règles de délégation** : le joueur fixe un cadre (budget maximum, genres autorisés, seuil d'alerte). Le personnel agit dans ce cadre, jamais au-delà. C'est le levier principal du palier « Major ».

### 5.9 Les bâtiments

| Bâtiment            | Niveaux | Effet principal                                              | Débloqué        |
| ------------------- | ------- | ------------------------------------------------------------ | --------------- |
| Studio              | 1 à 5   | niveau du studio dans Q, capacité de production, vitesse     | départ          |
| Salle de répétition | 1 à 3   | progression des artistes, baisse de fatigue                  | indépendant     |
| Bureaux             | 1 à 4   | capacité en personnel, bonus d'efficacité administrative     | départ (niv. 1) |
| Pressage            | 1 à 3   | coût et délai du physique                                    | indépendant     |
| Salle de concert    | 1 à 3   | concerts maison, revenus de billetterie, scène de découverte | major           |

Chaque bâtiment : coût de construction, coût d'entretien hebdomadaire, effets numériques précis dans `balance/buildings.ts`.

### 5.10 Les concerts et tournées

- **Taille des salles** par notoriété. Billetterie : prix, taux de remplissage, coûts (salle, équipe, transport, assurance).
- La **présence scénique** influe sur les critiques et la conversion en fans.
- Une tournée augmente la fatigue. Trop longue : burnout (événement grave). Le tourneur améliore la rentabilité et le routage.
- Le **merch** se vend en tournée, avec un stock à gérer.
- **[PROPOSITION]** **Festivals** : candidatures en saison, cachets, effets de hype ; un artiste en tête d'affiche fait grimper la crédibilité du label.

### 5.11 Les finances

- Compte de résultat hebdomadaire, mensuel, annuel. Graphiques : trésorerie, revenus par source, dépenses par poste.
- **Prêts bancaires** : montant, taux, durée. Le taux dépend de la réputation et de l'historique de remboursement.
- **Investisseurs** : apport de cash contre une part de la valorisation finale et des objectifs à tenir (non-respect = pénalités ou prise de contrôle partielle).
- **Faillite** : trésorerie négative pendant **8 semaines consécutives** = fin de partie. Dès que la trésorerie devient négative : alerte claire et options de sauvetage (vendre un contrat, emprunter, licencier). Le compteur est affiché en permanence.
- Vente de contrats d'artistes à des rivaux.
- **[PROPOSITION]** **Fiscalité** : impôt annuel sur les bénéfices, avec optimisation possible (et contrôle fiscal en événement). Évite l'accumulation infinie de trésorerie.

### 5.12 Les labels rivaux

3 à 5 rivaux générés à chaque partie, avec une **personnalité** :

- **la major conservatrice** : beaucoup d'argent, valeurs sûres ;
- **l'indé pointu** : repère tôt, forte crédibilité de genre ;
- **le copieur** : se jette sur les genres qui montent ;
- **le prédateur** : débauche en fin de contrat ;
- **le label en déclin** : vend catalogue et artistes.

Les rivaux **utilisent exactement les mêmes règles** que le joueur (mêmes formules de qualité, de streams, de contrats). Seule exception : un **bonus de difficulté** explicite et réglable (multiplicateur de trésorerie ou de vitesse de repérage).

Chaque rival décide par un **utilitaire** : `score(action) = Σ poids_personnalité × gain_attendu − risque`, évalué sur un nombre borné d'actions candidates par semaine (performance). Les rivaux évoluent : un rival qui monte change de personnalité dominante, un rival qui s'effondre peut être racheté ou disparaître et un nouveau apparaître (ère suivante).

Écran concurrence : valorisation, roster public, parts de marché par genre, historique des affrontements. Interactions : enchères, débauchage, clashs entre artistes, offres de rachat (dans les deux sens).

### 5.13 Les événements

Moteur dans `core` : conditions de déclenchement, poids, délai de recharge, choix multiples, conséquences immédiates ou différées, chaînes d'événements. Au moins **60 événements à la V1**, puis extension continue (voir section 14).

| Catégorie  | Exemples                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------- |
| Artistes   | caprice, burnout, conflit interne, demande d'augmentation, vol d'idée, retour inattendu       |
| Production | retard de studio, fuite d'un titre, sample non déclaré, featuring surprise                    |
| Marché     | nouveau sous-genre, changement de rémunération des plateformes, saison des festivals          |
| Médias     | clash public, polémique, interview ratée, buzz positif                                        |
| Business   | offre de synchro, offre de rachat, contrôle fiscal, procès                                    |
| Cérémonies | remise de prix annuelle fictive, nominations et gagnants simulés selon les sorties de l'année |

Textes au ton de presse, vivants, avec variables (noms, chiffres). **Les conséquences d'un choix s'affichent clairement après qu'il est fait** (récapitulatif lisible : ce qui change, de combien).

Chaque événement est une donnée typée : `id`, `catégorie`, `conditions`, `poids`, `recharge`, `texte`, `choix[]` (chacun avec `effets` immédiats et différés, et `suite` éventuelle).

### 5.14 La Une du label

Fil d'actualité du label, présenté comme une collection de coupures de presse dans la direction artistique du portail. Les articles sont **générés à partir des événements de la partie** (sorties, classements, signatures, clashs, faillites de rivaux), avec des gabarits de titres et d'accroches variés pour éviter la répétition. Il raconte l'histoire du label et sert d'archive (consultable, filtrable).

## 6. Modes de jeu

1. **Carrière** : partie libre, objectif de devenir la première major du pays, puis poursuite possible en mode infini. Difficulté réglable : budget de départ, agressivité des rivaux, volatilité du marché.
2. **Scénarios** (au moins 6 à la V1) : objectifs, limite de temps, conditions initiales fixes (graine ou état préconstruit). Exemples : « Premier disque d'or en 2 ans avec 5 000 € », « Sauver un label au bord de la faillite », « Imposer un genre que personne n'écoute », « Tenir 10 ans avec un seul artiste ». **[PROPOSITION]** deux autres : « Dix ans pour racheter la major conservatrice », « Réussir le retour en grâce d'une légende ».
3. **Bac à sable** : argent illimité, tous les réglages accessibles (vitesse du temps, probabilités d'événements, désactivation de la faillite).
4. **Défi du jour** : seed identique pour tous (calculée à partir de la date côté interface), 52 semaines, score = valorisation finale. Le client envoie le **journal d'actions** ; le serveur **rejoue** la partie pour valider le score (interface prévue, backend mocké dans cette version, avec le même code de replay). Résultat partageable en texte court.
5. **Tutoriel** : scénario guidé « Ton premier signataire », qui introduit les systèmes progressivement, passable.
6. **[PROPOSITION] Mode Infini / Héritage** : voir la section 14.

## 7. Sauvegarde

- IndexedDB, 3 emplacements manuels, plus une sauvegarde automatique toutes les 4 semaines de jeu (rotation sur 2 emplacements automatiques pour limiter les pertes).
- Enveloppe versionnée `{ schema: 'label-tycoon', version, state, journal, meta }`. Migrations chaînées `v1 → v2 → … → vN`, chacune testée sur des sauvegardes de référence figées dans le dépôt.
- Export et import JSON avec validation de schéma (`zod`) avant toute écriture. Une sauvegarde importée invalide est refusée avec un message précis.
- Une sauvegarde **corrompue n'empêche jamais le jeu de démarrer** : le chargement est isolé, le jeu affiche un message clair et propose de supprimer l'emplacement concerné.
- Chaque sauvegarde porte son **hash d'état** et son journal : l'interface peut vérifier l'intégrité et ouvrir un replay.
- **[PROPOSITION]** La sauvegarde est compressée (`CompressionStream` quand disponible) pour les parties longues.

## 8. Interface

### 8.1 Direction artistique

Elle suit `docs/design.md` (arcade : contours épais, ombres pleines, couleurs saturées, boutons 3D, thèmes Jour et Nuit, tokens). Variante propre au jeu, « l'univers du disque » :

- **pochettes de vinyles** générées en SVG à partir de formes et de trames (graine = identifiant de la sortie), une par sortie ;
- **crédits** façon notes de pochette ;
- **classements** présentés comme un hit-parade imprimé ;
- **console de studio** dessinée au trait pour l'écran de production ;
- **tampon encreur** animé pour la signature d'un contrat ;
- graphiques SVG maison, traits épais et aplats arcade, jamais de bibliothèque.

Les interdits historiques (néons, dégradés, glow, emojis) ont été levés par `docs/design.md`, mais pas la lisibilité : l'information n'est jamais portée par la couleur seule (flèches, signes + et −).

### 8.2 Écrans (une PR chacun)

1. QG (tableau de bord)
2. Roster
3. Fiche artiste
4. Repérage
5. Négociation
6. Studio
7. Calendrier des sorties
8. Classements
9. Marché
10. Concurrence
11. Finances
12. Personnel
13. Bâtiments
14. La Une du label
15. Paramètres et sauvegardes

**[PROPOSITION]** Écrans ajoutés plus tard : Tournées, Catalogue (réédition, vinyles), Succès, Héritage.

### 8.3 Principes

- **Desktop d'abord**, mais jouable sur tablette et mobile : les écrans denses passent en onglets et en listes, rien n'est inaccessible.
- **Infobulles explicatives** sur chaque chiffre important : d'où il vient, avec la **contribution de chaque facteur** (ex. qualité d'un titre). Les formules exposent leur décomposition (`explain()` retourne la liste des termes), jamais une valeur nue.
- **Rapport mensuel** : ce qui a marché, ce qui a raté, pourquoi.
- Animations dans l'esprit du portail : chiffres qui défilent, courbes qui se tracent, tampon encreur. `prefers-reduced-motion` respecté. Le jeu ne bloque jamais sur une animation.
- **Raccourcis clavier** : espace (pause), 1 à 3 (vitesse), touches de navigation entre écrans. Liste accessible dans les paramètres.
- Accessibilité : navigation clavier complète, contraste AA, aucune information portée par la couleur seule, focus visible.
- Pas de son en V1.
- **[PROPOSITION]** **Aide contextuelle** : un petit « ? » par écran ouvre un guide d'une page. Le glossaire (fanbase, hype, crédibilité…) est accessible partout.

## 9. Tests et qualité

- **Vitest** pour les formules et règles, un fichier de test par module.
- **fast-check** :
  - déterminisme : même seed et mêmes actions donnent le même hash d'état ;
  - replay : rejouer le journal reproduit l'état exact ;
  - invariants : trésorerie entière, attributs entre 0 et 100, aucun artiste avec deux contrats actifs, sommes de répartition exactes au centime, identifiants uniques, probabilités dans [0, 1].
- **Migrations** testées sur des sauvegardes de référence.
- **Architecture** : test qui interdit les sources non déterministes et les imports DOM dans `core` et `label-tycoon`.
- **Performance** : simuler 52 semaines sans interface en moins de 200 ms (machine moyenne, mesurée en CI avec une marge). Deux budgets supplémentaires **[PROPOSITION]** : 10 ans de simulation en moins de 3 s, taille mémoire de l'état à 20 ans sous un plafond défini.
- **Script d'équilibrage** `pnpm sim:balance` : simule des centaines de parties sans interface avec plusieurs bots (prudent, agressif, spécialiste d'un genre, aléatoire). Rapport : taux de faillite, temps médian avant le premier disque d'or, valorisation à 5 et 10 ans, répartition des genres dominants, stratégie gagnante.

  Cibles :
  - aucune stratégie unique ne domine toutes les autres ;
  - un joueur prudent ne fait presque jamais faillite la première année (moins de 2 %) ;
  - un joueur moyen obtient son premier disque d'or entre la 2e et la 4e année.

  Les choix d'équilibrage sont documentés dans `docs/games/label-tycoon/balance.md`.

- Lint, typecheck, tests, build verts avant chaque push (`pnpm check`).

## 10. Contenu : volumes visés à la V1

| Contenu                       | Volume V1                             |
| ----------------------------- | ------------------------------------- |
| Genres de départ              | 10                                    |
| Sous-genres générables        | 30+                                   |
| Événements                    | 60+                                   |
| Traits d'artistes             | 20                                    |
| Traits de personnel           | 10                                    |
| Scénarios                     | 6 à 8                                 |
| Gabarits d'articles de presse | 150+                                  |
| Succès                        | 60                                    |
| Noms (prénoms, noms, scène)   | milliers, par assemblage de morphèmes |

Tout ce contenu est de la donnée typée, ce qui permet d'en ajouter sans toucher à la logique.

## 11. Contraintes de contenu

- Aucun vrai nom d'artiste, de label, de titre, de lieu protégé : tout est fictif et généré.
- Pas de contenu explicite dans les textes générés (le ton reste « presse musicale »).
- Les noms de villes sont fictifs.

## 12. Risques et parades

| Risque                                                | Parade                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| Équilibrage impossible à tenir à la main              | Script de simulation dès que la boucle économique existe, pas à la fin       |
| Dérive du déterminisme (un tirage ajouté change tout) | Flux aléatoires séparés par système, test de hash à chaque PR                |
| Coût d'un tick qui explose avec le catalogue          | Fenêtre active et forme fermée pour la traîne, budget de performance testé   |
| Interface noyée sous le volume d'informations         | Écrans par paliers, tableau de bord par exceptions, infobulles à la demande  |
| Sauvegardes qui cassent après une mise à jour         | Schéma versionné, migrations testées, sauvegardes de référence dans le dépôt |
| Périmètre énorme                                      | Roadmap en petites PR, un jalon jouable dès la phase 6 (voir la roadmap)     |

## 13. Questions ouvertes

1. Direction artistique : confirmes-tu que **`docs/design.md` (arcade)** prime sur la description « journal » du prompt ?
2. Nom du fil d'actualité : « La Une du label » te convient-il ?
3. Alias `/label` vers `/jeux/label-tycoon` : OK ?
4. Pour les sauvegardes, OK pour une base IndexedDB propre au jeu, avec en option les métadonnées remontées dans la page de compte ?
5. Identité Git : on garde `Gabin LESCOAT` / `lescoatgabin@gmail.com` ?
6. Le défi du jour validé par le serveur reste mocké ici : veux-tu que je prépare le contrat d'API (format du journal, de la réponse) dans la roadmap ?
7. Le mode « Infini / Héritage » de la section 14 est une proposition importante : veux-tu qu'il soit dans la V1 ou en V1.5 ?

## 14. Un tycoon infini : longévité et profondeur **[PROPOSITION]**

Cette section répond à « un tycoon, c'est infini ». L'objectif est qu'une partie puisse durer des dizaines d'heures sans que les systèmes s'essoufflent, et qu'on ait toujours une raison de continuer.

### 14.1 Des paliers qui continuent après la major

| Palier         | Débloque                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 5. Groupe      | sous-labels (un par genre ou par pays), rachat de rivaux, direction de filiales par des cadres                           |
| 6. Conglomérat | plateforme de streaming maison (arbitrage entre catalogue et plateforme), studios de synchro, festivals possédés         |
| 7. Institution | fondation, académie d'artistes (formation de la génération suivante), musée du label, influence sur les règles du marché |

Chaque palier change encore la nature du jeu (le joueur pilote des sous-labels dirigés par des cadres qu'il évalue, arbitre des enveloppes, négocie avec des plateformes).

### 14.2 Un monde qui évolue : les ères

La partie traverse des **ères** d'environ 8 à 12 ans qui modifient les règles économiques :

- ère du physique, ère du téléchargement, ère du streaming, ère de la plateforme dominante, ère du retour au vinyle et du direct-to-fan, etc. (noms génériques et fictifs) ;
- chaque ère change : revenu par stream, poids du physique, importance des concerts, cycle des genres, agressivité des plateformes, exigences de certification ;
- les ères sont annoncées par des événements et des signaux avant-coureurs (le joueur attentif anticipe).

### 14.3 Générations et héritage

- Les artistes **vieillissent, prennent leur retraite, enseignent**. Une légende peut devenir mentor, jury de concours, partenaire d'une académie.
- Une partie à long terme voit **plusieurs générations** : le joueur forme la relève, les enfants d'artistes célèbres peuvent émerger (avec des traits hérités).
- **Mode Héritage** : à la fin d'un « règne » (retraite choisie ou fin de cycle), la partie peut repartir avec un héritage (une fondation, un catalogue, une réputation de départ réduite) et des **bonus d'héritage** gagnés par des objectifs. Un **Panthéon** local conserve les meilleurs labels et leurs records. Rien n'est partagé avec les autres jeux.

### 14.4 Objectifs permanents et récompenses

- **Succès** (60 à la V1, 150 à terme) : pour les genres, les artistes, les records de classement, les paliers, les scénarios.
- **Objectifs dynamiques** : à tout moment, 3 objectifs proposés, adaptés à l'état de la partie, avec récompenses (budget, prestige, accès à du contenu).
- **Records du label** : meilleure sortie, plus longue série numéro 1, plus grosse vente, plus long règne d'un artiste, etc. Ils remplissent le Panthéon.

### 14.5 Contenu qui grossit après la V1

- Pipeline de contenu pensé pour grossir : événements, genres, scénarios, gabarits de presse sont des fichiers de données. Objectif : **60 événements à la V1, 150 à 6 mois, 300 à terme**.
- **Marchés internationaux** : chaque pays a ses genres, ses plateformes, ses classements locaux, ses rivaux. L'export devient une couche de jeu à part entière.
- **Saisons de contenu** : saisons de festivals, crises économiques, nouvelles technologies musicales (fictives), chacune apportant des événements dédiés.
- **Défis hebdomadaires** en plus du défi du jour (seed de la semaine, contraintes spéciales).

### 14.6 Contre l'enlisement

Pour que l'infini reste intéressant, le jeu applique des **puits d'argent et de la friction croissante** : impôts, entretien, concurrence qui se consolide, régulation anti-concentration (au palier Groupe), vagues de piratage, plateformes qui renégocient. Les rivaux grandissent avec le joueur. Un test de simulation de 30 ans vérifie que la valorisation ne diverge pas de façon exponentielle sans friction.
