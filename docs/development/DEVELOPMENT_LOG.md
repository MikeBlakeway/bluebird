# Bluebird Development Log

**Purpose:** Track architectural decisions, completed work, lessons learned, and integration patterns. Updated after each sprint or major milestone.

**Last Updated:** December 2024 (Post-Sprint 1, Pre-Sprint 2)

---

## Quick Status

| Sprint   | Status               | Version          | Key Deliverables                                  |
| -------- | -------------------- | ---------------- | ------------------------------------------------- |
| Sprint 0 | ✅ Complete          | v0.1.0           | Foundation, auth, planning endpoints, SSE, CLI    |
| Sprint 1 | ✅ Backend Complete  | v0.2.0 (pending) | Music/voice/mix/export workers, integration tests |
| Sprint 1 | ⏭️ Frontend Deferred | -                | Next.js, WebAudio, workspace UI → Sprint 2        |
| Sprint 2 | ⏳ Ready             | v0.3.0 (planned) | Frontend + section regeneration                   |

**Current Focus:** Transition to Sprint 2 (frontend + section-level features)

---

## Sprint 0: Foundation & Auth (Planned: Dec 26 – Jan 6)

**Goal:** Stand up monorepo, local stack, auth, planning endpoints, SSE hello-world.

**Completed Work:**

- [x] Monorepo scaffold (pnpm workspaces: apps/web, apps/api, packages/\*)
- [x] Docker Compose stack (Postgres, Redis, MinIO, Grafana, Prometheus)
- [x] Prisma schema & migrations (users, projects, jobs, takes, sections, artifacts)
- [x] CI/CD setup (ESLint, TypeScript strict, contract tests, unit tests)
- [x] Magic-link auth (SMTP local console for dev; JWT httpOnly cookie)
- [x] Analyzer pod stub (lyrics parse, reference analysis placeholder)
- [x] Planner pod stub (structure/BPM/key heuristics v0)
- [x] Orchestrator endpoints (`/plan/song`, `/plan/arrangement`, `/plan/vocals`)
- [x] BullMQ queues (plan, analyze queues; priority lanes; DLQ) — **D8 completed**
- [x] SSE server (`/jobs/:id/events`; heartbeat; reconnect) — **D9 completed**
- [x] CLI `bluebird plan` command (Commander.js; watch mode; progress bars) — **D10 completed**
- [x] Demo script (end-to-end flow with sample lyrics + SSE streaming)
- [x] Burn-in tests (10 concurrent jobs, 5 parallel SSE streams, idempotency, edge cases)

**Architectural Decisions:**

- **Monorepo tool:** pnpm workspaces (faster, less boilerplate than Lerna; hoisting strategy: node-linker=hoisted)
- **Auth:** Magic-link via passwordless flow; JWT in httpOnly cookie (CSRF safe; no refresh tokens yet)
- **Database:** Prisma ORM for clarity + migrations; schema-first design
- **Queue:** BullMQ + Redis; named queues enable selective scaling; priority = pro(10) vs standard(1)
- **API Framework:** Fastify (lightweight, schema validation via JSON Schema; pairs well with OpenAPI)
- **Inference stub:** Click patterns + sine tones for dev; real models later

**Integration Points:**

- Orchestrator → Redis: Job enqueue; BullMQ naming convention `{queue}:{projectId}:{jobId}`
- Worker → Analyzer/Planner: HTTP calls; S3 for artifact handoff (no large payloads in-process)
- SSE client (web) → Orchestrator: EventSource w/ heartbeat every 15s; exp backoff reconnect (500ms → 8s)

**Development Patterns Established:**

1. **DTO validation:** All requests/responses validated via Zod from `packages/types`
2. **Job artifact path:** `projects/{projectId}/jobs/{jobId}/{stage}/{artifact}.{ext}`
3. **Seed propagation:** CLI → API → Worker → Pods; enables reproducibility + caching
4. **Idempotency:** All POSTs include `Idempotency-Key` header; stored in DB to prevent duplicates

**Performance Observations:**

- Local planner stub: 0.5s (CPU-bound)
- Redis round-trip: <1ms average (with local Redis on same Docker network)
- TTFP baseline: ~2s (plan + SSE handshake); real TTFP measured in Sprint 1

### D8: BullMQ Queue Implementation (Dec 9, 2025)

Files created:

- `apps/api/src/lib/queue.ts` (128 lines): Queue config, enqueue functions, job status lookup
- `apps/api/src/lib/worker.ts` (185 lines): Worker processes with plan/analyze handlers
- `apps/api/src/worker-entry.ts` (23 lines): Standalone worker process entry point
- `apps/api/src/lib/queue.integration.test.ts` (96 lines): Queue integration tests

Key implementation details:

- **Queue names:** plan, analyze, melody, synth, vocal, mix, check, export (aligned with pod responsibilities)
- **Priority levels:** PRO=10, STANDARD=1 (BullMQ native priority queue)
- **Idempotency:** jobId used as BullMQ jobId for automatic deduplication
- **DLQ:** Failed jobs kept in Redis (removeOnFail=false) with 3 retry attempts + exponential backoff (5s → 25s → 125s)
- **Completed job retention:** 24 hours or 1000 jobs, whichever comes first
- **Worker concurrency:** plan=5, analyze=10 (analyze is faster, CPU-bound)
- **Redis connection:** Shared IORedis instance across queues/workers (maxRetriesPerRequest=null for BullMQ compatibility)

Orchestrator changes:

- POST /plan/song now returns HTTP 202 Accepted (was 200 OK)
- Response status changed from 'planned' to 'queued'
- Response no longer includes immediate plan (will be fetched via GET /jobs/:id or SSE in D9)
- Idempotency-Key header now used as jobId if provided

Worker architecture:

- Separate process: `pnpm -F @bluebird/api worker`
- Graceful shutdown on SIGTERM/SIGINT
- Progress updates: 10% → 30% → 50% → 70% → 90% → 100% (mapped to job stages)
- Job persistence: upserts to Take model with plan JSON field

Integration tests:

- Queue/worker communication verified
- Priority ordering confirmed (PRO > STANDARD)
- Idempotency deduplication tested
- Tests run with 15s timeout (worker processing + Redis latency)

**Lessons Learned:**

- **IORedis import:** Must use default export `import IORedis from 'ioredis'` not named export
- **BullMQ jobId:** Using jobId as idempotency key prevents duplicate jobs automatically (BullMQ rejects duplicates)
- **Worker separation:** Running workers in separate process prevents API server blocking; can scale independently
- **Progress granularity:** 10% increments sufficient for progress bars; finer updates add Redis overhead without UX benefit
- **Must commit:** Idempotency keys are non-negotiable for cost control; prevents duplicate GPU charges
- **S3 artifacts:** Store JSON reports (plan.json, features.json) + WAV stems; presign URLs short TTL (15 min)
- **Queue naming:** Include scope (projectId) in jobId to enable per-project isolation + dead-letter analysis
- **SSE heartbeats:** Missing heartbeats caused client reconnection storms; 15s interval + server keep-alive prevents flapping

**Anti-Patterns Avoided:**

- ❌ Avoided: Large payloads in queue jobs; use S3 keys instead
- ❌ Avoided: Shared database for job state + artifacts; separate concerns (PG for metadata, S3 for media)
- ❌ Avoided: No seed tracking; added seed to every job for reproducibility

### D9: SSE Job Events Streaming (Dec 9, 2025)

Files created:

- `apps/api/src/lib/events.ts` (56 lines): Redis pub/sub event bus for job events
- `apps/api/src/routes/jobs.ts` (75 lines): SSE endpoint `GET /jobs/:jobId/events`
- `apps/api/src/lib/events.test.ts` (110 lines): Event bus unit tests
- `apps/api/src/routes/jobs.test.ts` (68 lines): SSE endpoint integration tests

Key implementation details:

- **Redis pub/sub:** Job-specific channels (`job-events:{jobId}`) for targeted event delivery
- **SSE endpoint:** `GET /jobs/:jobId/events` streams real-time job updates with proper headers
- **Heartbeat:** 15-second interval with `: heartbeat\n\n` keep-alive messages
- **Initial state:** Fetches current job status from BullMQ on connection for immediate feedback
- **Event schema:** JobEvent (jobId, stage, progress, message, timestamp, error) validated via Zod
- **Stage mapping:** BullMQ job states (waiting/active/completed/failed) mapped to JobStage enum
- **Reconnect support:** Client can reconnect anytime; receives current state snapshot on connect
- **Worker integration:** Workers emit events at each stage (analyzing, planning, completed, failed)
- **Orchestrator integration:** Emits initial "queued" event when job is enqueued

Worker event emission:

- 10% progress: "Analyzing lyrics" (stage: analyzing)
- 30% progress: "Analysis complete" (stage: analyzing)
- 50% progress: "Planning arrangement" (stage: planning)
- 70% progress: "Arrangement ready" (stage: planning)
- 90% progress: "Persisted plan" (stage: planning)
- 100% progress: Job completed (stage: completed)
- On failure: Emits "failed" stage with error message

Client connection handling:

- Automatic cleanup on client disconnect (closes Redis subscriber)
- Graceful unsubscribe via request.raw 'close' event
- No memory leaks from orphaned subscriptions

Testing coverage:

- Event bus publish/subscribe verification
- Multiple subscribers for same job (broadcast)
- Job isolation (subscribers only receive events for their jobId)
- SSE response headers and format validation
- Heartbeat message presence
- Invalid jobId handling (400 error)

**Lessons Learned:**

- **Redis pub/sub isolation:** Each jobId gets dedicated channel; prevents cross-job event leakage
- **SSE headers critical:** Must set `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- **Initial state fetch:** Clients expect immediate feedback; fetching BullMQ job state on connect prevents "waiting for first event" UX
- **Heartbeat prevents timeouts:** Without heartbeat, proxies/load balancers close "idle" SSE connections; 15s interval is sweet spot
- **Stage mapping complexity:** BullMQ state (waiting/active/completed) doesn't map 1:1 to domain stages; needs translation layer
- **Cleanup is critical:** Must unsubscribe Redis listener on client disconnect; memory leaks accumulate fast with long-running SSE
- **TypeScript optional chaining:** Tests must use `events[0]?.field` due to strict undefined checks

**Anti-Patterns Avoided:**

- ❌ Avoided: Global event channel for all jobs; per-job channels enable efficient filtering
- ❌ Avoided: Polling job status; SSE provides real-time updates without API hammering
- ❌ Avoided: No heartbeat; connections die silently without keep-alive
- ❌ Avoided: Skipping initial state; clients would see blank UI until first worker event

### D10: CLI, Demo Script, and Burn-in Tests (Dec 9, 2025)

Files created:

- `apps/api/src/cli.ts` (125 lines): Commander.js CLI with `bluebird plan` command
- `scripts/demo.ts` (123 lines): End-to-end demonstration script with SSE streaming
- `apps/api/src/server.burnin.test.ts` (161 lines): Load/stress tests for production validation
- `apps/api/prisma/README.md` (72 lines): Migration workflow documentation
- `apps/api/prisma/migrations/` (directory): Prisma migrations storage

Key implementation details:

**CLI Tool (`bluebird plan`):**

- **Framework:** Commander.js 11.1.0 (industry standard, TypeScript-friendly)
- **Required options:** `--lyrics <text>` (10-5000 characters validated)
- **Optional flags:** `--genre`, `--project`, `--seed`, `--pro`, `--watch`
- **Watch mode:** Live SSE progress bars with █/░ characters (20-character width)
- **Output:** Returns jobId, SSE URL, project ID, plan endpoint
- **Progress display:** Updates on each job stage (analyzing → planning → completed)
- **Error handling:** Validates lyrics length, shows helpful error messages

**Demo Script:**

- **Sample lyrics:** 14-line song ("Lost in the city lights tonight...")
- **Flow:** Display lyrics → Enqueue job → Subscribe SSE → Show progress → Summary
- **Progress visualization:** Real-time timestamps, stage names, progress bars
- **Completion message:** Celebrates Sprint 0 completion with checklist (D1-D10)
- **Summary stats:** Lines analyzed, sections planned, total execution time
- **Run command:** `pnpm demo` (added to root package.json)

**Burn-in Tests (5 comprehensive tests):**

1. **Concurrent jobs** (30s timeout): Enqueues 10 jobs simultaneously, alternates PRO/STANDARD priority
2. **Parallel SSE streams** (60s timeout): 5 jobs with simultaneous SSE subscriptions, verifies all receive events
3. **Idempotency test**: Enqueues same jobId twice, verifies deduplication
4. **Edge case - short lyrics**: 10-character minimum (barely valid)
5. **Edge case - long lyrics**: 5000-character maximum (280-line repetition test)

**Prisma Migration Infrastructure:**

- **Migrations directory:** Created `apps/api/prisma/migrations/` for version-controlled schema changes
- **README documentation:** Workflow guide with dev vs production commands
- **Scripts updated:**
  - `db:migrate` → `prisma migrate dev` (interactive, generates migration files)
  - `db:migrate:deploy` → `prisma migrate deploy` (non-interactive, for CI/production)
  - `db:push` → `prisma db push` (prototyping, skips migration files)
  - `db:generate` → `prisma generate` (regenerates Prisma Client)

**Configuration Updates:**

- **ESLint override:** Added `no-console: "off"` for CLI/scripts files (user-facing output requires console)
- **Package dependencies:** Added `commander": "^11.1.0"` to apps/api
- **Demo script hook:** Root package.json now includes `"demo": "node --loader tsx ./scripts/demo.ts"`

**Lessons Learned:**

- **CLI framework choice:** Commander.js preferred over yargs/minimist for TypeScript support + chaining API
- **Progress bar UX:** 20-character width (█/░) is sweet spot for readability; 5% increments (5 chars each)
- **Burn-in test timeouts:** Must be generous (30s-60s) to account for worker processing + Redis latency
- **Demo script value:** Provides immediate visual validation for stakeholders; shows complete Sprint 0 flow
- **Prisma migration naming:** Use descriptive names (`init`, `add_artifacts`, `add_similarity`) not timestamps alone
- **Watch mode importance:** Real-time feedback critical for CLI UX; SSE makes this trivial to implement
- **Long lyrics edge case:** 5000 characters = ~280 lines = ~50 sections = tests planner boundary conditions

**Anti-Patterns Avoided:**

- ❌ Avoided: Custom CLI parser; Commander.js handles validation/help/errors
- ❌ Avoided: Polling in demo script; SSE provides instant updates
- ❌ Avoided: Skipping burn-in tests; load scenarios reveal race conditions unit tests miss
- ❌ Avoided: CLI without watch mode; users would need to manually poll SSE endpoint

**Sprint 0 Completion Status:**

✅ **D1-D2:** Monorepo + Docker + Prisma schema
✅ **D3:** CI + Types + Zod DTOs
✅ **D4:** Magic-link auth + JWT + Project CRUD
✅ **D5:** Analyzer library (10 tests passing)
✅ **D6:** Planner v0 (12 tests passing)
✅ **D7:** Orchestrator endpoints (POST /plan/song)
✅ **D8:** BullMQ queues + workers + DLQ (3 integration tests)
✅ **D9:** SSE streaming + Redis pub/sub (2 integration tests)
✅ **D10:** CLI + Demo + Burn-in tests + Migrations (5 load tests)

**Total Test Coverage:** 34 tests (10 analyzer + 12 planner + 3 queue + 2 events + 2 jobs + 5 burn-in)

**Outstanding Questions:**

- Prisma scaling: When does generated query complexity become a bottleneck? Plan cache strategy?
- SSE tail latency: P95 with slow network clients? Implement streaming response gzip?
- Event retention: Should we persist events to DB for audit trail or rely on ephemeral Redis pub/sub?
- Rate limiting: How to prevent SSE connection spam (e.g., malicious reconnect loops)?
- TypeScript upgrade: Move to 5.6/5.7 before Sprint 1 or defer until stable?

---

## Sprint 1: Preview Vertical Slice (Planned: Jan 9 – 20)

**Goal:** End-to-end 30s preview (lyrics→audio) with stubs; workspace UI; local A/B preview.

**Completed Work:**

- [ ] Music synth stub (click patterns + simple loop bed per section)
- [ ] Voice synth stub (syllable-aligned tones + basic phrasing)
- [ ] Mix & mastering stub (sum stems + LUFS clamp to -14)
- [ ] Export preview (WAV 48kHz/24-bit; MP3 320kbps; presigned URLs)
- [ ] Next.js workspace (lyrics panel, structure grid, artist sidebar)
- [ ] WebAudio local mixer (per-track gain/mute/pan; era presets; A/B compare)
- [ ] Section controls (lock/regen placeholders; visual status chips)
- [ ] Job timeline UI (SSE progress; stage/ETA; downloadable artifacts)

**Architectural Decisions:**

- [ ] To be recorded

**Integration Points:**

- [ ] To be recorded

**Development Patterns Established:**

- [ ] To be recorded

**Performance Observations:**

- [ ] TTFP baseline will be measured here
- [ ] WebAudio latency profiling (A/B switch time)

**Lessons Learned:**

- [ ] To be recorded

**Anti-Patterns Avoided:**

- [ ] To be recorded

**Outstanding Questions:**

- [ ] To be recorded

---

## Sprint 2: Section Regen (Planned: Jan 23 – Feb 3)

**Goal:** Per-section regeneration (<20s); lock/unlock semantics.

**Completed Work:**

- [ ] TBD

---

## Sprint 3–4: Remix & Similarity Gate (Planned: Feb 6 – Mar 3)

**Goal:** Reference upload, feature extraction, similarity checking, export gating.

**Completed Work:**

- [ ] TBD

---

## Sprint 5–6: Export & Observability (Planned: Mar 6 – Mar 31)

**Goal:** Stems packaging, CDN distribution, OTEL tracing, cost monitoring.

**Completed Work:**

- [ ] TBD

---

## Global Patterns & Decisions

### Code Organization

- **Zod schemas:** All DTOs in `packages/types`; JSON schemas for OpenAPI
- **API routes:** Fastify plugins per domain (`routes/plan.ts`, `routes/remix.ts`, etc.)
- **Workers:** Per-queue; consume from BullMQ; emit OTEL spans + structured logs

### Testing

- **Golden fixtures:** Small (10–30s) WAV files in git-lfs; expected features/verdicts committed
- **Contract tests:** Generate OpenAPI; snapshot in CI; fail on breaking changes
- **Observability tests:** Assert required OTEL spans exist (runId, stage, seed, section-ID)

### Performance Budgets

- Strictly enforced in CI (k6 load tests + P50/P95 gates)
- GPU cost: ≤$0.40 per 30s preview; ≤$2.50 per 3-min render
- TTFP target: 45s P50; per-section regen target: 20s P50

### Safety & Compliance

- **Reference storage:** Features only by default; raw audio only with user opt-in
- **Similarity verdicts:** Stored immutably; block verdicts prevent export
- **Audit trail:** All upload/export events logged for compliance review

---

## Sprint 1 Scope Change: Backend Focus (December 2024)

**Decision:** Defer frontend work to Sprint 2 to ensure solid backend foundation

**What Changed:**

- **Completed:** Backend workers (music, voice, mix, export) + integration tests (Tasks 1.1-1.5)
- **Deferred:** Frontend workspace UI, WebAudio, SSE client, E2E tests (Tasks 2.1-2.8)

**Why:**

1. Backend workers needed comprehensive testing before frontend integration
2. Integration tests revealed patterns that informed worker design
3. DevOps infrastructure (branching, CI/CD) established before multi-developer work
4. Avoided frontend rework from backend contract changes

**Impact on Sprint 2:**

- Sprint 2 now includes deferred Sprint 1 frontend work PLUS new section regeneration features
- Combined scope fits within 2-week sprint estimate
- Frontend benefits from stable, tested backend contracts

**Lessons Learned:**

- Separate backend/frontend into different sprints when possible
- Integration tests should come before frontend implementation
- Document scope changes immediately for project transparency

**See:** [SPRINT_1_SCOPE_CHANGE.md](SPRINT_1_SCOPE_CHANGE.md) for full rationale

---

## DevOps Infrastructure (December 2024)

**Branching Strategy:** Sprint-based GitFlow

- `main`: production releases (tagged v0.X.0)
- `develop`: sprint integration (auto-deploy to staging)
- `feature/f-X.Y-description`: feature branches
- `release/vX.Y.Z`: release stabilization

**CI/CD Pipeline:** GitHub Actions with tiered testing

- All branches: lint, typecheck, unit, integration, contract tests
- `develop`: + E2E tests + deploy staging
- `release/*`, `main`: + security scans + deploy production

**Versioning Strategy:**

- Each sprint = minor version (Sprint 0: v0.1.0, Sprint 1: v0.2.0, Sprint 2: v0.3.0)
- Hotfixes = patch version (v0.2.0 → v0.2.1)

**Deployment:**

- Staging: `develop` push → https://staging.bluebird.app
- Production: `main` push → https://bluebird.app

**Documentation:**

- [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)
- [CI_CD_GUIDE.md](CI_CD_GUIDE.md)
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

**Architectural Decision:**

- Chose GitFlow over trunk-based to match sprint cadence
- Each sprint ends with merge to `main` and version tag
- `develop` is always shippable (staging validates before production)

---

## Known Issues & Workarounds

### Issue Template

```markdown
**Title:** [Description]
**Status:** [Open / In Progress / Resolved]
**Sprint Identified:** [Sprint 0, 1, etc.]
**Workaround:** [If applicable]
**Resolution:** [Once fixed]
```

### Current Issues

**Title:** GitHub Actions Environments Not Created
**Status:** Open (documented)
**Sprint Identified:** DevOps Infrastructure (December 2024)
**Workaround:** Environment blocks commented out in `.github/workflows/ci.yml`
**Resolution:** Manually create staging/production environments in GitHub repo settings, then uncomment blocks

**Title:** E2E Tests Not Implemented
**Status:** Open (planned for Sprint 2)
**Sprint Identified:** Sprint 1
**Workaround:** Manual testing + integration tests cover backend workflows
**Resolution:** Playwright E2E suite in Sprint 2 (Task 2.8)

**Title:** Dockerfiles Missing
**Status:** Open (planned for Sprint 2)
**Sprint Identified:** DevOps Infrastructure
**Workaround:** Deployment jobs use placeholder echo commands
**Resolution:** Create Dockerfiles for apps/api and apps/web in Sprint 2

---

## Questions for Next Sprint Planning

- What worked well this sprint? (Patterns to keep)
- What slowed us down? (Processes to improve)
- Any TTFP P95 outliers? (Investigate + optimize)
- Reference implementation decisions needed?

---

**Last Updated:** 8 Dec 2025
**Owner:** Mike Blakeway
