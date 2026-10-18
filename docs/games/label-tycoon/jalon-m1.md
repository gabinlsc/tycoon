# Jalon M1 : première boucle jouable

Ce document accompagne le jalon M1 de la feuille de route. Il décrit ce qui se joue aujourd'hui, ce qui ne se joue pas encore, et propose un protocole de session de test pour recueillir des retours.

## Ce qui est jouable

Ouvrir `/jeux/label-tycoon` (ou `/label`), puis :

1. **Nouvelle partie** (graine facultative : une même graine donne le même monde).
2. **Repérage** : lancer une session (la candidature spontanée est gratuite), suivre les talents trouvés, lire leurs fourchettes. Un essai en studio (payant) révèle les attributs cachés, en fourchette.
3. **Négociation** : depuis un talent suivi, régler avance, royalties, durée, part 360, clause de rachat et exclusivité. La jauge de réaction se met à jour en direct ; une offre insultante coûte de l'affinité ; trois contre-propositions au maximum ; le tampon « SIGNÉ » conclut.
4. **Studio** : choisir type de sortie, clip, studio, producteur, mixage ; lire la fourchette de qualité estimée, le coût et la durée ; lancer ; publier quand c'est prêt.
5. **Temps** : pause, ×1, ×2, ×4 ou semaine par semaine ; auto-pauses réglables (espace pour lancer ou arrêter, N pour une semaine).
6. **QG, Roster, fiche artiste, Boîte, Le Fil** : suivre l'argent, les alertes, les échéances, les objectifs, trancher les décisions, lire les actus.
7. **Sauvegarde** : automatique dans le compte (pseudo), reprise depuis l'écran de départ. Sans compte, la partie n'est pas conservée.

La partie se termine par la faillite (huit semaines de trésorerie négative). Le moteur reste rejouable à l'identique à partir de la graine et du journal d'actions.

## Ce qui ne se joue pas encore

- Interface : pas de bâtiments, de personnel, de concerts et tournées, de prêts, d'investisseurs, de pressage, de rivaux détaillés, de classements ni de cérémonies (phase 7). Le moteur les gère déjà ; les écrans arrivent.
- Pas de tutoriel, de scénarios, de défi du jour ni de bac à sable (phases 8 et 9).
- Les ères, l'héritage et le mode infini ne sont pas implémentés.

## Équilibrage (valeurs de départ)

Pour que la boucle soit viable, le jalon M1 recale les bases de l'économie : budget de départ de 20 000 €, frais courants de 40 € par semaine (les bâtiments de départ n'ont pas d'entretien), sorties moins chères (single 900 €), revenus de streaming relevés. Ces valeurs restent **provisoires** : `pnpm sim:balance` donne un état des lieux.

Instantané (6 parties par stratégie, 156 semaines, graines `m1-n`) :

| Stratégie   | Faillites | 1er disque d'or (médiane) | Valorisation à 3 ans |
| ----------- | --------- | ------------------------- | -------------------- |
| prudent     | 17 %      | semaine 102               | 372 585 €            |
| agressif    | 0 %       | semaine 25                | 5 861 847 €          |
| spécialiste | 17 %      | jamais                    | 4 528 €              |
| aléatoire   | 67 %      | semaine 30                | 4 795 €              |

Constats à traiter en phase 9 : la stratégie agressive domine nettement (la cible est qu'aucune stratégie ne domine) et le premier disque d'or arrive trop vite.

## Session de test avec retours (à réaliser)

Une session de test ne peut pas être faite par le code : c'est le travail du jalon qui reste à mener avec de vraies personnes.

**Protocole proposé** (30 à 45 minutes, 3 à 5 personnes) :

1. Consigne unique : « Fais prospérer ce label. » Aucune explication préalable.
2. Observer sans aider : noter où la personne hésite, ce qu'elle ne trouve pas, ce qu'elle ne comprend pas.
3. Après la partie, poser les mêmes questions à tout le monde :
   - As-tu compris pourquoi tu gagnais ou perdais de l'argent ?
   - À quel moment t'es-tu ennuyé·e ou perdu·e ?
   - Les fourchettes de repérage et la jauge de négociation étaient-elles claires ?
   - Le rythme du temps (vitesses, auto-pauses) convenait-il ?
   - Que voulais-tu faire sans pouvoir le faire ?
   - Rejouerais-tu ? Pourquoi ?
4. Consigner les retours dans une issue par problème, avec la graine de la partie pour la rejouer.
