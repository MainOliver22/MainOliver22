#!/bin/bash
# ============================================================
# Fortress Fund — SSL Certificate Setup via Certbot
# Run this script ONCE on the VPS to obtain Let's Encrypt
# certificates for fortress-fund.com and api.fortress-fund.com.
#
# Prerequisites:
#   - Nginx installed and running (nginx -t passes)
#   - DNS A records already pointing to this server:
#       fortress-fund.com     -> 199.192.21.55
#       www.fortress-fund.com -> 199.192.21.55
#       api.fortress-fund.com -> 199.192.21.55
#   - Port 80 open in firewall (ufw allow 'Nginx HTTP')
# ============================================================

set -e

DOMAIN="fortress-fund.com"
API_DOMAIN="api.fortress-fund.com"
EMAIL="admin@fortress-fund.com"  # Change to a real contact email

echo "==> Installing Certbot..."
apt-get update -qq
apt-get install -y -qq certbot

echo "==> Stopping Nginx to free port 80..."
systemctl stop nginx

echo "==> Obtaining certificate for ${DOMAIN} and www.${DOMAIN}..."
certbot certonly --standalone \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}"

echo "==> Obtaining certificate for ${API_DOMAIN}..."
certbot certonly --standalone \
  -d "${API_DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}"

echo "==> Starting Nginx with SSL configuration..."
nginx -t && systemctl start nginx

echo ""
echo "SSL certificates installed successfully!"
echo "  https://${DOMAIN}       — Frontend"
echo "  https://${API_DOMAIN}   — Backend API"
