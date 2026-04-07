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
  app/(admin)/auth/            Login + Register
  app/(admin)/dashboard/       Portfolio dashboard + balances
  app/(admin)/kyc/             KYC onboarding + status
  app/(admin)/wallets/         Wallet management + deposits + withdrawals
  app/(admin)/exchange/        Asset exchange UI
  app/(admin)/bots/            Bot trading UI
  app/(admin)/ledger/          Transaction ledger viewer
  app/(admin)/audit/           Audit log viewer
  app/(admin)/notifications/   In-app notifications
  app/(admin)/admin/           Admin panel (users, KYC queue)
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
- `POST /api/auth/login` - Login (returns JWT + refresh token, or `requires2fa` flag)
- `POST /api/auth/2fa/enable` - Enable TOTP 2FA (returns secret + otpauth URL)
- `POST /api/auth/2fa/confirm` - Confirm 2FA setup with first TOTP code
- `POST /api/auth/2fa/verify` - Complete 2FA login with TOTP code
- `POST /api/kyc/start` - Start KYC (Onfido applicant + SDK token)
- `POST /api/kyc/webhook` - KYC provider webhook (HMAC-verified)
- `GET /api/portfolio/balances` - User balances
- `POST /api/deposit/create` - Create deposit (Stripe PaymentIntent for CARD method)
- `POST /api/payments/webhook` - Stripe payment webhook (HMAC-verified)
- `POST /api/wallet/verify` - Verify wallet ownership via SIWE signature
- `POST /api/exchange/quote` - Get exchange quote (30s expiry, live Binance prices)
- `POST /api/exchange/execute` - Execute exchange
- `GET /api/bots/backtest` - Run strategy backtest with candle simulation
- `POST /api/bots/create-instance` - Start a bot
- `POST /api/admin/bots/kill-switch` - Stop all bots globally
- Full Swagger docs at `/api/docs`

## Features

- [x] JWT auth with rotating refresh tokens
- [x] 8-role RBAC with guards and decorators on every endpoint
- [x] TOTP two-factor authentication (enable/confirm/disable/login enforcement)
- [x] KYC flow: Onfido applicant creation, SDK token, HMAC-verified webhook, admin approve/reject
- [x] WalletConnect wallet management with SIWE signature verification
- [x] Multi-asset support (USD, BTC, ETH, USDT, USDC, BNB, SOL, ADA, XRP, DOGE — extensible)
- [x] Double-entry ledger with pessimistic DB locking
- [x] Deposits (Stripe PaymentIntent for card) and withdrawals with AML/sanctions screening
- [x] Asset exchange: live Binance price feed (60s cache, mock fallback), quote (30s expiry) + execute with fee/spread
- [x] Bot trading: strategy marketplace, instance lifecycle, backtesting, global kill switch
- [x] Immutable audit log (append-only, indexed by actor/action/target)
- [x] In-app + email notifications (nodemailer SMTP) with read tracking
- [x] Admin panel: KPIs, user management, KYC queue, audit log viewer
- [x] Swagger/OpenAPI at `/api/docs`
- [x] Docker Compose: Postgres 15, Redis 7, backend, frontend, Adminer

## Security

- bcrypt password hashing (12 rounds)
- JWT access tokens (15m) + rotating refresh tokens (30d)
- TOTP two-factor authentication via `otplib`
- CORS restricted to `FRONTEND_URL`
- Helmet HTTP security headers
- Rate limiting: 100 req / 60s per IP
- Immutable audit log for all privileged admin actions
- Atomic balance transfers with pessimistic row-level DB locks
- Stripe + Onfido webhook HMAC-SHA256 signature verification
- AML/sanctions screening on every withdrawal (address + name)

## Phase 2 Roadmap

- [x] Real KYC provider (Onfido) with HMAC-SHA256 webhook verification
- [x] Real payment provider (Stripe) deposit intent + HMAC webhook verification
- [x] WalletConnect v2 on-chain SIWE signature verification
- [x] TOTP two-factor authentication (enable / confirm / disable / login enforcement)
- [x] Email notifications via SMTP (nodemailer, fire-and-forget)
- [x] Bot backtesting and simulation mode (`GET /bots/backtest` with candle data + PnL)
- [x] Binance live price feed (public REST, 60s TTL cache, mock fallback)
- [x] AML/sanctions screening on withdrawals (address + name check before fund lock)
- [x] GitHub Actions CI/CD pipeline
- [x] TypeORM migrations (replace `synchronize: true` for production)
