# Prisma Migrations

## Initial Setup

1. Ensure PostgreSQL is running:

   ```bash
   docker-compose up -d postgres
   ```

2. Generate Prisma Client:

   ```bash
   pnpm db:generate
   ```

3. Create and apply initial migration:

   ```bash
   pnpm db:migrate
   ```

   This will:
   - Prompt for migration name (e.g., "init")
   - Generate SQL migration file
   - Apply migration to database
   - Regenerate Prisma Client

## Development Workflow

### Create New Migration

```bash
pnpm db:migrate
```

### Apply Migrations (Production)

```bash
pnpm db:migrate:deploy
```

### Push Schema Without Migration (Dev Only)

```bash
pnpm db:push
```

### Open Prisma Studio

```bash
pnpm db:studio
```

## Migration Files

Migrations are stored in `prisma/migrations/` with timestamps.

Example structure:

```prisma
migrations/
  20231201120000_init/
    migration.sql
  migration_lock.toml
```

## Troubleshooting

### "Migration already applied"

- Delete `prisma/migrations/` and re-run `pnpm db:migrate`

### "Cannot connect to database"

- Check Docker: `docker-compose ps`
- Verify DATABASE_URL in `.env`

### Reset database (caution: deletes all data)

```bash
pnpm prisma migrate reset
```
