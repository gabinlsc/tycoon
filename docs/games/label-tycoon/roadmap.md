# Label Tycoon : roadmap

Cette liste est **la mémoire du projet entre les sessions**. Règles :

- **Une ligne = une feature = une PR.** On coche la case dans la PR qui livre la feature.
- À chaque session : relire `docs/`, ouvrir ce fichier, reprendre à la **première case non cochée**.
- Chaque ligne donne le nom de branche suggéré. Le titre de la PR suit Conventional Commits, en français.
- Avant chaque push : `pnpm check` vert (lint, typecheck, tests, build) et vérification des messages de commit.
- Les ajouts par rapport au prompt initial sont marqués **(+)**. Voir le [GDD](./gdd.md). Tout est validé, mode Infini compris.

**Ordre ajusté (+)** : par rapport à l'ordre suggéré dans le prompt, la coquille d'interface (worker, `/jeux/label-tycoon`, QG) est placée **avant** les systèmes les plus profonds, pour avoir un jalon jouable tôt (fin de la phase 6) et valider le ressenti au lieu de simuler à l'aveugle. Le script d'équilibrage arrive dès que la boucle économique existe (phase 5), puis est rejoué à chaque jalon.

## Phase 0 : cadrage

- [x] `docs/label-tycoon-gdd` : game design document et roadmap, validés

## Phase 1 : `packages/core` (moteur générique)

- [x] `chore/core-outillage` : fast-check, règles ESLint de déterminisme (`Math.random`, `Date`, `performance.now`…), test d'architecture (aucun import DOM ou React dans `core` et `label-tycoon`)
- [x] `feat/core-rng` : xoshiro128**, état sérialisable, entiers, flottants, gaussien, choix pondéré, mélange, **flux indépendants** par système
- [x] `feat/core-argent` : type `Cents`, opérations entières, répartition sans perte de centime, arrondi centralisé
- [x] `feat/core-math` : `clamp`, `lerp`, courbes, escompte, tables de probabilités, moyennes pondérées
- [x] `feat/core-hash` : sérialisation canonique et empreinte d'état
- [x] `feat/core-ticks` : boucle de simulation en ticks, pipeline de phases nommées et ordonnées
- [x] `feat/core-actions` : commandes typées, validation, application pure, journal d'actions
- [x] `feat/core-replay` : rejouer seed + journal, tests de propriétés (déterminisme, replay)
- [x] `feat/core-evenements-base` : événements pondérés avec conditions et délai de recharge
- [x] `feat/core-evenements-choix` : choix multiples, conséquences immédiates et différées
- [x] `feat/core-evenements-chaines` : chaînes d'événements, file d'événements programmés
- [x] `feat/core-sauvegarde` : enveloppe versionnée, migrations enchaînées, sauvegardes de référence
- [x] `test/core-performance` : banc de performance du moteur (budget de tick)

## Phase 2 : fondations de `packages/label-tycoon`

- [x] `chore/label-fondations` : package, structure `balance/`, `content/`, `strings/fr`, types d'état, `newGame(seed, difficulté)`
- [x] `feat/label-noms-villes` : génération de noms, noms de scène, villes fictives, liste d'exclusion
- [x] `feat/label-genres` : genres de départ et modèle de popularité (statique)
- [x] `feat/label-artistes-generation` : génération procédurale d'artistes (attributs, traits, identité, potentiel, âge de pic)
- [x] `feat/label-finances-base` : trésorerie, revenus et dépenses, compte de résultat, boucle hebdomadaire
- [ ] `feat/label-explain` : mécanique `explain()` (chaque formule expose la décomposition de ses termes)

## Phase 3 : le cœur économique

- [ ] `feat/label-artistes-dynamiques` : hype, moral, fatigue, fanbase, notoriété, crédibilité de rue
- [ ] `feat/label-carriere` : phases de carrière, progression des compétences, réinvention, déclin (retour en grâce, statut culte)
- [ ] `feat/label-reperage` : sources, fourchettes d'attributs, brouillard de guerre
- [ ] `feat/label-reperage-rivaux` : dénicheurs imparfaits, biais, talents suivis aussi par les rivaux
- [ ] `feat/label-contrats` : clauses, modèle d'utilité de l'artiste, signature
- [ ] `feat/label-negociation` : contre-propositions, jauge de réaction, offres insultantes, affinité
- [ ] `feat/label-encheres` : enchères face aux rivaux
- [ ] `feat/label-fin-contrat` : renégociation, prolongation, départ, procès, rachat de clause
- [ ] `feat/label-production-qualite` : formule Q, producteurs, studio, mixage, featurings
- [ ] `feat/label-production-projets` : types de sortie, durées, retards, planification, capacité
- [ ] `feat/label-streams` : H, S(t), traîne longue en forme fermée, fenêtre active
- [ ] `feat/label-viralite-fanbase` : viralité, conversion en fans, hype hebdomadaire
- [ ] `feat/label-concurrence-calendrier` : collisions de sorties
- [ ] `feat/label-classements` : Top 50 singles et albums, bruit de marché, historique
- [ ] `feat/label-certifications` : or, platine, diamant
- [ ] `feat/label-tendances` : popularité des genres (marche aléatoire, retour à la moyenne, cycles)
- [ ] `feat/label-sous-genres` : sous-genres émergents et disparaissant, avantage du premier signataire
- [ ] `feat/label-veille` : études de marché, prévisions bruitées

## Phase 4 : couches de profondeur

- [ ] `feat/label-personnel` : rôles, candidats, salaires, moral, traits, progression
- [ ] `feat/label-delegation` : décisions déléguées, cadre de délégation (+)
- [ ] `feat/label-batiments` : studio, salle de répétition, bureaux, effets et entretien
- [ ] `feat/label-pressage` : physique (vinyles, CD), stock, invendus
- [ ] `feat/label-concerts` : salles, billetterie, présence scénique
- [ ] `feat/label-tournees` : tournées, fatigue, burnout, merch et stock
- [ ] `feat/label-festivals` : candidatures et cachets (+)
- [ ] `feat/label-synchro` : offres de synchronisation
- [ ] `feat/label-contrat-360` : parts sur concerts, merch, synchro
- [ ] `feat/label-prets` : prêts bancaires, taux selon la réputation
- [ ] `feat/label-investisseurs` : apport, parts, objectifs
- [ ] `feat/label-faillite` : compteur de 8 semaines, alerte, options de sauvetage, vente de contrats
- [ ] `feat/label-fiscalite` : impôt annuel et contrôle (+)
- [ ] `feat/label-relations-artistes` : rivalités, amitiés, mentorat (+)
- [ ] `feat/label-paliers` : les 4 paliers, déblocages, changement de nature du jeu
- [ ] `feat/label-valorisation` : score principal, valeur du catalogue actualisée

## Phase 5 : rivaux, événements, fil d'actus, premières simulations

- [ ] `feat/label-rivaux-generation` : 3 à 5 rivaux, personnalités, mêmes règles que le joueur
- [ ] `feat/label-rivaux-decisions` : décisions par utilitaire, signatures, sorties, enchères
- [ ] `feat/label-rivaux-interactions` : débauchage, clashs, offres de rachat, évolution des rivaux
- [ ] `feat/label-bots` : bots de stratégie (prudent, agressif, spécialiste, aléatoire)
- [ ] `feat/label-sim-balance` : script `pnpm sim:balance` et rapport (première version)
- [ ] `feat/label-evenements-artistes` : événements artistes (≥ 12)
- [ ] `feat/label-evenements-production` : événements production (≥ 10)
- [ ] `feat/label-evenements-marche` : événements marché (≥ 10)
- [ ] `feat/label-evenements-medias` : événements médias (≥ 10)
- [ ] `feat/label-evenements-business` : événements business (≥ 10)
- [ ] `feat/label-ceremonies` : remise de prix annuelle, nominations, gagnants simulés (≥ 8 événements)
- [ ] `feat/label-fil-actus` : générateur d'actus pour Le Fil du label
- [ ] `feat/label-rapport-mensuel` : données du rapport mensuel (ce qui a marché, raté, pourquoi)
- [ ] `feat/label-succes-objectifs` : succès, objectifs dynamiques, records (+)

## Phase 6 : coquille d'interface et premier jalon jouable

- [ ] `feat/label-worker` : Web Worker, protocole commandes et vues, pilote sans worker pour les tests
- [ ] `feat/label-ui-coquille` : montage dans `/jeux/label-tycoon`, alias `/label`, navigation entre écrans, raccourcis de base
- [ ] `feat/label-ui-temps` : barre de temps (pause, ×1, ×2, ×4, semaine), auto-pauses réglables
- [ ] `feat/label-ui-boite-reception` : notifications, décisions et échéances
- [ ] `feat/label-ui-infobulles` : composant d'infobulle explicative branché sur `explain()` (+ glossaire)
- [ ] `feat/label-ui-graphiques` : bibliothèque de graphiques SVG maison (courbes, barres, aires, hit-parade)
- [ ] `feat/label-ui-pochettes` : pochettes de vinyles générées en SVG
- [ ] `feat/label-ecran-qg` : QG (tableau de bord)
- [ ] `feat/label-ecran-roster` : Roster
- [ ] `feat/label-ecran-fiche-artiste` : fiche artiste
- [ ] `feat/label-ecran-reperage` : repérage
- [ ] `feat/label-ecran-negociation` : négociation, jauge de réaction, tampon encreur
- [ ] `feat/label-ecran-studio` : studio, console au trait, estimation de qualité
- [ ] `feat/label-jalon-jouable` : **jalon M1** : nouvelle partie, boucle complète jouable de bout en bout, sauvegarde simple, session de test avec retours

## Phase 7 : les autres écrans

- [ ] `feat/label-ecran-calendrier` : calendrier des sorties
- [ ] `feat/label-ecran-classements` : classements et certifications
- [ ] `feat/label-ecran-marche` : marché et prévisions
- [ ] `feat/label-ecran-concurrence` : concurrence
- [ ] `feat/label-ecran-finances` : finances, prêts, investisseurs
- [ ] `feat/label-ecran-personnel` : personnel
- [ ] `feat/label-ecran-batiments` : bâtiments
- [ ] `feat/label-ecran-tournees` : tournées et merch (+)
- [ ] `feat/label-ecran-fil` : Le Fil du label
- [ ] `feat/label-ecran-parametres` : paramètres et raccourcis
- [ ] `feat/label-ecran-rapport-mensuel` : rapport mensuel
- [ ] `feat/label-ecran-succes` : succès et records (+)
- [ ] `feat/label-ui-responsive` : écrans en onglets et listes pour tablette et mobile

## Phase 8 : sauvegarde, modes de jeu

- [ ] `feat/label-sauvegarde-indexeddb` : 3 emplacements manuels, sauvegarde automatique toutes les 4 semaines
- [ ] `feat/label-sauvegarde-export` : export et import JSON, validation `zod`, sauvegarde corrompue sans blocage
- [ ] `feat/label-sauvegarde-compte` : métadonnées de sauvegarde remontées dans la page de compte (+)
- [ ] `feat/label-mode-carriere` : carrière et réglages de difficulté
- [ ] `feat/label-mode-bac-a-sable` : bac à sable
- [ ] `feat/label-scenarios-moteur` : moteur de scénarios (objectifs, limite de temps, états de départ)
- [ ] `feat/label-scenarios-contenu` : 6 à 8 scénarios
- [ ] `feat/label-defi-du-jour` : seed du jour, 52 semaines, score, résultat partageable
- [ ] `feat/label-defi-validation` : contrat d'API (format du journal d'actions et de la réponse), validation par replay, backend mocké
- [ ] `feat/label-tutoriel` : « Ton premier signataire », guidé et passable

## Phase 9 : équilibrage

- [ ] `feat/label-sim-balance-v2` : rapports complets (faillite, premier disque d'or, valorisation à 5 et 10 ans, genres dominants, stratégie gagnante)
- [ ] `chore/label-equilibrage-1` : passe d'équilibrage économie et production
- [ ] `chore/label-equilibrage-2` : passe d'équilibrage marché, rivaux, personnel
- [ ] `chore/label-equilibrage-3` : cibles atteintes (aucune stratégie dominante, faillite an 1 < 2 %, premier disque d'or entre la 2e et la 4e année)
- [ ] `docs/label-balance` : `docs/games/label-tycoon/balance.md`

## Phase 10 : un tycoon infini (+, voir GDD section 14, **dans la V1**)

- [ ] `feat/label-paliers-groupe` : palier Groupe, sous-labels, direction par des cadres
- [ ] `feat/label-paliers-conglomerat` : palier Conglomérat, plateforme maison, studios de synchro
- [ ] `feat/label-paliers-institution` : palier Institution, fondation, académie
- [ ] `feat/label-eres` : ères et changements de règles économiques, signaux avant-coureurs
- [ ] `feat/label-generations` : retraite, mentors, relève, enfants d'artistes
- [ ] `feat/label-heritage` : mode Héritage et Panthéon local
- [ ] `feat/label-international` : marchés internationaux, genres et classements par pays, export
- [ ] `feat/label-scenes-locales` : scènes de villes et profils de genres
- [ ] `feat/label-regulation` : friction de fin de partie (anti-concentration, piratage, plateformes qui renégocient)
- [ ] `feat/label-evenements-v2` : 60 → 150 événements, par saisons de contenu
- [ ] `feat/label-defis-hebdo` : défis hebdomadaires
- [ ] `test/label-simulation-30-ans` : simulation de 30 ans, garde-fou contre la divergence de valorisation

## Phase 11 : finition et intégration

- [ ] `chore/label-a11y` : accessibilité (clavier, contraste AA, information hors couleur seule)
- [ ] `perf/label-performance` : budgets de performance (52 semaines < 200 ms, 10 ans < 3 s), chargement du jeu
- [ ] `chore/label-responsive-final` : passe responsive (360, 768, 1280, 1920) et tactile
- [ ] `docs/label-guide` : guide du joueur et glossaire
- [ ] `feat/label-integration-portail` : statut « Disponible » sur l'accueil, lien vers `/label`, mise à jour de `data/games.ts` et du registre

## Suivi

| Phase | Total | Faites |
| ----- | ----- | ------ |
| 0     | 1     | 1      |
| 1     | 13    | 13     |
| 2     | 6     | 5      |
| 3     | 18    | 0      |
| 4     | 16    | 0      |
| 5     | 14    | 0      |
| 6     | 14    | 0      |
| 7     | 13    | 0      |
| 8     | 10    | 0      |
| 9     | 5     | 0      |
| 10    | 12    | 0      |
| 11    | 5     | 0      |

(Mettre ce tableau à jour dans la PR qui coche une case.)
