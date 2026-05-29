# Quick Start — Fortress Fund

Get your website running locally in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running locally (or Docker)
- Git configured

## Option A: Local Development (Easiest)

```bash
# Clone if needed
git clone https://github.com/MainOliver22/MainOliver22.git
cd MainOliver22
git checkout fortress-fund-website

# Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# Start PostgreSQL with Docker (if not already running)
docker run --name postgres-dev \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=investment_platform \
  -p 5432:5432 \
  -d postgres:15

# Update backend .env
cat > backend/.env << 'EOF'
DATABASE_URL=postgresql://admin:password@localhost:5432/investment_platform
REDIS_URL=redis://localhost:6379
APP_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
JWT_SECRET=your-dev-secret-key-here
ADMIN_DEFAULT_EMAIL=admin@fortress-fund.com
EOF

# Update frontend .env
cat > frontend/.env << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000/api
EOF

# Run migrations
cd backend
npm run migration:run
cd ..

# Start backend (Terminal 1)
cd backend
npm run start:dev
# Backend runs at http://localhost:4000

# Start frontend (Terminal 2)
cd frontend
npm run dev
# Frontend runs at http://localhost:3000
```

## Option B: Docker Compose (Production-like)

```bash
# Build and run everything
docker compose up -d

# Containers:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:4000/api
# - Adminer (database UI): http://localhost:8080
```

## Common Commands

```bash
# Run migrations (new database schema)
cd backend && npm run migration:run

# Revert migrations
cd backend && npm run migration:revert

# Run tests
cd backend && npm test
cd frontend && npm test

# Build for production
cd backend && npm run build
cd frontend && npm run build

# Format code
cd backend && npm run format
cd frontend && npm run lint
```

## Test the Application

1. Open http://localhost:3000
2. Click **Sign Up**
3. Create an account
4. Log in
5. Explore the dashboard

You should see:
- ✓ Investment portfolio
- ✓ Trading interface  
- ✓ Account settings
- ✓ Admin panel (with admin account)

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000 (backend)
lsof -ti:4000 | xargs kill -9
```

### Database connection error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# If not running, start it:
docker run --name postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=investment_platform \
  -p 5432:5432 \
  -d postgres:15
```

### "npm: command not found"
- Install Node.js from https://nodejs.org
- Verify: `node --version && npm --version`

## Next: Deploy to Free Platform

Once everything works locally, deploy to:

- **Frontend**: [Vercel](https://vercel.com) → 5 min setup
- **Backend**: [Railway](https://railway.app) → 10 min setup
- **Database**: Railway PostgreSQL → included free

See **FREE_DEPLOYMENT_GUIDE.md** for detailed instructions.

## Need Help?

Check the logs:
```bash
# Backend logs
cd backend && npm run start:dev

# Frontend logs (in browser console)
# Open DevTools → Console tab

# Docker logs
docker compose logs -f backend
docker compose logs -f frontend
```

Happy coding! 🚀
