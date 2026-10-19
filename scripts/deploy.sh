#!/usr/bin/env bash
# Déploie Tycoon Hub (dont Label Tycoon) sur le serveur de développement.
#
# À lancer SUR LE SERVEUR (Debian/Ubuntu avec nginx), avec un utilisateur qui a sudo :
#   bash scripts/deploy.sh                 # branche main
#   BRANCH=feat/ma-branche bash scripts/deploy.sh
#   bash scripts/deploy.sh --rollback      # revient à la version précédente
#
# Ce que fait le script :
#   1. clone ou met à jour le dépôt (SRC_DIR) sur la branche demandée ;
#   2. installe les dépendances (pnpm) et construit le site (apps/web/dist) ;
#   3. crée /var/www/tycoon.glsc.fr/{releases,current} et publie le build dans une nouvelle release ;
#   4. installe la config nginx, la teste (nginx -t), puis recharge nginx ;
#   5. bascule `current` sur la nouvelle release (atomique) et garde les 5 dernières.
#
# Variables réglables : DOMAIN, WEB_ROOT, REPO_URL, BRANCH, SRC_DIR, KEEP_RELEASES.
set -euo pipefail

DOMAIN="${DOMAIN:-tycoon.glsc.fr}"
WEB_ROOT="${WEB_ROOT:-/var/www/${DOMAIN}}"
REPO_URL="${REPO_URL:-https://github.com/gabinlsc/tycoon.git}"
BRANCH="${BRANCH:-main}"
SRC_DIR="${SRC_DIR:-${HOME}/tycoon}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"
NGINX_SITE="/etc/nginx/sites-available/${DOMAIN}"
NGINX_LINK="/etc/nginx/sites-enabled/${DOMAIN}"

info() { printf '\033[1;34m▶ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✘ %s\033[0m\n' "$*" >&2; exit 1; }

# sudo seulement si on n'est pas déjà root.
if [ "$(id -u)" -eq 0 ]; then SUDO=""; else SUDO="sudo"; fi

command -v nginx >/dev/null || fail "nginx n'est pas installé (sudo apt install nginx)."
command -v git >/dev/null || fail "git n'est pas installé (sudo apt install git)."

# --- Retour arrière -----------------------------------------------------------------------------
if [ "${1:-}" = "--rollback" ]; then
  [ -d "${WEB_ROOT}/releases" ] || fail "Aucune release dans ${WEB_ROOT}/releases."
  current="$(readlink -f "${WEB_ROOT}/current" || true)"
  previous="$(ls -1d "${WEB_ROOT}"/releases/*/ 2>/dev/null | sed 's#/$##' | sort | grep -vx "${current}" | tail -n 1 || true)"
  [ -n "${previous}" ] || fail "Pas de release précédente."
  info "Retour à $(basename "${previous}")"
  ${SUDO} ln -sfn "${previous}" "${WEB_ROOT}/current.new"
  ${SUDO} mv -T "${WEB_ROOT}/current.new" "${WEB_ROOT}/current"
  info "Terminé : ${DOMAIN} sert maintenant $(basename "${previous}")."
  exit 0
fi

# --- Outils : Node 20+ et pnpm ------------------------------------------------------------------
command -v node >/dev/null || fail "Node n'est pas installé (Node 20 ou plus : https://nodejs.org)."
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "${node_major}" -ge 20 ] || fail "Node ${node_major} détecté, il faut Node 20 ou plus."
if ! command -v pnpm >/dev/null; then
  info "Installation de pnpm via corepack"
  ${SUDO} corepack enable
  corepack prepare pnpm@10 --activate
fi

# --- Code ---------------------------------------------------------------------------------------
if [ -d "${SRC_DIR}/.git" ]; then
  info "Mise à jour du dépôt (${BRANCH})"
  git -C "${SRC_DIR}" fetch --prune origin
  git -C "${SRC_DIR}" checkout -q "${BRANCH}"
  git -C "${SRC_DIR}" reset -q --hard "origin/${BRANCH}"
else
  info "Clonage de ${REPO_URL} dans ${SRC_DIR}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${SRC_DIR}"
fi
commit="$(git -C "${SRC_DIR}" rev-parse --short HEAD)"

# --- Build --------------------------------------------------------------------------------------
info "Installation des dépendances"
(cd "${SRC_DIR}" && pnpm install --frozen-lockfile)
info "Construction du site"
(cd "${SRC_DIR}" && pnpm --filter @tycoon/web build)
DIST="${SRC_DIR}/apps/web/dist"
[ -f "${DIST}/index.html" ] || fail "Build introuvable : ${DIST}/index.html"

# --- Dossiers et publication --------------------------------------------------------------------
release="$(date +%Y%m%d-%H%M%S)-${commit}"
info "Création des dossiers ${WEB_ROOT}/releases/${release}"
${SUDO} mkdir -p "${WEB_ROOT}/releases/${release}"
${SUDO} cp -a "${DIST}/." "${WEB_ROOT}/releases/${release}/"
${SUDO} chown -R root:root "${WEB_ROOT}/releases/${release}"
${SUDO} find "${WEB_ROOT}/releases/${release}" -type d -exec chmod 755 {} +
${SUDO} find "${WEB_ROOT}/releases/${release}" -type f -exec chmod 644 {} +

# --- nginx --------------------------------------------------------------------------------------
info "Configuration nginx (${NGINX_SITE})"
previous_conf=""
if [ -f "${NGINX_SITE}" ]; then previous_conf="$(mktemp)"; ${SUDO} cp "${NGINX_SITE}" "${previous_conf}"; fi
# La config du dépôt part de tycoon.glsc.fr / /var/www/tycoon.glsc.fr : on l'adapte si DOMAIN ou WEB_ROOT changent.
sed -e "s#server_name tycoon.glsc.fr;#server_name ${DOMAIN};#" \
    -e "s#/var/www/tycoon.glsc.fr/current#${WEB_ROOT}/current#" \
    -e "s#tycoon.glsc.fr\\.\\(access\\|error\\)\\.log#${DOMAIN}.\\1.log#" \
    "${SRC_DIR}/deploy/nginx/tycoon.glsc.fr.conf" | ${SUDO} tee "${NGINX_SITE}" >/dev/null
${SUDO} ln -sfn "${NGINX_SITE}" "${NGINX_LINK}"

# On bascule d'abord `current` : la config pointe dessus et nginx -t exige que le dossier existe.
old_current="$(readlink -f "${WEB_ROOT}/current" 2>/dev/null || true)"
${SUDO} ln -sfn "${WEB_ROOT}/releases/${release}" "${WEB_ROOT}/current.new"
${SUDO} mv -T "${WEB_ROOT}/current.new" "${WEB_ROOT}/current"

if ! ${SUDO} nginx -t; then
  info "nginx -t a échoué : retour arrière"
  if [ -n "${old_current}" ]; then
    ${SUDO} ln -sfn "${old_current}" "${WEB_ROOT}/current.new"
    ${SUDO} mv -T "${WEB_ROOT}/current.new" "${WEB_ROOT}/current"
  fi
  if [ -n "${previous_conf}" ]; then ${SUDO} cp "${previous_conf}" "${NGINX_SITE}"; else ${SUDO} rm -f "${NGINX_LINK}" "${NGINX_SITE}"; fi
  fail "Configuration nginx invalide, rien n'a été rechargé."
fi
${SUDO} systemctl reload nginx

# --- Ménage -------------------------------------------------------------------------------------
ls -1d "${WEB_ROOT}"/releases/*/ 2>/dev/null | sed 's#/$##' | sort | head -n "-${KEEP_RELEASES}" | while read -r vieille; do
  ${SUDO} rm -rf "${vieille}"
done
[ -z "${previous_conf}" ] || rm -f "${previous_conf}"

info "Déployé : http://${DOMAIN} (release ${release}, branche ${BRANCH})"
echo "HTTPS : sudo certbot --nginx -d ${DOMAIN}   (quand tu voudras passer en HTTPS)"
echo "Retour arrière : bash scripts/deploy.sh --rollback"
