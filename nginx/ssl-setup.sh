#!/bin/bash
# ============================================================
# QFX Finance — SSL Certificate Setup via Certbot
# Run this script ONCE on the VPS to obtain Let's Encrypt
# certificates for qfx-finance.com and api.qfx-finance.com.
#
# Prerequisites:
#   - Nginx installed and running (nginx -t passes)
#   - DNS A records already pointing to this server:
#       qfx-finance.com     -> 199.192.21.55
#       www.qfx-finance.com -> 199.192.21.55
#       api.qfx-finance.com -> 199.192.21.55
#   - Port 80 open in firewall (ufw allow 'Nginx HTTP')
# ============================================================

set -e

DOMAIN="qfx-finance.com"
API_DOMAIN="api.qfx-finance.com"
EMAIL="admin@qfx-finance.com"  # Change to a real contact email

echo "==> Installing Certbot..."
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx

echo "==> Obtaining certificate for ${DOMAIN} and www.${DOMAIN}..."
certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  --redirect

echo "==> Obtaining certificate for ${API_DOMAIN}..."
certbot --nginx \
  -d "${API_DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  --redirect

echo "==> Testing automatic renewal..."
certbot renew --dry-run

echo "==> Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "SSL certificates installed successfully!"
echo "  https://${DOMAIN}       — Frontend"
echo "  https://${API_DOMAIN}   — Backend API"
