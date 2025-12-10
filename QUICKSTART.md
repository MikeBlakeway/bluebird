# Bluebird Quick Reference

## Essential Commands

```bash
# Setup (first time)
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose up -d
npx prisma migrate dev
pnpm -w dev

# Development
pnpm -F web dev        # Frontend only
pnpm -F api dev        # Backend only
pnpm -w dev            # All services

# Testing
pnpm test              # Unit tests
pnpm test:integration  # Testcontainers (full stack)
pnpm test:e2e          # Playwright
pnpm lint              # ESLint
pnpm format            # Prettier

# Database
npx prisma migrate dev # Run migrations
npx prisma studio     # Open UI at http://localhost:5555

# Useful URLs (local dev)
Web:       http://localhost:3000
API:       http://localhost:4000
Postgres:  localhost:5432
Redis:     localhost:6379
MinIO:     http://localhost:9000
Grafana:   http://localhost:3001
```

## Git Workflow

```bash
# Start a feature
git checkout develop && git pull
git checkout -b feature/F-MVP-GEN-01-arrangement-planner

# Commit with conventional format
git commit -m "feat(api): add /plan/song endpoint

Accepts lyrics, genre, structure. Returns ArrangementSpec with BPM/key/instrumentation.
Related to F-MVP-GEN-01."

# Push & create PR
git push origin feature/F-MVP-GEN-01-arrangement-planner
# Create PR to develop on GitHub

# After approval, merge to develop (squash merge)
# Then merge develop → main (fast-forward)
```

## Code Patterns

### Zod DTO Validation (API route)

```ts
import { z } from 'zod'
import { PlanSongRequest } from '@bluebird/types'

export const planSongSchema = z.object({
  lyrics: z.string().min(10),
  genrePreset: z.enum(['pop_2010s', 'trap', 'folk']),
}) satisfies z.ZodType<PlanSongRequest>

// In Fastify route:
const req = planSongSchema.parse(request.body)
```

### SSE Client (Next.js)

```ts
const es = new EventSource(`${api}/jobs/${id}/events`)
es.onmessage = (e) => {
  const evt = JSON.parse(e.data) as JobEvent
  setTimeline((prev) => [...prev, evt])
}
es.onerror = () => {
  es.close()
  setTimeout(() => reconnect(id), Math.min(backoff, 8000))
}
```

### BullMQ Worker

```ts
const queue = new Queue('vocal', { connection: redis })

queue.process(async (job) => {
  const { projectId, sectionId, seed } = job.data

  // Call pod
  const response = await fetch('http://voice-pod:8000/run', {
    method: 'POST',
    body: JSON.stringify({
      jobId: job.id,
      inputS3: `projects/${projectId}/plan.json`,
      outputS3: `projects/${projectId}/jobs/${job.id}`,
      params: { seed },
    }),
  })

  return response.json()
})
```

### Idempotent POST (Frontend)

```ts
const response = await fetch(`${api}/render/section`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID(),
  },
  body: JSON.stringify({ planId, sectionId }),
})
```

## Key Files

| File                                  | Purpose                                              |
| ------------------------------------- | ---------------------------------------------------- |
| `.github/copilot-instructions.md`     | AI agent guidance (patterns, contracts, conventions) |
| `AGENTS.MD`                           | Mirror of copilot instructions                       |
| `CONTRIBUTING.md`                     | Git workflow, commit conventions, testing standards  |
| `README.md`                           | Project overview, setup, SLOs                        |
| `docs/project/FEATURES.MD`            | Feature list with F-IDs and acceptance criteria      |
| `docs/project/requirements/Method.md` | API contracts, architecture, algorithms              |
| `docs/development/DEVELOPMENT_LOG.md` | Sprint-by-sprint record of decisions & lessons       |
| `packages/types/`                     | Zod DTOs (source of truth)                           |

## Troubleshooting

### Docker services not starting

```bash
docker compose down -v  # Remove volumes
docker compose up -d    # Restart with fresh state
```

### Prisma migrations failed

```bash
npx prisma migrate resolve --rolled-back
npx prisma migrate dev
```

### Port already in use

```bash
lsof -i :3000           # Find process on port 3000
kill -9 <PID>           # Kill process
```

### TypeScript errors after git pull

```bash
rm -rf node_modules .pnpm-store
pnpm install
pnpm typecheck
```

### Tests failing after code change

```bash
pnpm test -- --reporter=verbose    # Verbose output
pnpm test -- --watch               # Watch mode
```

## SLO Targets (Sprint 0+)

- **TTFP (30s preview):** ≤45s P50, ≤90s P95
- **Section regen:** ≤20s P50, ≤40s P95
- **Full 3-min song:** ≤8 min P50, ≤16 min P95
- **GPU cost:** ≤$0.40 per 30s preview (P50)
- **Cache hit rate:** Track stems by seed; target ≥70%

## Documentation Checklist

After each sprint, update:

- [ ] `docs/development/DEVELOPMENT_LOG.md` — what was completed, why, lessons
- [ ] `.github/copilot-instructions.md` §11 — new patterns & anti-patterns
- [ ] `CONTRIBUTING.md` — if workflow changes
- [ ] Code comments — explain non-obvious decisions

## Need Help?

1. **API contract?** → `docs/project/requirements/Method.md`
2. **Feature scope?** → `docs/project/FEATURES.MD` (search by F-ID)
3. **Code patterns?** → `.github/copilot-instructions.md` §5–8
4. **Performance budget?** → `docs/project/requirements/Non-Functional-Requirements.md`
5. **Development history?** → `docs/development/DEVELOPMENT_LOG.md`

---

**Last Updated:** 8 Dec 2025
