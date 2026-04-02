# Investment Platform

A production-ready full-stack investment platform with WalletConnect, bot trading, exchange, KYC, and admin panel.

## Tech Stack

- **Backend:** NestJS + TypeScript + PostgreSQL + TypeORM (double-entry ledger)
- **Queue:** Redis + BullMQ
- **Frontend:** Next.js 15 + React + TypeScript + Tailwind CSS
- **Auth:** JWT + Refresh Tokens (rotating)
- **Security:** Helmet, rate limiting, bcrypt (12 rounds), class-validator
- **Docs:** Swagger/OpenAPI at `/api/docs`
- **Infra:** Docker Compose

## Project Structure

```
backend/src/
  auth/          JWT auth, guards, decorators, RBAC
  users/         User profile management
  kyc/           KYC verification flow + admin queue
  wallets/       WalletConnect wallet management
  assets/        Asset registry (USD, BTC, ETH, USDT)
  ledger/        Double-entry ledger engine
  payments/      Deposits and withdrawals
  exchange/      Asset exchange (quote + execute)
  bots/          Bot strategies, instances, risk + kill switch
  admin/         Admin dashboard, user management
  audit/         Immutable audit log (global module)
  notifications/ In-app notifications (global module)
  database/      20 TypeORM entities + 29 enums

frontend/src/
  app/auth/       Login + Register
  app/dashboard/  Portfolio dashboard + balances
  app/kyc/        KYC onboarding + status
  app/deposit/    Deposit funds
  app/exchange/   Asset exchange UI
  app/bots/       Bot trading UI
  app/admin/      Admin panel (dashboard, users, KYC, audit)
```

## Quick Start

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker-compose up -d

# Backend API docs: http://localhost:4000/api/docs
# Frontend:         http://localhost:3000
# Adminer (DB):     http://localhost:8080
```

## Development

```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend
cd frontend && npm install && npm run dev
```

## Roles

| Role | Description |
|------|-------------|
| USER | Basic platform access |
| VERIFIED_USER | Full access after KYC |
| COMPLIANCE_ADMIN | KYC review queue |
| FINANCE_ADMIN | Payments and ledger |
| SUPPORT_ADMIN | User support, read-only |
| ADMIN | System configuration |
| SUPER_ADMIN | Full access + kill switches |

## API Highlights

- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login (returns JWT + refresh token)
- `GET /api/portfolio/balances` - User balances
- `POST /api/deposit/create` - Create deposit
- `POST /api/exchange/quote` - Get exchange quote (30s expiry)
- `POST /api/exchange/execute` - Execute exchange
- `POST /api/bots/create-instance` - Start a bot
- `POST /api/admin/bots/kill-switch` - Stop all bots globally
- Full Swagger docs at `/api/docs`

## Features

- [x] JWT auth with rotating refresh tokens
- [x] 8-role RBAC with guards and decorators on every endpoint
- [x] KYC flow: user-initiated, webhook-driven, admin approve/reject
- [x] WalletConnect wallet management
- [x] Multi-asset support (USD, BTC, ETH, USDT - extensible)
- [x] Double-entry ledger with pessimistic DB locking
- [x] Deposits and withdrawals (with admin approval for large amounts)
- [x] Asset exchange: quote (30s expiry) + execute with fee/spread
- [x] Bot trading: strategy marketplace, instance lifecycle, global kill switch
- [x] Immutable audit log (append-only, indexed by actor/action/target)
- [x] In-app notifications with read tracking
- [x] Admin panel: KPIs, user management, KYC queue, audit log viewer
- [x] Swagger/OpenAPI at `/api/docs`
- [x] Docker Compose: Postgres 15, Redis 7, backend, frontend, Adminer

## Security

- bcrypt password hashing (12 rounds)
- JWT access tokens (15m) + rotating refresh tokens (30d)
- CORS restricted to `FRONTEND_URL`
- Helmet HTTP security headers
- Rate limiting: 100 req / 60s per IP
- Immutable audit log for all privileged admin actions
- Atomic balance transfers with pessimistic row-level DB locks

## Phase 2 Roadmap

- [ ] Real KYC provider (Sumsub/Onfido) with HMAC webhook verification
- [ ] Real payment providers (Stripe, ACH, bank transfer reconciliation)
- [ ] WalletConnect v2 on-chain signature verification
- [ ] TOTP two-factor authentication
- [ ] Email/SMS notifications (SMTP, Twilio)
- [ ] Bot backtesting and simulation mode
- [ ] External exchange connectors (Binance/Bybit REST + WebSocket)
- [ ] AML/sanctions screening on withdrawals
- [ ] GitHub Actions CI/CD pipeline
- [ ] TypeORM migrations (replace `synchronize: true` for production)
