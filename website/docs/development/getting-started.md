---
sidebar_position: 1
---

# Getting Started

## Prerequisites

- **Node.js** 20+ ([download](https://nodejs.org/))
- **pnpm** 9+ (`npm install -g pnpm`)
- **Docker** (optional, for services like PostgreSQL, Redis, MinIO)
- **Git** for version control

## Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MikeBlakeway/bluebird.git
cd bluebird
```

### 2. Install Dependencies

```bash
pnpm install
```

The project uses **pnpm workspaces** to manage packages:

```
bluebird/
  apps/web            # Next.js frontend
  apps/api            # Fastify backend
  packages/types      # Shared DTOs and schemas
  packages/client     # API client SDK
  packages/telemetry  # OpenTelemetry helpers
  packages/ui         # Shared React components
  packages/config     # ESLint, TypeScript, Prettier configs
  website/            # Docusaurus documentation site
```

### 3. Set Up Environment

Copy environment templates:

```bash
cd apps/api
cp .env.example .env.local

cd ../web
cp .env.example .env.local
```

Update `.env.local` with your configuration (database, API URLs, etc.).

### 4. Database Setup

Initialize the database:

```bash
pnpm -F api run db:migrate
```

Explore with Prisma Studio:

```bash
pnpm -F api run db:studio
```

### 5. Start Development Servers

Run all services in parallel:

```bash
pnpm dev
```

Individual services:

```bash
pnpm -F web run dev       # Next.js (http://localhost:3000)
pnpm -F api run dev       # Fastify (http://localhost:4000)
pnpm docs:dev             # Docusaurus (http://localhost:3000)
```

## Verification

Once running, verify each service:

- **Web**: http://localhost:3000 — Should show the Bluebird UI
- **API**: http://localhost:4000/health — Should return `{"status":"ok"}`
- **Swagger**: http://localhost:4000/documentation — Interactive API docs
- **Docs**: http://localhost:3001 — This documentation site

## Next Steps

- **[Architecture](/docs/architecture/overview)** — Learn about system design
- **[API Reference](/docs/api/overview)** — Explore endpoints
- **[Development Guide](/docs/development/branching-strategy)** — Git workflow and standards
- **Contributing** — https://github.com/MikeBlakeway/bluebird/blob/develop/CONTRIBUTING.md

## Troubleshooting

### Port Already in Use

If ports 3000, 4000, or 3001 are in use:

```bash
# Change port for next app
pnpm -F web run dev -- -p 3001

# Change port for API
BLUEBIRD_PORT=4001 pnpm -F api run dev
```

### Database Connection Issues

Ensure PostgreSQL is running and `DATABASE_URL` is correct in `.env.local`.

### Missing Dependencies

Clear cache and reinstall:

```bash
pnpm install --frozen-lockfile
rm -rf node_modules
pnpm install
```

## Getting Help

- Check [Development](/docs/development) guides
- Review [GitHub Issues](https://github.com/MikeBlakeway/bluebird/issues)
- See [CONTRIBUTING.md](https://github.com/MikeBlakeway/bluebird/blob/develop/CONTRIBUTING.md)
