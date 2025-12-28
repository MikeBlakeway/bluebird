# Bluebird — Agent Instructions

> Purpose: Make AI agents reliably produce code that fits Bluebird's contracts, performance targets, and safety posture.

---

## 0) Ground Truth & Boundaries

- **Original music only.** No celebrity voice cloning; do not propose timbre transfer from real artists.
- **Remix is vibe, not copy.** Always route reference audio (≤30s) through features (key/BPM/contour/rhythm) and enforce export gating.
- **Never invent endpoints or DTOs.** Use the types in `@bluebird/types` and the endpoint list in §3. If unsure, ask for the schema or create a failing TODO.

---

## 1) Monorepo & Repos

```bash
bluebird/
  apps/web            # Next.js (App Router)
  apps/api            # Fastify orchestrator + workers
  packages/types      # zod DTOs + OpenAPI snapshots
  packages/ui         # shared React (shadcn + Tailwind tokens)
  packages/config     # tsconfig/eslint/prettier/husky
  packages/telemetry  # OTEL init helpers (Node + browser)
  packages/client     # API client (OpenAPI or tRPC wrappers)
  packages/test-helpers # Playwright/Vitest/Testcontainers utils

bluebird-infer/       # Separate Python monorepo (Poetry)
  libs/bbcore         # audio io/s3/logging
  libs/bbfeatures     # pitch/IOI/DTW/interval n-grams
  pods/*              # analyzer, planner, melody, music, voice, similarity, mix, exporter
```

**Agent rule:** prefer generating code into these exact paths; do not create new packages unless asked.

---

## 2) Runtime, URLs, and ENV

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- SSE: `http://localhost:4000/jobs/:id/events`
- PG: `localhost:5432`; Redis: `localhost:6379`; MinIO: `http://localhost:9000`
- CDN stub: `http://localhost:8080`

**API env (.env):** `BLUEBIRD_PORT`, `BLUEBIRD_ENV`, `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET`, `CDN_BASE`, `JWT_SECRET`, `EMAIL_FROM`, `SMTP_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`

**Pod env:** `BB_S3_ENDPOINT`, `BB_S3_ACCESS_KEY`, `BB_S3_SECRET`, `BB_BUCKET`, `BB_OTEL_ENDPOINT`, `BB_LOG_LEVEL`

---

## 3) Canonical Endpoints (don't make up names)

```bash
POST /plan/song
POST /plan/arrangement   # alias
POST /plan/vocals        # alias
POST /remix/reference/upload
POST /remix/melody
POST /render/preview
POST /render/section
POST /check/similarity
POST /mix/final
POST /export
GET  /jobs/:jobId/events  # SSE
```

---

## 4) Core DTOs (from @bluebird/types)

- `ArrangementSpec`: BPM, key, sections, instrumentation, energy curve
- `VocalScore`: line→artist mapping + style notes
- `RemixFeatures`: key, BPM, interval/contour + rhythm features
- `SimilarityReport`: melody/rhythm scores + verdict (pass/borderline/block)
- `ExportBundle`: master + aligned stems + cue sheet (BWF markers); sample rate default 48 kHz/24‑bit, 44.1 kHz optional

**Agent rule:** always import these from `@bluebird/types`, not hand‑rolled.

---

## 5) Patterns Agents Should Prefer

### 5.0 Type Safety (Critical)

**Avoid type casts (`as Type`) in production code except where absolutely necessary.** Tests are exempt from this rule.

**Required patterns:**

- **External data (DB, API, files)**: Always validate with Zod schemas
- **Database JSON fields**: Never cast `Json?` types directly; use `safeParse()`
- **Route parameters**: Use Fastify type inference or validate with Zod; avoid `as { param: string }`
- **Queue job data**: Validate with Zod schemas before processing
- **Unknown types**: Use type guards or Zod validation; avoid asserting types

**Example (workers loading DB data):**

```typescript
// ❌ WRONG: Unsafe cast bypasses validation
const arrangement = take.plan as ArrangementSpec

// ✅ CORRECT: Runtime validation with descriptive errors
const parseResult = ArrangementSpecSchema.safeParse(take.plan)
if (!parseResult.success) {
  throw new Error(`Invalid arrangement plan: ${parseResult.error.message}`)
}
const arrangement = parseResult.data // Type-safe + validated
```

**Example (route parameters):**

```typescript
// ❌ WRONG: Assumes structure without validation
const params = request.params as { jobId: string }

// ✅ CORRECT: Honest about uncertainty, validate with Zod
const params = request.params as { jobId?: unknown }
const parsed = JobIdSchema.safeParse(params.jobId)
if (!parsed.success) {
  return reply.code(400).send({ error: 'Invalid job ID' })
}
const jobId = parsed.data
```

**When casts are acceptable:**

- `as const` for literal types (safe, no runtime risk)
- Test files (mocking, fixtures, test data)
- Type narrowing after explicit runtime checks
- Documented exceptions with clear safety justification

### 5.1 Fastify route template (with idempotency + zod)

- Include `Idempotency-Key` header check on **all POSTs**.
- Validate request/response using zod from `@bluebird/types`.
- Emit OpenTelemetry attributes: `runId`, `planId`, `sectionId`, `seed`.

### 5.2 SSE client template

- Use `EventSource` with heartbeat handling and exponential backoff.
- Update UI via a centralized job timeline store.

### 5.3 BullMQ queues naming & priority

- Queues: `plan`, `analyze`, `melody`, `synth`, `vocal`, `mix`, `check`, `export`.
- Priorities: `pro` > `standard`. Include DLQ and idempotency key in job opts.

### 5.4 S3 layout and presign

```bash
projects/{projectId}/takes/{takeId}/
  plan.json
  sections/{idx}/music/{stem}.wav
  sections/{idx}/vocals/{part}.wav
  mix/master.wav
  mix/master.mp3
  reports/similarity-{ts}.json
  reference/ref.wav (opt‑in)
  features/remix.json
```

### 5.5 Similarity pipeline hooks

- Always compute **interval n‑grams** (n=3..5) and **rhythmic IOI grid**.
- Verdict thresholds: pass < 0.35; borderline 0.35–0.48; block ≥ 0.48; apply hard rule on 8‑bar clones.

### 5.6 WebAudio local preview

- Build a graph with per‑track gain/mute; maintain a central transport; A/B compare without new GPU jobs.

---

## 6) Code Snippets (short, reusable)

**SSE client (web):**

```ts
const es = new EventSource(`${api}/jobs/${id}/events`)
es.onmessage = (e) => {
  const evt = JSON.parse(e.data) as JobEvent // from @bluebird/types
  timeline.update(evt)
}
es.onerror = () => {
  es.close()
  setTimeout(connect, backoff())
}
```

**Idempotent POST (client):**

```ts
await fetch(`${api}/render/section`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
  body: JSON.stringify(payload),
})
```

**BullMQ enqueue (priority + dedupe):**

```ts
queue.add('vocal', payload, {
  jobId: `${projectId}:${sectionId}:vocal:${seed}`,
  priority: isPro ? 10 : 1,
  removeOnComplete: true,
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
})
```

---

## 7) Testing Patterns

- **Unit (Node)**: Vitest; DTO schema tests; utility pure functions.
- **Contract**: OpenAPI snapshot in `packages/types`; CI fails on diff.
- **Integration**: Testcontainers (PG/Redis/MinIO) to run plan→preview slice and SSE.
- **E2E**: Playwright path: signup→lyrics→preview→regen→remix→export.
- **Audio**: Golden WAV fixtures; feature consistency (same seed → same features); ABX numeric thresholds for SRC/dither.
- **Python**: PyTest + Hypothesis for interval n‑grams and DTW; pytest‑benchmark on feature extraction.

---

## 8) Do/Don't for Agents

### Do

- Use DTO imports from `@bluebird/types`.
- Emit OTEL spans with run IDs.
- Enforce idempotency.
- Respect queue names + priorities.
- Use presigned S3 URLs.

### Don't

- Don't store raw reference audio by default; write `features/remix.json` instead.
- Don't suggest celebrity voices or timbre transfer.
- Don't block the UI during renders; subscribe to SSE instead.
- Don't generate endpoints or env names not listed here.

---

## 9) Glossary (quick)

- **AI Artist**: Licensed synthetic singing voice.
- **ArrangementSpec**: JSON plan for tempo/sections/instrumentation.
- **VocalScore**: Map of lyric lines to performers + style notes.
- **RemixFeatures**: key/BPM/contour/rhythm from ≤30s reference.
- **SimilarityReport**: export‑gating report with melody/rhythm scores.

---

## 10) Copy/Paste Tasks for Agent Chat

- "Generate a Fastify route for `POST /render/section` with zod validation and idempotency."
- "Write a BullMQ worker for the `vocal` queue with seed propagation and DLQ."
- "Create a WebAudio graph with per‑track gain and A/B compare."
- "Produce a PyTest for interval n‑gram Jaccard similarity and DTW rhythm score with golden fixtures."

---

## 11) Knowledge for Development

### Project Essence

**Bluebird is an AI music composition platform:** Users paste lyrics → select genre/AI vocalist → system generates original melody, harmony, arrangement → renders audio in <45s → user can regenerate sections, adjust mix, optionally guide vibe with ≤30s reference, export stems/master.

**Key insight:** Schema-driven planning (not one-shot). Every song goes through ArrangementSpec (BPM/key/structure/instruments) and VocalScore (line-to-artist mapping) before rendering. This enables control, reproducibility, and section-level regen without full re-composition.

### Critical Developer Context

**Why original-only?**

- Brand + legal safety: no master reuse, no near-copy melodies
- Similarity Budget guardrail: interval n-gram Jaccard + rhythmic DTW checks block exports if melody too close to reference
- Trust with users: "Remix the vibe, not the melody"

**Why separate Python repo?**

- CUDA/PyTorch version pinning isolated from Node toolchain
- Faster CI (no Node dependency on inference logic)
- Cleaner scaling: pods deployed as Docker services independent of Node API
- Each pod is a stateless FastAPI service; workers communicate via S3 keys + HTTP (no large audio payloads in-process)

**Why Remix matters for MVP:**

- Differentiator from prompt-only tools (which feel random)
- User intent captured in feature vectors (not raw audio): contour, rhythm, key, BPM
- Auto-generates new melody constrained by budget slider (Pro tier control; Free has safe defaults)

**Performance targets are hard gates:**

- TTFP ≤45s P50 determines perceived quality (faster=better UX)
- Per-section regen ≤20s enables iterative workflows
- GPU cost budget ≤$0.40 per 30s preview drives profitability

**Export gating is trust:**

- Similarity report shows exactly why block/pass/borderline
- Recommendations are actionable (shift key +1, regen chorus topline)
- Users never accidentally export a copyright-risky composition

### Common Implementation Pitfalls

1. **Avoid:** Regenerating full song for one section → always use per-section job isolation
2. **Avoid:** Storing raw reference audio by default → store features; raw only if user opts in
3. **Avoid:** Skipping seeds → every pod call must accept deterministic seed; same inputs + seed = identical outputs
4. **Avoid:** Offline similarity checking → must be gated at export time; user might tweak after reference, score changes
5. **Avoid:** Pushing observable delays to frontend → use SSE for realtime job stage updates; disable controls only when necessary

### When You're Stuck

- **DTO questions?** Check `packages/types` (Zod schemas are source of truth)
- **API contract unclear?** Look at `Method.md` (endpoint specs + request/response examples)
- **Performance budget?** See `docs/project/requirements/Non-Functional-Requirements.md` (SLOs, cost, resource constraints)
- **Feature scope?** Consult `FEATURES.MD` (F-IDs with acceptance criteria)
- **Testing patterns?** Review this AGENTS.MD §7) Testing Patterns (Node/Python specifics)

---

## 12) Development Memory & Context Tracking

**Purpose:** Track how the application evolves—architectural decisions, completed work, patterns established, and lessons learned. This knowledge is as important as understanding the spec.

### What to Record (after each sprint or major milestone)

- **Completed work**: Features shipped, endpoints implemented, pods integrated, tests added

- **Architectural decisions made**: Why we chose a specific pattern, routing strategy, or library
- **Development patterns established**: How we actually build queue workers, routes, tests—not just guidelines
- **Lessons learned**: Performance bottlenecks discovered, bugs fixed, gotchas encountered
- **Integration points created**: How pods interact with API, how frontend talks to SSE, caching strategies used
- **Performance/cost data**: Actual TTFP measurements, GPU minutes per job, cache hit rates
- **Tech decisions**: Why we picked specific versions, workarounds for edge cases, dependency conflicts resolved

### Where to Record

- **`docs/development/DEVELOPMENT_LOG.md`**: Sprint-by-sprint record of what was built and how

- **Inline code comments**: `// NOTE: We tried X but Y worked better because...` for non-obvious patterns
- **ADR (Architecture Decision Records)**: `docs/project/adr/ADR-NNN-{title}.md` for significant choices (routing, similarity algorithm, state management)
- **This file (AGENTS.MD)**: Update §11 (Knowledge for Development) with patterns that worked, anti-patterns to avoid

### Memory Update Cadence

- **After Sprint 0**: Record monorepo setup, auth implementation, queue architecture choices

- **After Sprint 1**: Record preview path implementation, SSE integration, WebAudio local preview patterns
- **After each subsequent sprint**: Update with features shipped, integration learnings, performance observations
- **When adding features**: Document the integration point (e.g., "How we added Remix reference upload")
- **When hitting issues**: Record the problem, solution, and why (prevents re-solving the same issue)

### Example Development Memory Entries

```markdown
## Sprint 0: Foundation & Auth

- Chose Prisma ORM for schema clarity + migrations; migrations live in apps/api/prisma/migrations/
- Magic-link auth via SMTP (local console for dev); JWT stored in httpOnly cookie
- BullMQ worker boots in separate process; listens to Redis on REDIS_URL
- Learned: Must include Idempotency-Key in all POST requests; prevents duplicate charges and ensures exactly-once semantics

## Sprint 1: Preview Path

- Music/Voice synth stubs emit click patterns + sine tones aligned to lyrics syllables
- SSE heartbeat every 15s; reconnect with exp backoff (500ms → 8s max)
- WebAudio transport clock synced to buffer position; pre-roll 512 samples to avoid clicks
- Performance: TTFP baseline is 12s (planner) + 20s (music) + 8s (voice) + 2s (mix) = 42s (local, under budget)
- Caching: stems by seed reduces re-renders; cache TTL 24h in MinIO lifecycle policy

## Similarity Engine Integration (Sprint 5)

- Reference feature extraction: HPSS (librosa) + pitch/IOI extraction; 3-5 sec CPU time for 30s audio
- Interval n-gram Jaccard: compare melody contours; DTW for rhythm; combined score drives verdict
- Hard rule: 8-bar+ near-identical melodies always block (even if score < 0.48)
- Learned: Must extract features BEFORE melody generation, not after; order matters for budget control
```

### Anti-Patterns to Record (prevent repetition)

- **Regenerating full songs for one section** → costs 2–3x GPU, kills budget

- **Storing raw reference audio** → GDPR risk; features are sufficient
- **Offline similarity checking** → users tweak after checking; verdict must be at export time
- **Not seeding pod calls** → breaks reproducibility; causes debugging nightmares

### Questions Agents Should Ask

When picking up work:

1. What was the last completed sprint? What are we shipping this sprint?
2. What architectural patterns did we establish? (e.g., "How do we structure queue workers?")
3. What integrations already exist? (e.g., "Is SSE connected to the planner queue?")
4. What performance baseline did we establish? (e.g., "TTFP target: 45s P50; current: 42s")
5. What lessons did we learn the hard way? (e.g., "Deterministic seeds are non-negotiable")

---

## 13) Git Workflow & Branching Strategy

**CRITICAL**: Follow the sprint-based branching workflow documented in [docs/development/BRANCHING_STRATEGY.md](docs/development/BRANCHING_STRATEGY.md).

### Quick Rules for AI Agents

**Creating Branches**

- ALWAYS base feature branches on `develop` (not `main`)
- Use naming: `feature/f-X.Y-description` (e.g., `feature/f-1.1-music-worker`)
- Use naming: `bugfix/123-description` for bug fixes
- Use naming: `hotfix/vX.Y.Z-description` for production bugs (base on `main`)

**Creating Pull Requests**

- Target `develop` for features and bugfixes
- Target `main` ONLY for releases and hotfixes
- Use conventional commit format in PR title (`feat(scope): description`)
- Link to sprint tasks or feature IDs in description

**Merging Code**

- NEVER commit directly to `main` or `develop`
- ALWAYS create PR even for small changes
- Wait for CI to pass before merging
- Delete feature branches after merge

**Sprint Workflow**

- Sprint start: Create feature branches from latest `develop`
- During sprint: Merge completed features to `develop` via PR
- Sprint end: Create `release/vX.Y.Z` from `develop`
- After release: Merge release to `main`, tag, merge back to `develop`

**Version Strategy**

- Each sprint = minor version bump (v0.1.0 → v0.2.0)
- Hotfixes = patch version bump (v0.2.0 → v0.2.1)
- Sprint 0: v0.1.0, Sprint 1: v0.2.0, Sprint 2: v0.3.0, etc.

**CI/CD Integration**

- `develop` deploys to staging environment
- `main` deploys to production environment
- All PRs must pass: unit tests, integration tests, linting, type checks
- Release branches also run: E2E tests, performance tests, security scans

**Reference**: See [BRANCHING_STRATEGY.md](docs/development/BRANCHING_STRATEGY.md) for full workflow, commands, and decision trees.

---

## 14) Documentation & Knowledge Base

### Project Documentation

**Essential References** (consult for context and decisions):

1. **Project Vision & Scope**
   - [VISION.md](docs/project/VISION.md) - Product vision, brand, strategic goals
   - [OVERVIEW.md](docs/project/OVERVIEW.md) - High-level system architecture
   - [FEATURES.MD](docs/project/FEATURES.MD) - Feature list with F-IDs and acceptance criteria

2. **Requirements & Specifications**
   - [requirements/Method.md](docs/project/requirements/Method.md) - API endpoints, request/response specs
   - [requirements/Non-Functional-Requirements.md](docs/project/requirements/Non-Functional-Requirements.md) - SLOs, performance targets, cost budgets
   - [requirements/UI-Requirements.md](docs/project/requirements/UI-Requirements.md) - UI/UX specifications, component library
   - [requirements/Scope.md](docs/project/requirements/Scope.md) - What's in/out for MVP

3. **Sprint Planning & Progress**
   - [sprints/sprint_plan_s_0_s_1.md](docs/project/sprints/sprint_plan_s_0_s_1.md) - Sprint 0–1 goals and tasks
   - [development/SPRINT_STATUS.md](docs/development/SPRINT_STATUS.md) - Current sprint progress (15/15 tasks = 100%)
   - [development/DEVELOPMENT_LOG.md](docs/development/DEVELOPMENT_LOG.md) - Sprint-by-sprint record of completed work

### Development Guides

**Essential for Implementation**:

1. **Type Safety & Code Quality**
   - [development/TYPE_SAFETY_AUDIT.md](docs/development/TYPE_SAFETY_AUDIT.md) - Type safety review and rules
   - [development/TYPE_COERCION_AUDIT.md](docs/development/TYPE_COERCION_AUDIT.md) - Audit of unsafe type coercions (all justified)
   - § 5.0 (above) covers type safety in detail

2. **Git Workflow & Branching**
   - [development/BRANCHING_STRATEGY.md](docs/development/BRANCHING_STRATEGY.md) - Sprint-based git workflow, release process, commands
   - § 13 (above) references this for branch naming and workflow

3. **Performance & Optimization**
   - [development/PERFORMANCE_REPORT.md](docs/development/PERFORMANCE_REPORT.md) - Sprint 2 performance validation (TTFP 42s, all targets met)
   - [development/TTFP_BASELINE.md](docs/development/TTFP_BASELINE.md) - TTFP measurement methodology and baseline

4. **Testing & Quality**
   - [apps/api/TESTING.md](apps/api/TESTING.md) - Test patterns and strategies (API-specific)
   - § 7 (Testing Patterns above) covers unit/integration/E2E/audio testing

5. **Frontend Best Practices**
   - [development/NEXTJS_BEST_PRACTICES.md](docs/development/NEXTJS_BEST_PRACTICES.md) - Next.js App Router patterns, SSR/SSG decisions
   - [development/NEXTUI_MIGRATION.md](docs/development/NEXTUI_MIGRATION.md) - HeroUI component library setup and usage

6. **Configuration & Setup**
   - [development/ESLINT_PRETTIER.md](docs/development/ESLINT_PRETTIER.md) - Linting and formatting configuration
   - [development/TYPESCRIPT_SETUP.md](docs/development/TYPESCRIPT_SETUP.md) - TypeScript strict mode, tsconfig
   - [development/CI_CD_GUIDE.md](docs/development/CI_CD_GUIDE.md) - GitHub Actions, CI/CD pipeline setup

7. **Deployment & Operations**
   - [development/DEPLOYMENT_CHECKLIST.md](docs/development/DEPLOYMENT_CHECKLIST.md) - Pre-release checklist and verification steps
   - [ops/backup-and-restore.md](docs/ops/backup-and-restore.md) - Database backup and recovery procedures

### Release Documentation

**For Release Planning**:

- [releases/v0.2.0.md](docs/releases/v0.2.0.md) - Sprint 1 release notes (preview vertical slice)
- [releases/v0.3.0.md](docs/releases/v0.3.0.md) - Sprint 2 release notes (remix, similarity, keyboard shortcuts)

### When to Consult Documentation

**Use these reference materials when:**

- **Designing new endpoints**: Check [Method.md](docs/project/requirements/Method.md) for existing endpoint patterns
- **Setting performance budgets**: Consult [Non-Functional-Requirements.md](docs/project/requirements/Non-Functional-Requirements.md) and [PERFORMANCE_REPORT.md](docs/development/PERFORMANCE_REPORT.md)
- **Making architectural decisions**: Review [OVERVIEW.md](docs/project/OVERVIEW.md) and [BRANCHING_STRATEGY.md](docs/development/BRANCHING_STRATEGY.md)
- **Creating new tests**: Reference [apps/api/TESTING.md](apps/api/TESTING.md) and § 7 above
- **Deploying to production**: Use [DEPLOYMENT_CHECKLIST.md](docs/development/DEPLOYMENT_CHECKLIST.md)
- **Cutting a release**: Follow [BRANCHING_STRATEGY.md](docs/development/BRANCHING_STRATEGY.md) § Release Workflow

---

## 15) Status

- **Current Sprint:** Sprint 2 Complete (15/15 tasks)
- **Current Version:** v0.3.0 (ready to release to main)
- **Next Sprint:** Sprint 3 (real model integration, advanced features)
- **Development memory:** See [DEVELOPMENT_LOG.md](docs/development/DEVELOPMENT_LOG.md) for sprint-by-sprint record
