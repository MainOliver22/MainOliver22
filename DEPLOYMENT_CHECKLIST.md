# Fortress Fund - Deployment Checklist

## Pre-Deployment (Before Going Live)

### DNS Configuration
- [ ] Register domain `fortress-fund.com` with a registrar
- [ ] Create DNS A records at your registrar:
  ```
  Record Type: A
  Name: @
  Value: 199.192.21.55
  TTL: 300
  
  Record Type: A
  Name: www
  Value: 199.192.21.55
  TTL: 300
  
  Record Type: A
  Name: api
  Value: 199.192.21.55
  TTL: 300
  ```
- [ ] Verify DNS propagation (can take 5-30 minutes): `dig fortress-fund.com +short`

### Server Setup
- [ ] SSH into server: `ssh user@199.192.21.55`
- [ ] Update system: `apt-get update && apt-get upgrade -y`
- [ ] Install Docker: `curl -fsSL https://get.docker.com | sh`
- [ ] Install Docker Compose: `apt-get install -y docker-compose-plugin`
- [ ] Install Nginx: `apt-get install -y nginx`
- [ ] Configure firewall:
  ```bash
  ufw allow OpenSSH
  ufw allow 'Nginx Full'
  ufw --force enable
  ```

### Application Deployment
- [ ] Clone repository: `git clone https://github.com/MainOliver22/MainOliver22.git && cd MainOliver22`
- [ ] Checkout main branch: `git checkout main`
- [ ] Create backend .env file:
  ```bash
  cp backend/.env.example backend/.env
  nano backend/.env  # Fill in all required secrets
  ```
- [ ] Copy Nginx config:
  ```bash
  cp nginx/fortress-fund.conf /etc/nginx/sites-available/
  ln -sf /etc/nginx/sites-available/fortress-fund.conf /etc/nginx/sites-enabled/
  rm -f /etc/nginx/sites-enabled/default
  nginx -t  # Test configuration
  ```

### SSL Certificate Setup
- [ ] Run SSL setup script: `sudo chmod +x nginx/ssl-setup.sh && sudo nginx/ssl-setup.sh`
- [ ] Verify certificates exist:
  ```bash
  ls -la /etc/letsencrypt/live/fortress-fund.com/
  ls -la /etc/letsencrypt/live/api.fortress-fund.com/
  ```

### Third-Party Service Configuration
- [ ] Update Stripe webhook endpoint:
  - Go to Stripe Dashboard → Developers → Webhooks
  - Update endpoint: `https://api.fortress-fund.com/api/payments/webhook`
  - Keep events: `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.

- [ ] Update Onfido (KYC Provider):
  - Create webhook: `https://api.fortress-fund.com/api/kyc/webhook`
  - Copy signing secret to `KYC_WEBHOOK_SECRET` in `backend/.env`

- [ ] Configure SMTP (Email):
  - Update `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in `backend/.env`
  - Options: Gmail, SendGrid, Mailgun, etc.

- [ ] Configure WalletConnect:
  - Create project at https://cloud.walletconnect.com
  - Add `WALLETCONNECT_PROJECT_ID` to `backend/.env`

## Deployment

### Start Services
- [ ] Build and start containers:
  ```bash
  cd ~/MainOliver22
  docker compose up -d --build
  ```
- [ ] Verify all services are running:
  ```bash
  docker compose ps
  docker compose logs -f  # Check for errors
  ```

### Verification
- [ ] Frontend loads: `curl -I https://fortress-fund.com`
- [ ] Backend API responds: `curl https://api.fortress-fund.com/api`
- [ ] Swagger docs available: `curl -I https://api.fortress-fund.com/api/docs`
- [ ] Database accessible: Visit `http://localhost:8080` (Adminer)
- [ ] CORS headers correct: `curl -I https://api.fortress-fund.com -H "Origin: https://fortress-fund.com"`

## Post-Deployment Monitoring

### Daily Checks
- [ ] Monitor application logs: `docker compose logs -f`
- [ ] Check Docker container health: `docker compose ps`
- [ ] Monitor disk space: `df -h`
- [ ] Monitor memory/CPU: `docker stats`

### Weekly Maintenance
- [ ] Review error logs for patterns
- [ ] Verify SSL certificate expiration (auto-renewal should handle this)
- [ ] Check for security updates: `apt-get update && apt list --upgradable`

### SSL Certificate Renewal
- [ ] Certificate auto-renewal is configured via Certbot
- [ ] Verify renewal is working: `certbot renew --dry-run`
- [ ] Renewal cron job should be active (installed by Certbot)

## Rollback Procedure (If Needed)

If anything goes wrong:

1. Stop services: `docker compose down`
2. Check logs: `docker compose logs --tail=100`
3. Fix issues in `.env` files or configuration
4. Restart: `docker compose up -d --build`

To revert to the old domain temporarily:
1. Revert Nginx config: `cp nginx/qfx-finance.conf /etc/nginx/sites-available/` (if you kept it)
2. Update environment files with old domain
3. Reload Nginx: `systemctl reload nginx`

## Security Notes

- Keep `backend/.env` secure and never commit to Git
- Use strong passwords for database and JWT secrets
- Enable firewall and restrict SSH access
- Regularly update Docker images: `docker pull <image>` for each service
- Monitor logs for suspicious activity
- Consider setting up automated backups for the PostgreSQL database

## Useful Commands

```bash
# View Docker logs
docker compose logs -f backend
docker compose logs -f frontend

# Access database
docker exec -it fortress-fund-postgres-1 psql -U platform_user -d investment_platform

# Restart services
docker compose restart

# Rebuild after code changes
docker compose up -d --build

# View all environment variables
docker compose config

# Backup database
docker exec fortress-fund-postgres-1 pg_dump -U platform_user -d investment_platform > backup.sql

# Monitor system resources
watch -n 1 'docker stats --no-stream'
```

## Support & Documentation

- Full deployment guide: See `DEPLOY.md`
- Migration summary: See `MIGRATION_SUMMARY.md`
- API documentation: Available at `https://api.fortress-fund.com/api/docs` (after deployment)
- Architecture overview: See `README.md`

---

Good luck with your deployment! All systems are ready for production.
