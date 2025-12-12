# Bluebird — Copilot Agent Instructions (Patched v0.2)

> Purpose: Make Copilot and inline codegen reliably produce code that fits Bluebird’s contracts, performance targets, and safety posture. This file is optimized for GitHub Copilot Chat + inline completions.

---

## 0) Ground Truth & Boundaries

- **Original music only.** No celebrity voice cloning; do not propose timbre transfer from real artists.
- **Remix is vibe, not copy.** Always route reference audio (≤30s) through features (key/BPM/contour/rhythm) and enforce export gating.
- **Never invent endpoints or DTOs.** Use the types in `@bluebird/types` and the endpoint list in §3. If unsure, ask for the schema or create a failing TODO.

---

## 1) Monorepo & Repos

```
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

**Copilot rule:** prefer generating code into these exact paths; do not create new packages unless asked.

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

## 3) Canonical Endpoints (don’t make up names)

```
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

**Copilot rule:** always import these from `@bluebird/types`, not hand‑rolled.

---

## 5) Patterns Copilot Should Prefer

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

```
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

## 8) Do/Don’t for Copilot

**Do**

- Use DTO imports from `@bluebird/types`.
- Emit OTEL spans with run IDs.
- Enforce idempotency.
- Respect queue names + priorities.
- Use presigned S3 URLs.

**Don’t**

- Don’t store raw reference audio by default; write `features/remix.json` instead.
- Don’t suggest celebrity voices or timbre transfer.
- Don’t block the UI during renders; subscribe to SSE instead.
- Don’t generate endpoints or env names not listed here.

---

## 9) Glossary (quick)

- **AI Artist**: Licensed synthetic singing voice.
- **ArrangementSpec**: JSON plan for tempo/sections/instrumentation.
- **VocalScore**: Map of lyric lines to performers + style notes.
- **RemixFeatures**: key/BPM/contour/rhythm from ≤30s reference.
- **SimilarityReport**: export‑gating report with melody/rhythm scores.

---

## 10) Copy/Paste Tasks for Copilot Chat

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
- **Testing patterns?** Review this copilot-instructions.md §Testing Strategy (Node/Python specifics)

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
- **This file (copilot-instructions.md)**: Update §11 (Knowledge for Development) with patterns that worked, anti-patterns to avoid

### Memory Update Cadence

- **After Sprint 0**: Record monorepo setup, auth implementation, queue architecture choices
- **After Sprint 1**: Record preview path implementation, SSE integration, WebAudio local preview patterns
- **After each subsequent sprint**: Update with features shipped, integration learnings, performance observations
- **When adding features**: Document the integration point (e.g., "How we added Remix reference upload")
- **When hitting issues**: Record the problem, solution, and why (prevents re-solving the same issue)

### Example Development Memory Entries

```
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

### Questions AI Agents Should Ask

When picking up work:

1. What was the last completed sprint? What are we shipping this sprint?
2. What architectural patterns did we establish? (e.g., "How do we structure queue workers?")
3. What integrations already exist? (e.g., "Is SSE connected to the planner queue?")
4. What performance baseline did we establish? (e.g., "TTFP target: 45s P50; current: 42s")
5. What lessons did we learn the hard way? (e.g., "Deterministic seeds are non-negotiable")

---

## 13) Commit Message Standards

### Critical Rules (MUST FOLLOW)

1. **PLAIN TEXT ONLY** - Never use Markdown formatting (##, ###, **, *, etc.)
2. **Conventional Commits** - Use format: `type(scope): subject`
3. **Line length limits** - Subject: 50 chars; body: 72 chars per line
4. **Imperative mood** - "Add feature" not "Added feature" or "Adds feature"

### Why Plain Text?

Git commit messages are displayed in `git log`, GitHub, and other tools as **plain text**. Markdown formatting (##, ###, **bold**, *italic*) is not rendered and appears as literal text, making commits harder to read.

**WRONG (Markdown):**
```
## Music Worker Implementation
### Architecture
- BullMQ worker processing jobs
```

**Displays in git log as:**
```
## Music Worker Implementation
### Architecture
- BullMQ worker processing jobs
```

**CORRECT (Plain Text):**
```
MUSIC WORKER IMPLEMENTATION

Architecture
  - BullMQ worker processing jobs
```

### Commit Message Structure

```
type(scope): brief subject line (50 chars max)

Brief overview paragraph explaining the what and why.

SECTION TITLE (ALL CAPS)

Content organized with indentation for hierarchy:
  - Use 2-space indentation for nested items
  - Use blank lines to separate sections
  - Use dashes or numbers for lists

Another Section

More details here. Keep lines to 72 characters maximum for
readability in terminal displays.

Quality Metrics

✅ Tests: N/N passing
✅ Coverage: X% (threshold: Y%)
✅ TypeScript: 0 errors
✅ ESLint: 0 errors

Next Steps

Brief note about what comes next (optional).
```

### Conventional Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Adding or updating tests
- `refactor:` - Code restructuring (no functionality change)
- `perf:` - Performance improvement
- `chore:` - Maintenance (dependencies, config, etc.)
- `ci:` - CI/CD changes
- `style:` - Code formatting (not CSS styling)

### Example Commit Messages

**Example 1: Feature Implementation**
```
feat(api): implement music synthesis worker (Sprint 1 Task 1.1)

Complete music synthesis worker for rendering audio stems with S3 storage
integration and test coverage improvements.

MUSIC SYNTHESIS WORKER

Architecture
  - BullMQ worker for music synthesis jobs (music-worker.ts)
  - Process jobs from 'synth' queue with concurrency: 2 jobs
  - Rate limiter: 10 jobs per 60 seconds

Workflow
  1. Fetch arrangement plan from database
  2. Generate audio buffer using synthesizeMusic()
  3. Encode to WAV format (48kHz/24-bit)
  4. Upload to S3 with structured paths
  5. Emit SSE progress events (music-render stage)
  6. Update Take record on completion

S3 STORAGE INTEGRATION

Implementation
  - S3 client wrapper for MinIO/S3 (s3.ts)
  - Functions: uploadToS3(), downloadFromS3(), getPresignedUrl()
  - JSON helpers: uploadJsonToS3(), downloadJsonFromS3()
  - Path structure: projects/{projectId}/takes/{takeId}/sections/...

TEST COVERAGE

Added Tests
  - 12 S3 utility tests (path generation, JSON ops, validation)
  - 5 music worker structure tests (exports, config, queue setup)
  - Total: 95 tests (up from 78)
  - Coverage: 60.0% (meets minimum 60% threshold)

Quality Metrics

✅ Tests: 95/95 passing
✅ TypeScript: 0 errors
✅ ESLint: 0 errors
✅ Coverage: 60.0% (threshold: 60%)
```

**Example 2: Bug Fix**
```
fix(api): resolve Redis quit() type mismatch in queue cleanup

Redis quit() returns Promise<"OK"> not Promise<void>, causing TypeScript
compilation errors in queue.ts and worker.ts.

PROBLEM

  - closePromises.push(redisConnection.quit())
  - TypeScript error: Promise<"OK"> not assignable to Promise<void>

SOLUTION

  - Add .then(() => {}) to convert return type
  - Pattern: closePromises.push(redisConnection.quit().then(() => {}))

FILES CHANGED

  - apps/api/src/lib/queue.ts (Redis cleanup)
  - apps/api/src/lib/worker.ts (Redis cleanup)

✅ TypeScript: 0 errors
✅ Tests: All passing
```

**Example 3: Documentation**
```
docs: add commit message standards to copilot-instructions

Add comprehensive commit message guidelines to ensure consistent and
readable git history across the project.

GUIDELINES ADDED

Format Requirements
  - PLAIN TEXT only (no Markdown formatting)
  - Conventional commit format (type(scope): subject)
  - Line length limits (50 char subject, 72 char body)
  - Imperative mood for subject lines

Why Plain Text
  - Markdown doesn't render in git log/GitHub commits
  - Ensures readability in all git tools
  - Consistent formatting across team

LOCATION

  - .github/copilot-instructions.md § 13) Commit Message Standards
```

### Checklist Before Committing

- [ ] Subject line uses conventional commit format: `type(scope): subject`
- [ ] Subject line is ≤50 characters
- [ ] Subject line uses imperative mood ("Add" not "Added")
- [ ] Body lines are ≤72 characters (wrap long lines)
- [ ] **NO MARKDOWN FORMATTING** (no ##, ###, **, *, etc.)
- [ ] Use plain text with spacing and indentation for structure
- [ ] Sections use ALL CAPS titles (not markdown headers)
- [ ] Lists use dashes (-) or numbers, indented with 2 spaces
- [ ] Quality metrics included (tests, coverage, errors)
- [ ] Files changed listed (for larger commits)
- [ ] Next steps mentioned (if applicable)

### Common Mistakes to Avoid

❌ Using markdown headers: `## Section`, `### Subsection`
✅ Use plain text with spacing: `SECTION` (all caps), then indented content

❌ Using markdown bold/italic: `**important**`, `*note*`
✅ Use capitalization or indentation for emphasis

❌ Long subject lines: `feat: implement the new music synthesis worker with BullMQ and S3 integration`
✅ Keep concise: `feat(api): implement music synthesis worker`

❌ Past tense: `Added music worker`
✅ Imperative: `Add music worker`

❌ Vague commits: `fix: bug fix`, `chore: update stuff`
✅ Specific: `fix(api): resolve Redis type mismatch in queue cleanup`

---

## 14) Status

- Pre‑implementation; use stubs for Music/Voice until real models are integrated.
- Development memory begins in Sprint 0.
