# Deployment Guide — qfx-finance.com

This document explains every step needed to get `https://qfx-finance.com` and `https://api.qfx-finance.com` live on the VPS.

---

## Server Details

| Item | Value |
|------|-------|
| Server IP | `199.192.21.55` |
| OS | Ubuntu 22.04+ (recommended) |
| Frontend URL | `https://qfx-finance.com` |
| Backend API URL | `https://api.qfx-finance.com/api` |
| Swagger Docs | `https://api.qfx-finance.com/api/docs` |

---

## 1 — DNS Configuration

At your domain registrar (wherever `qfx-finance.com` is registered), create the following **A records**:

| Name | Type | Value | TTL |
|------|------|-------|-----|
| `@` | A | `199.192.21.55` | 300 |
| `www` | A | `199.192.21.55` | 300 |
| `api` | A | `199.192.21.55` | 300 |

Wait for DNS propagation (usually 5–30 minutes) before continuing.  
Verify with: `dig qfx-finance.com +short` — should return `199.192.21.55`.

---

## 2 — Server Prerequisites

SSH into the server and run:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Install Nginx
apt-get install -y nginx
systemctl enable --now nginx

# Open firewall ports
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

---

## 3 — Clone the Repository

```bash
cd ~
git clone https://github.com/MainOliver22/MainOliver22.git
cd MainOliver22
git checkout gh-branch
```

---

## 4 — Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env   # Fill in all secrets (DB password, JWT secrets, API keys, etc.)

# Frontend (optional — NEXT_PUBLIC_* vars are baked in at Docker build time via docker-compose.yml)
cp frontend/.env.example frontend/.env
```

**Required backend `.env` values to set:**

| Variable | Description |
|----------|-------------|
| `POSTGRES_PASSWORD` | Strong DB password |
| `JWT_SECRET` | Random 64-char string |
| `JWT_REFRESH_SECRET` | Different random 64-char string |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256 |
| `ADMIN_DEFAULT_EMAIL` | Initial admin email |
| `ADMIN_DEFAULT_PASSWORD` | Initial admin password (≥12 chars) |
| `KYC_API_KEY` | Onfido API key |
| `KYC_WEBHOOK_SECRET` | Onfido webhook secret |
| `PAYMENT_STRIPE_KEY` | Stripe secret key |
| `PAYMENT_STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP credentials |

---

## 5 — Install Nginx Site Configuration

```bash
# Copy Nginx config
cp nginx/qfx-finance.conf /etc/nginx/sites-available/qfx-finance.conf
ln -sf /etc/nginx/sites-available/qfx-finance.conf /etc/nginx/sites-enabled/

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

# Test config (will warn about missing SSL certs — that's OK at this step)
nginx -t || true
systemctl reload nginx
```

---

## 6 — Obtain SSL Certificates

Run the provided setup script to get Let's Encrypt certificates:

```bash
chmod +x nginx/ssl-setup.sh
sudo nginx/ssl-setup.sh
```

This installs Certbot, obtains certificates for both `qfx-finance.com` and `api.qfx-finance.com`, and configures automatic renewal.

---

## 7 — Start the Application

```bash
cd ~/MainOliver22
docker compose up -d --build
```

Check that all containers are healthy:

```bash
docker compose ps
docker compose logs -f
```

---

## 8 — Configure GitHub Actions CI/CD (Automated Deployments)

Add the following **repository secrets** in GitHub → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `DEPLOY_HOST` | `199.192.21.55` |
| `DEPLOY_USER` | SSH username (e.g. `root` or `ubuntu`) |
| `DEPLOY_SSH_KEY` | Private SSH key for the server |

Generate a dedicated deploy key if needed:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""
cat ~/.ssh/deploy_key.pub >> ~/.ssh/authorized_keys   # on the server
# Copy ~/.ssh/deploy_key (private key) to the DEPLOY_SSH_KEY secret
```

Once secrets are set, every push to `gh-branch` that passes CI will automatically deploy to the VPS.

---

## 9 — Verify the Deployment

```bash
# Frontend
curl -I https://qfx-finance.com

# Backend API health
curl https://api.qfx-finance.com/api

# Swagger docs
curl -I https://api.qfx-finance.com/api/docs
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Domain not resolving | Check DNS A records; wait for propagation |
| SSL certificate error | Re-run `nginx/ssl-setup.sh`; ensure port 80 is open |
| 502 Bad Gateway | Frontend/backend containers not running — check `docker compose ps` |
| CORS errors | Ensure `FRONTEND_URL=https://qfx-finance.com` in `backend/.env` |
| API 404 on all routes | `NEXT_PUBLIC_API_URL` must end with `/api` (e.g. `https://api.qfx-finance.com/api`) |
