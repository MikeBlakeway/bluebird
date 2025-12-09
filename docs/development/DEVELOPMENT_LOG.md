# Bluebird Development Log

**Purpose:** Track architectural decisions, completed work, lessons learned, and integration patterns. Updated after each sprint or major milestone.

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
- [ ] CLI `bluebird plan` command

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

**Outstanding Questions:**

- Prisma scaling: When does generated query complexity become a bottleneck? Plan cache strategy?
- SSE tail latency: P95 with slow network clients? Implement streaming response gzip?
- Event retention: Should we persist events to DB for audit trail or rely on ephemeral Redis pub/sub?
- Rate limiting: How to prevent SSE connection spam (e.g., malicious reconnect loops)?

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

## Known Issues & Workarounds

### Issue Template

```markdown
**Title:** [Description]
**Status:** [Open / In Progress / Resolved]
**Sprint Identified:** [Sprint 0, 1, etc.]
**Workaround:** [If applicable]
**Resolution:** [Once fixed]
```

(Add discovered issues here)

---

## Questions for Next Sprint Planning

- What worked well this sprint? (Patterns to keep)
- What slowed us down? (Processes to improve)
- Any TTFP P95 outliers? (Investigate + optimize)
- Reference implementation decisions needed?

---

**Last Updated:** 8 Dec 2025
**Owner:** Mike Blakeway
