# Direction artistique

Tycoon Hub est un portail de jeux de gestion au look **cartoon / jeu mobile** : gros contours encre, ombres pleines décalées, couleurs saturées, boutons 3D qui s'enfoncent, pièces d'or et dollars partout. On doit avoir l'impression d'ouvrir un jeu, pas un site.

## Principes

- **Contours épais** (`--border`, 4 px) sur tout ce qui est une carte, un bouton ou une pastille.
- **Ombres pleines**, jamais diffuses : `--pop` (carte), `--pop-sm` (pastille).
- **Coins très arrondis** (`--r-sm`, `--r-md`, `--r-lg`, pastilles à 999px).
- **Couleur = jeu** : chaque jeu a une couleur (`purple`, `orange`, `blue`, `pink`, `green`, `red`) utilisée pour son bandeau, son médaillon et sa quête du jour.
- **Vocabulaire de jeu** : niveaux (`Niv. 1`), barres de stats, quêtes, podium, trésorerie en `$`.
- Titres blancs avec contour encre (`text-shadow` multiple), pour l'effet « titre de jeu ».

Les interdits de la première version (néons, dégradés, glow, emojis…) sont levés : tout est permis tant que ça sert l'ambiance gaming, avec l'accessibilité et `prefers-reduced-motion` respectés.

## Tokens

Source unique : `apps/web/src/styles/arcade/tokens.css`. Aucune valeur de couleur, de police, d'espacement, de forme, de durée ou d'easing en dur dans les composants.

| Famille           | Variables                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Ciel et surfaces  | `--sky-top`, `--sky-bottom`, `--surface`, `--surface-2`, `--outline`, `--text`, `--text-soft`                                 |
| Couleurs de jeu   | `--gold`, `--green`, `--red`, `--purple`, `--blue`, `--orange`, `--pink`, `--teal`, et leur variante `-dark` pour le socle 3D |
| Couleurs de texte | `--green-text`, `--red-text` (contraste AA sur les fonds clairs et sombres)                                                   |
| Typo              | `--font-display` (Lilita One), `--font-text` (Nunito), `--fs-*`                                                               |
| Espacements       | `--sp-1` à `--sp-9`, `--gutter`, `--page-max`                                                                                 |
| Formes            | `--border`, `--r-*`, `--pop`, `--pop-sm`                                                                                      |
| Mouvement         | `--dur-*`, `--ease-bounce`, `--ease-out`                                                                                      |

### Thèmes

- **Jour** : ciel bleu clair, cartes blanches.
- **Nuit** : violet profond, cartes violet moyen, mêmes couleurs vives.
- Bascule manuelle (`data-theme` sur `<html>`, mémorisée dans `localStorage`), sinon `prefers-color-scheme`. Un script inline dans `index.html` pose le thème avant le premier rendu.
- Les deux jeux de tokens se mettent à jour ensemble.

### Typographie

Lilita One pour les titres et tous les chiffres (classe `.mono`, chiffres tabulaires), Nunito (600 et 800) pour le texte. Polices auto-hébergées dans `apps/web/public/fonts`, `font-display: swap`, deux polices critiques préchargées.

## Pages et arrivée sur un jeu

- Routes : `/` (accueil), `/jeux`, `/jeux/:slug` (page d'un jeu), `/compte`, pages légales, 404.
- **Chaque jeu est indépendant** : pas de monnaie, de progression ni de lien partagés entre jeux. Le hub ne montre aucune trésorerie. Le compte ne porte que le pseudo ; les sauvegardes sont isolées par compte et par jeu.
- **Arrivée sur un jeu (« le WOW »)** : le rideau `GameIntro` s'ouvre à chaque première visite d'un jeu dans la session : la couleur du jeu inonde l'écran, l'emblème s'abat avec ondes de choc et tremblement, le titre jaillit lettre par lettre dans une pluie de pièces, puis le rideau se lève et la page entre en cascade (stats qui se remplissent, titre qui ondule). Passable (clic, Échap, Entrée, bouton), rejouable depuis la page, absent en `prefers-reduced-motion`.
- Aucune donnée fictive dans le hub : tant qu'une information n'existe pas (classement, activité), on ne l'affiche pas.

## Composants de base

Dans `apps/web/src/components/arcade/ui` : `Button` (3D, tons `green`, `gold`, `purple`, `ghost`), `Coin` (pièce SVG), `GameIcon` (emblèmes SVG des jeux), `StatBar` (barre de stat sur 5), `SectionTitle` (pastille de niveau et titre), `Reveal` (apparition par rebond).

## Principes d'animation

- **CSS natif** autant que possible, hooks maison (`useInView`, `useParallax`, `useCountUp`) pour le reste. Pas de bibliothèque d'animation.
- Le hub vit : formes en suspension derrière l'interface (`Doodles`), une qui rebondit en cascade au chargement, emblèmes qui suivent le pointeur (`usePointerParallax`).
- Mouvements **élastiques** : `--ease-bounce` pour les apparitions, les survols et les cartes qui rebondissent.
- Pièces qui flottent dans la une, emblèmes qui se penchent au survol, boutons qui s'enfoncent au clic, compteurs de fortune qui s'emballent puis se calent, traits du schéma des crossovers qui se dessinent.
- Le fil d'actualité défile en boucle (pause au survol et au focus).
- **Attention** : n'utilisez pas `clip-path` sur un élément observé par `IntersectionObserver`, un élément entièrement rogné n'est jamais vu comme visible.
- **`prefers-reduced-motion`** : animations désactivées, fil figé, valeurs finales affichées directement. Toute nouvelle animation doit respecter cette règle.

## Accessibilité et performance

- HTML sémantique, navigation clavier complète, focus visible (anneau jaune avec contour encre), contraste AA dans les deux thèmes (vérifié avec axe-core).
- Le fil animé est en `aria-hidden`, avec une liste statique pour les lecteurs d'écran. Les compteurs ne cachent jamais la valeur finale.
- Objectif Lighthouse ≥ 95 sur les quatre catégories, aucune image lourde (SVG et CSS uniquement).
- Tester à 360, 768, 1280 et 1920 px, sans défilement horizontal.

## Données et contenu

- Jeux : `apps/web/src/data/games.ts` (slug, nom, pitch, couleur, emblème, stats). Un jeu jouable s'enregistre en plus dans `src/games/registry.ts`.
- Marque et domaine : uniquement `apps/web/src/config/site.ts`.
- Tout le texte est en français, ton direct et vivant, tutoiement, chiffres concrets, aucune phrase marketing creuse.
- Tout ce qui est aléatoire est à graine : même résultat pour tous les visiteurs, tests reproductibles.
