# 🚀 Investment Platform

> A battle-tested, full-stack investment platform built for real-world usage — featuring crypto wallets, algorithmic bot trading, live asset exchange, KYC compliance, and a powerful admin panel.

---

## ✨ What's Inside

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS · TypeScript · PostgreSQL · TypeORM |
| **Queue** | Redis · BullMQ |
| **Frontend** | Next.js 15 · React · TypeScript · Tailwind CSS |
| **Auth** | JWT (15m) + rotating refresh tokens (30d) |
| **Security** | Helmet · rate limiting · bcrypt (12 rounds) · class-validator |
| **Docs** | Swagger / OpenAPI at `/api/docs` |
| **Infra** | Docker Compose (Postgres 15, Redis 7, Adminer) |

---

## 🗂️ Project Structure

```
backend/src/
├── auth/           JWT auth, guards, decorators, RBAC
├── users/          User profile management
├── kyc/            KYC verification flow + admin queue
├── wallets/        WalletConnect wallet management
├── assets/         Asset registry (USD, BTC, ETH, USDT…)
├── ledger/         Double-entry ledger engine
├── payments/       Deposits and withdrawals
├── exchange/       Asset exchange (quote + execute)
├── bots/           Bot strategies, instances, risk + kill switch
├── admin/          Admin dashboard, user management
├── audit/          Immutable audit log (global module)
├── notifications/  In-app notifications (global module)
└── database/       20 TypeORM entities + 29 enums

frontend/src/
├── app/
│   ├── (admin)/                  Route group (all authenticated pages)
│   │   ├── auth/
│   │   │   ├── login/            Login page
│   │   │   └── register/         Registration page
│   │   ├── dashboard/            Portfolio dashboard + balances
│   │   ├── kyc/                  KYC onboarding + status
│   │   ├── wallets/              Wallet management + deposits + withdrawals
│   │   ├── exchange/             Asset exchange UI
│   │   ├── bots/                 Bot trading UI
│   │   ├── ledger/               Transaction ledger viewer
│   │   ├── audit/                Audit log viewer
│   │   ├── notifications/        In-app notifications
│   │   └── admin/                Admin panel
│   │       ├── users/            User management
│   │       └── kyc/              KYC review queue
│   ├── api/proxy/                Next.js API route → backend proxy
│   ├── globals.css               Tailwind v4 theme tokens + dark mode
│   ├── layout.tsx                Root layout
│   ├── page.tsx                  Root redirect
│   └── providers.tsx             ThemeProvider + AuthProvider wrapper
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx            Top navigation bar
│   │   └── Sidebar.tsx           Side navigation menu
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── ThemeToggle.tsx       Light / dark mode toggle
├── contexts/
│   └── AuthContext.tsx           Global auth state + JWT management
├── lib/
│   ├── api.ts                    Axios client (base URL, interceptors)
│   ├── auth.ts                   Token helpers (store, refresh, decode)
│   ├── utils.ts                  Shared utilities
│   └── __tests__/api.test.ts
└── types/
    └── index.ts                  Shared TypeScript types
```

---

## ⚡ Quick Start

```bash
# 1. Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Spin up all services
docker-compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000/api/docs |
| Adminer (DB) | http://localhost:8080 |

---

## 🛠️ Local Development

```bash
# Backend (hot reload)
cd backend && npm install && npm run start:dev

# Frontend (hot reload)
cd frontend && npm install && npm run dev
```

---

## 🔐 Role-Based Access Control

| Role | Access Level |
|------|-------------|
| `USER` | Basic platform access |
| `VERIFIED_USER` | Full access after KYC verification |
| `COMPLIANCE_ADMIN` | KYC review queue |
| `FINANCE_ADMIN` | Payments and ledger management |
| `SUPPORT_ADMIN` | Read-only user support |
| `ADMIN` | System configuration |
| `SUPER_ADMIN` | Full access + global kill switches |

---

## 🌐 Key API Endpoints

```
# Authentication
POST /api/auth/register          Register a new user
POST /api/auth/login             Login → JWT + refresh token (or requires2fa flag)
POST /api/auth/2fa/enable        Enable TOTP 2FA (returns secret + otpauth URL)
POST /api/auth/2fa/confirm       Confirm 2FA setup with first TOTP code
POST /api/auth/2fa/verify        Complete 2FA login

# KYC
POST /api/kyc/start              Start KYC (Onfido applicant + SDK token)
POST /api/kyc/webhook            KYC provider webhook (HMAC-verified)

# Portfolio & Wallets
GET  /api/portfolio/balances     User balances
POST /api/wallet/verify          Verify wallet via SIWE signature

# Payments
POST /api/deposit/create         Create deposit (Stripe PaymentIntent)
POST /api/payments/webhook       Stripe webhook (HMAC-verified)

# Exchange
POST /api/exchange/quote         Get quote (30s expiry, live Binance prices)
POST /api/exchange/execute       Execute exchange

# Bots
GET  /api/bots/backtest          Run strategy backtest with candle simulation
POST /api/bots/create-instance   Launch a bot instance
POST /api/admin/bots/kill-switch Stop all bots globally
```

> Full interactive docs at **`/api/docs`** (Swagger/OpenAPI)

---

## 🏗️ Features

- **Auth** — JWT with rotating refresh tokens, TOTP 2FA (enable / confirm / disable / enforce on login)
- **RBAC** — 8-role system with guards and decorators on every endpoint
- **KYC** — Onfido applicant creation, SDK token, HMAC-verified webhook, admin approve/reject queue
- **Wallets** — WalletConnect v2 with SIWE on-chain signature verification
- **Multi-asset** — USD, BTC, ETH, USDT, USDC, BNB, SOL, ADA, XRP, DOGE (extensible registry)
- **Ledger** — Double-entry accounting with pessimistic DB row-level locking
- **Payments** — Stripe PaymentIntent deposits + withdrawals with AML/sanctions screening
- **Exchange** — Live Binance price feed (60s cache, mock fallback), quote → execute with fee/spread
- **Bots** — Strategy marketplace, instance lifecycle management, backtesting, global kill switch
- **Audit** — Append-only immutable audit log indexed by actor / action / target
- **Notifications** — In-app + email (nodemailer SMTP) with read tracking
- **Admin Panel** — KPIs, user management, KYC queue, audit log viewer
- **CI/CD** — GitHub Actions pipeline with `npm ci` build + lint checks
- **Infra** — Docker Compose with Postgres 15, Redis 7, backend, frontend, and Adminer

---

## 🛡️ Security Highlights

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT access tokens** (15m expiry) + rotating refresh tokens (30d)
- **TOTP 2FA** via `otplib`
- **CORS** restricted to `FRONTEND_URL`
- **Helmet** HTTP security headers
- **Rate limiting** — 100 requests / 60s per IP
- **Immutable audit log** for all privileged admin actions
- **Atomic transfers** with pessimistic row-level DB locks
- **HMAC-SHA256** signature verification on Stripe and Onfido webhooks
- **AML / sanctions screening** on every withdrawal (address + name)
