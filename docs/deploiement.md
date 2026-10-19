# Déploiement (environnement de développement)

Le site se déploie sur **tycoon.glsc.fr** avec un seul script, à lancer **sur le serveur**. C'est un environnement de développement : HTTP seul, non indexé par les moteurs de recherche.

## Prérequis sur le serveur

- Debian ou Ubuntu avec **nginx**, **git** et **Node 20 ou plus** (pnpm s'installe tout seul via corepack).
- Un utilisateur avec `sudo`.
- Le DNS de `tycoon.glsc.fr` qui pointe vers le serveur.

## Déployer

```bash
git clone https://github.com/gabinlsc/tycoon.git ~/tycoon   # la première fois seulement
bash ~/tycoon/scripts/deploy.sh
```

Pour une autre branche : `BRANCH=feat/ma-branche bash ~/tycoon/scripts/deploy.sh`.

## Ce que le script crée

```
/var/www/tycoon.glsc.fr/
├── current -> releases/20261019-101500-ab12cd3   (lien servi par nginx)
└── releases/
    ├── 20261019-101500-ab12cd3/                  (une version = date + commit)
    └── …                                         (les 5 dernières sont gardées)
```

- La config nginx est copiée dans `/etc/nginx/sites-available/tycoon.glsc.fr` (source : `deploy/nginx/tycoon.glsc.fr.conf`) et activée dans `sites-enabled`.
- `nginx -t` est lancé avant tout rechargement ; s'il échoue, l'ancienne version et l'ancienne config sont rétablies.
- Toutes les routes retombent sur `index.html` (le site est une application à page unique : `/jeux/label-tycoon`, `/label`, `/compte`…).
- Les fichiers de `/assets` sont mis en cache un an (leur nom change à chaque build) ; `index.html` n'est jamais mis en cache.

## Revenir en arrière

```bash
bash ~/tycoon/scripts/deploy.sh --rollback
```

## Réglages

Variables d'environnement : `DOMAIN` (défaut `tycoon.glsc.fr`), `WEB_ROOT` (défaut `/var/www/<domaine>`), `BRANCH` (défaut `main`), `SRC_DIR` (défaut `~/tycoon`), `REPO_URL`, `KEEP_RELEASES` (défaut 5).

## Plus tard : HTTPS

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tycoon.glsc.fr
```

Certbot modifie la config nginx ; un déploiement suivant la réécrit depuis le dépôt. Quand on passera en HTTPS pour de bon, il faudra mettre le bloc `listen 443 ssl` dans `deploy/nginx/tycoon.glsc.fr.conf`.

## Limites

Le script n'a pas été exécuté sur un vrai serveur depuis cet environnement : sa syntaxe est vérifiée, pas son déroulé complet. Les parties du jeu qui parlent à un serveur de défis restent simulées dans le navigateur.
