#!/bin/bash
# First-time Let's Encrypt certificate setup for sptradersandbuilders.cloud
# Run this ONCE on the server before starting docker compose:
#   chmod +x init-letsencrypt.sh && ./init-letsencrypt.sh

set -e

DOMAIN="sptradersandbuilders.cloud"
DOMAINS=("$DOMAIN" "www.$DOMAIN")
EMAIL="${LETSENCRYPT_EMAIL:-admin@$DOMAIN}"   # override via LETSENCRYPT_EMAIL env var
STAGING=${STAGING:-0}   # set STAGING=1 to test with staging CA (no rate limits)

DATA_PATH="./certbot"

# ---- helpers ----------------------------------------------------------------
bold() { printf '\033[1m%s\033[0m\n' "$*"; }
info() { bold "[INFO] $*"; }
warn() { bold "[WARN] $*"; }

# ---- check existing certs ---------------------------------------------------
if [ -d "$DATA_PATH/conf/live/$DOMAIN" ]; then
  warn "Existing certificates found for $DOMAIN."
  read -p "Replace them? (y/N): " replace
  if [ "$replace" != "y" ]; then
    info "Keeping existing certificates. Exiting."
    exit 0
  fi
fi

# ---- download recommended TLS parameters -----------------------------------
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || \
   [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
  info "Downloading recommended TLS parameters..."
  mkdir -p "$DATA_PATH/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf \
    -o "$DATA_PATH/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem \
    -o "$DATA_PATH/conf/ssl-dhparams.pem"
  info "TLS parameters downloaded."
fi

# ---- create dummy cert so nginx can start before real cert exists ----------
info "Creating temporary self-signed certificate for $DOMAIN..."
DUMMY_PATH="$DATA_PATH/conf/live/$DOMAIN"
mkdir -p "$DUMMY_PATH"
docker compose -f docker-compose.production.yml run --rm --entrypoint \
  "openssl req -x509 -nodes -newkey rsa:4096 -days 1
    -keyout '/etc/letsencrypt/live/$DOMAIN/privkey.pem'
    -out '/etc/letsencrypt/live/$DOMAIN/fullchain.pem'
    -subj '/CN=localhost'" certbot
info "Dummy certificate created."

# ---- start nginx with dummy cert -------------------------------------------
info "Starting nginx..."
docker compose -f docker-compose.production.yml up --force-recreate -d nginx

# ---- delete dummy cert and request real cert --------------------------------
info "Deleting dummy certificate..."
docker compose -f docker-compose.production.yml run --rm --entrypoint \
  "rm -Rf /etc/letsencrypt/live/$DOMAIN
          /etc/letsencrypt/archive/$DOMAIN
          /etc/letsencrypt/renewal/$DOMAIN.conf" certbot

# Build domain arguments  (-d domain1 -d domain2 ...)
DOMAIN_ARGS=""
for d in "${DOMAINS[@]}"; do DOMAIN_ARGS="$DOMAIN_ARGS -d $d"; done

STAGING_ARG=""
if [ "$STAGING" = "1" ]; then
  STAGING_ARG="--staging"
  warn "Using Let's Encrypt STAGING environment (certificates won't be trusted by browsers)"
fi

info "Requesting Let's Encrypt certificate for: ${DOMAINS[*]}"
docker compose -f docker-compose.production.yml run --rm --entrypoint \
  "certbot certonly --webroot -w /var/www/certbot
    $STAGING_ARG
    $DOMAIN_ARGS
    --email $EMAIL
    --rsa-key-size 4096
    --agree-tos
    --no-eff-email
    --force-renewal" certbot

# ---- reload nginx with real cert --------------------------------------------
info "Reloading nginx with real certificate..."
docker compose -f docker-compose.production.yml exec nginx nginx -s reload

bold "✅ SSL certificate setup complete!"
bold "   Your site should now be accessible at https://$DOMAIN"
