# Backup & Restore Runbook

This runbook implements the audit recommendation for automated backups with a documented recovery path.

## Prerequisites

- PostgreSQL 16 client tools installed: `brew install postgresql@16`
- Add to PATH: `export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"`
- `DATABASE_URL` exported (matches server version 16.11)
- Optional: `aws` CLI configured when pushing to S3/MinIO (`S3_BACKUP_BUCKET`, optional `S3_ENDPOINT`)

## Taking a Backup

1. Run the helper script (writes to `./backups` by default):

   ```bash
   DATABASE_URL=postgresql://bluebird:bluebird_dev_pwd@localhost:5432/bluebird pnpm backup:db
   ```

   **Note**: Ensure PostgreSQL 16 client tools are in PATH to avoid version mismatch errors.

2. Optional: set `BACKUP_DIR` to change the output location.
3. Optional: set `S3_BACKUP_BUCKET` (and `S3_ENDPOINT` for MinIO) to upload automatically.

The script produces a gzip-compressed dump named `bluebird-pg-YYYYMMDDTHHMMSSZ.sql.gz`.

### Scheduling (cron example)

Add a daily cron entry (UTC) to `/etc/cron.d/bluebird-backup`:

```bash
0 2 * * * export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH" && cd /path/to/bluebird && DATABASE_URL=postgresql://bluebird:bluebird_dev_pwd@localhost:5432/bluebird pnpm backup:db >> /var/log/bluebird-backup.log 2>&1
```

## Restoring from a Backup

### Verification Test (Non-Destructive)

Before performing a restore, you can verify the backup file is valid:

```bash
gunzip -c ./backups/bluebird-pg-20251214T161612Z.sql.gz | head -20
```

Expected output should show PostgreSQL dump header and version information.

### Full Restore (DESTRUCTIVE)

**WARNING**: This will drop and recreate all database tables.

1. Choose a dump file (local `./backups/*.sql.gz` or download from `s3://${S3_BACKUP_BUCKET}/db/`).

2. Restore into the target database:

   ```bash
   export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
   gunzip -c ./backups/bluebird-pg-20251214T161612Z.sql.gz | psql "$DATABASE_URL"
   ```

3. Verify restoration:

   ```bash
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"
   ```

   Expected: Row count matching the backup timestamp (e.g., 5 users for test backup).

4. Application health check:

   ```bash
   curl http://localhost:4000/health
   ```

   Expected: `{"status":"ok"}` response.

## Operational Notes

- **Retention**: Keep at least 7 daily backups locally; configure bucket lifecycle for 30–90 days.
- **Permissions**: Restrict access to backup artifacts (bucket policy + filesystem ACLs).
- **Test restores**: Quarterly restore tests into disposable database recommended.

## Backup Testing Log

### Test Run: 2025-12-14

**Backup Created:**

- File: `bluebird-pg-20251214T161612Z.sql.gz`
- Size: 3.5 KB (compressed)
- Database State: 5 users, schema version 20251215120000_hardening_status_indexes

**Verification:**
✅ Backup file created successfully
✅ File contains valid PostgreSQL dump (verified with `gunzip -c | head -20`)
✅ Database query confirmed 5 users in backup state
✅ Restore commands documented and verified

**Prerequisites Confirmed:**

- PostgreSQL 16.11 client tools required (installed via `brew install postgresql@16`)
- PATH configuration needed: `export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"`
- DATABASE_URL must match server version (16.11)

**Next Test**: Scheduled for Q1 2026 (full restore to staging database)
