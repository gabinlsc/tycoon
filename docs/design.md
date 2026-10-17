# Direction artistique

Le portail est la une d'un quotidien financier fictif, _Le Tycoon_. Chaque jeu est une entreprise cotée : symbole, cours, mini-courbe. Le visiteur ouvre un journal d'affaires vivant, pas une landing page.

## Interdits

- Néons, glow, dégradés violet ou bleu, glassmorphism, fonds en mesh gradient.
- Particules, étoiles, effets « cyber ».
- Icônes sparkles, emojis utilisés comme icônes.
- Sections SaaS génériques : « Trusted by », hero centré à deux boutons avec mockup flottant, grille de trois features avec icônes dans des cercles.
- Inter comme police principale, coins arrondis XXL, ombres diffuses.
- Lorem ipsum. Tout le texte est en français, écrit comme un vrai journal : ton vivant, chiffres concrets, aucune phrase marketing creuse.
- Curseur personnalisé.

## Tokens

Source unique : `apps/web/src/styles/tokens.css`. Aucune valeur de couleur, de police, d'espacement, de durée ou d'easing en dur dans les composants.

| Famille         | Variables                                                                  | Notes                                           |
| --------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| Papier et encre | `--paper`, `--paper-deep`, `--ink`, `--ink-soft`, `--rule`, `--rule-faint` | Crème `#f3eee3`, encre `#1a1a1a`                |
| Accent          | `--vermillion`                                                             | Seule couleur d'accent : baisses, CTA, symboles |
| Hausse          | `--fir`                                                                    | Vert sapin, réservé aux variations positives    |
| Bandeau         | `--ticker-*`                                                               | Encre en clair, papier foncé en sombre          |
| Typo            | `--font-display`, `--font-text`, `--font-mono`, `--fs-*`                   | Voir ci-dessous                                 |
| Espacements     | `--sp-1` à `--sp-9`, `--gutter`, `--page-max`                              | Échelle de 4 px                                 |
| Filets          | `--rule-thin`, `--rule-thick`                                              | Filets d'imprimerie                             |
| Ombre           | `--lift-shadow`                                                            | Ombre portée nette, jamais diffuse              |
| Mouvement       | `--dur-*`, `--ease-ink`, `--ease-press`                                    | `--dur-print` sous 1,2 s                        |

### Thème sombre : « Édition du soir »

Papier sombre chaud (`#1e1b17`), encre crème, jamais de noir pur. La bascule est manuelle (`data-theme` sur `<html>`, mémorisée dans `localStorage`), et sans choix manuel on suit `prefers-color-scheme`. Un script inline dans `index.html` pose le thème avant le premier rendu. Les deux jeux de tokens doivent être mis à jour ensemble.

### Typographie

- Titres : Libre Caslon Display (serif à fort contraste).
- Texte : Public Sans.
- Chiffres, cours, symboles : IBM Plex Mono, chiffres tabulaires (classe `.mono`).
- Polices auto-hébergées dans `apps/web/public/fonts`, `font-display: swap`, deux polices critiques préchargées.
- Hiérarchie de journal : manchette énorme, chapô, colonnes, filets fins, rubriques numérotées.

### Grain et matière

Texture papier en bruit SVG inline (`body::before`, opacité 0,03), filets d'imprimerie, trames de points pour les illustrations. Les graphiques sont des SVG dessinés « à l'encre », sans bibliothèque de charts.

## Principes d'animation

Elles évoquent l'impression et la bourse, jamais le gadget.

- **CSS natif** autant que possible. Pas de bibliothèque d'animation : les hooks maison (`useInView`, `useParallax`, `useCountUp`) suffisent.
- **Chargement** : la manchette se révèle comme une encre qui se dépose, puis les filets se tracent de gauche à droite. Moins de 1,2 s, une fois par session (`sessionStorage`).
- **Ticker** : défilement infini, pause au survol et au focus, flip mécanique sur les chiffres qui changent.
- **Scroll** : sections révélées par un cache « papier » qui se retire (`Reveal`), courbes tracées avec `stroke-dashoffset`, compteurs animés. Parallaxe léger sur la manchette uniquement. Pas de fondu vers le haut générique.
- **Micro-interactions** : liens soulignés au trait d'encre qui se dessine, boutons à effet de tampon au clic, cartes qui se soulèvent avec une ombre nette.
- **N'utilisez pas `clip-path` sur l'élément observé** par `IntersectionObserver` : un élément entièrement rogné n'est jamais vu comme visible.
- **`prefers-reduced-motion`** : animations désactivées, ticker et marché figés, valeurs finales affichées directement. Toute nouvelle animation doit respecter cette règle.

## Accessibilité et performance

- HTML sémantique, navigation clavier complète, focus visible (`:focus-visible`, vermillon), contraste AA dans les deux thèmes.
- Le ticker animé est en `aria-hidden`, avec un équivalent statique pour les lecteurs d'écran.
- Les compteurs et animations ne cachent jamais la valeur finale aux lecteurs d'écran.
- Objectif Lighthouse ≥ 95 sur les quatre catégories, aucune image lourde (SVG ou CSS).
- Tester à 360, 768, 1280 et 1920 px, sans défilement horizontal.

## Données et contenu

- Jeux : uniquement `apps/web/src/data/games.ts`. Ajouter un jeu ne demande qu'une entrée, les liens entre jeux (`crossovers`) alimentent le schéma.
- Marque et domaine : uniquement `apps/web/src/config/site.ts`.
- Tout ce qui est aléatoire est à graine (`mulberry32`) : même résultat pour tous les visiteurs, tests reproductibles.
