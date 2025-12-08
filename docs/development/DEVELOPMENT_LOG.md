# Bluebird Development Log

**Purpose:** Track architectural decisions, completed work, lessons learned, and integration patterns. Updated after each sprint or major milestone.

---

## Sprint 0: Foundation & Auth (Planned: Dec 26 – Jan 6)

**Goal:** Stand up monorepo, local stack, auth, planning endpoints, SSE hello-world.

**Completed Work:**

- [ ] Monorepo scaffold (pnpm workspaces: apps/web, apps/api, packages/*)
- [ ] Docker Compose stack (Postgres, Redis, MinIO, Grafana, Prometheus)
- [ ] Prisma schema & migrations (users, projects, jobs, takes, sections, artifacts)
- [ ] CI/CD setup (ESLint, TypeScript strict, contract tests, unit tests)
- [ ] Magic-link auth (SMTP local console for dev; JWT httpOnly cookie)
- [ ] Analyzer pod stub (lyrics parse, reference analysis placeholder)
- [ ] Planner pod stub (structure/BPM/key heuristics v0)
- [ ] Orchestrator endpoints (`/plan/song`, `/plan/arrangement`, `/plan/vocals`)
- [ ] BullMQ queues (plan, analyze queues; priority lanes; DLQ)
- [ ] SSE server (`/jobs/:id/events`; heartbeat; reconnect)
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

**Lessons Learned:**

- **Must commit:** Idempotency keys are non-negotiable for cost control; prevents duplicate GPU charges
- **S3 artifacts:** Store JSON reports (plan.json, features.json) + WAV stems; presign URLs short TTL (15 min)
- **Queue naming:** Include scope (projectId) in jobId to enable per-project isolation + dead-letter analysis
- **SSE heartbeats:** Missing heartbeats caused client reconnection storms; 15s interval + server keep-alive prevents flapping

**Anti-Patterns Avoided:**

- ❌ Avoided: Large payloads in queue jobs; use S3 keys instead
- ❌ Avoided: Shared database for job state + artifacts; separate concerns (PG for metadata, S3 for media)
- ❌ Avoided: No seed tracking; added seed to every job for reproducibility

**Outstanding Questions:**

- Prisma scaling: When does generated query complexity become a bottleneck? Plan cache strategy?
- SSE tail latency: P95 with slow network clients? Implement streaming response gzip?

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
