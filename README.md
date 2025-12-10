# Bluebird

**AI-powered music creation platform.** Turn any lyrics into a fully original, studio-quality song performed by bespoke AI vocalists—optionally guided by a short Remix reference.

## One-Liner

Bluebird turns any set of lyrics into a fully‑original, studio‑quality song performed by bespoke AI vocalists—optionally guided by a short Remix reference that keeps the composition original and export‑safe.

## The Problem

- Creation bottlenecks: Lyrics without melody/arrangement stall.
- Access & cost: Hiring vocalists, players, and engineers is slow and expensive.
- Tool gap: Prompt-only music tools feel random; DAWs are heavy.
- Legal risk: Straight remixes, cloned voices, or copied melodies are fragile.

## The Solution

**Original composition engine** from text to new melody/harmony/structure (no reuse of masters or exact tunes).

**Remix (similarity-guarded):** Optional reference (≤30s) → contour/rhythm guidance → transformed, export-safe topline with an adjustable Similarity Budget.

**House voices:** Curated roster of licensed, bespoke AI artists (no celebrity cloning) with duet/group capability.

**Directed generation:** Clear controls for genre, BPM, song sections, instrumentation, groove/swing, harmonies, and mix.

**Pro-ready output:** Stereo master + per-stem WAV for DAW workflows + export gating for safety.

## Key Features (MVP)

- **Lyrics Editor:** Paste lyrics, tag sections, word/line counts.
- **Genre & Structure:** Presets per genre; manual structure editor (intro/verse/chorus/bridge/outro).
- **AI Artist Roster:** 3–5 curated voices with audition previews.
- **Arrangement Planner:** Lyrics + structure + genre → BPM/key/instrumentation via schema-driven planning.
- **Per-Section Generation:** Music stems (drums, bass, keys) + lead vocals; regenerate individual sections fast (<20s).
- **Mixer:** Per-track gain/mute/pan; 3–4 era presets (50s tape, modern pop, lo-fi); loudness normalization (-14 LUFS).
- **Remix Reference (≤30s):** Attach reference to guide contour/rhythm; export gated by similarity checks.
- **Similarity Checker:** Melody (interval n-grams) + rhythm (DTW) scoring; pass/borderline/block verdict with actionable recommendations.
- **Export:** Master (WAV 48kHz/24-bit or MP3 320kbps) + aligned stems with BWF markers.
- **Job Timeline:** Realtime progress via SSE (Server-Sent Events); download artifacts/reports.

## Architecture

```bash
Next.js Frontend  →  Fastify API (Orchestrator)  →  Redis/BullMQ Queues  →  Python Inference Pods
                            ↓                              ↓
                    PostgreSQL (Prisma)           Object Storage (S3/MinIO)
```

### Tech Stack (Planned)

#### Frontend

- Next.js (App Router), React 19, TypeScript (strict), Tailwind CSS, shadcn components

#### Backend

- Node.js LTS, Fastify, Zod DTOs, Prisma ORM
- BullMQ + Redis (named queues with priority lanes: pro > standard)
- PostgreSQL for metadata; S3-compatible storage for artifacts

#### Inference

- Separate Python monorepo (`bluebird-infer`) with Poetry workspaces
- FastAPI pods: Analyzer, Planner, Melody, Music, Voice, Similarity, Mix, Exporter
- Python libraries: librosa (audio), scipy (signal processing), Hypothesis (testing)

#### Observability

- OpenTelemetry traces (API/workers/pods); Prometheus metrics; structured logging
- Grafana dashboard for TTFP, GPU usage, cache hits, similarity verdicts

## Project Structure

```bash
bluebird/
├── .github/
│   ├── copilot-instructions.md     # AI agent guidance
│   └── AGENTS.MD                   # (mirror of copilot-instructions)
├── docs/
│   ├── project/
│   │   ├── OVERVIEW.MD             # Product overview & system design
│   │   ├── VISION.md               # Product vision & strategy
│   │   ├── FEATURES.MD             # Feature specs (F-IDs, acceptance criteria)
│   │   ├── requirements/           # Detailed requirements & method
│   │   │   ├── Scope.md
│   │   │   ├── Method.md           # System architecture, data contracts, algorithms
│   │   │   ├── Implementation.md   # Implementation plan (Epics → Stories → Tasks)
│   │   │   ├── Non-Functional-Requirements.md  # SLOs, security, observability
│   │   │   └── UI-Requirements.md
│   │   ├── sprints/
│   │   │   └── sprint_plan_s_0_s_1.md  # Sprint 0–1 detailed plan
│   │   └── adr/                    # Architecture Decision Records (future)
│   └── development/
│       └── DEVELOPMENT_LOG.md      # (created during Sprint 0)

bluebird-infer/                     # (separate Python monorepo)
├── libs/
│   ├── bbcore/                     # Audio I/O, S3, logging
│   └── bbfeatures/                 # Pitch, IOI, DTW, interval n-grams
├── pods/
│   ├── analyzer/
│   ├── planner/
│   ├── melody/
│   ├── music/
│   ├── voice/
│   ├── similarity/
│   ├── mix/
│   └── exporter/
└── docker/                         # Base images (CPU, CUDA 12.x)
```

## Getting Started (Sprint 0)

### Prerequisites

- Node.js 18+ (LTS)
- Python 3.10+ (for pods)
- Docker & Docker Compose
- pnpm (or npm)

### Local Development Setup

```bash
# 1. Clone both repos
git clone https://github.com/yourorg/bluebird.git
git clone https://github.com/yourorg/bluebird-infer.git

# 2. Install Node dependencies
cd bluebird
pnpm install

# 3. Set up environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Start local stack
docker compose up -d

# 5. Run migrations
npx prisma migrate dev

# 6. Start dev servers
pnpm -w dev
```

### Local URLs

- **Web**: <http://localhost:3000>
- **API**: <http://localhost:4000>
- **SSE**: <http://localhost:4000/jobs/:id/events>
- **Postgres**: localhost:5432
- **Redis**: localhost:6379
- **MinIO S3**: <http://localhost:9000> (Console: <http://localhost:9001>)
- **Grafana**: <http://localhost:3001> (Prometheus: <http://localhost:9090>)

## Development Commands

```bash
# Frontend
pnpm -F web dev

# Backend API
pnpm -F api dev

# Both
pnpm -w dev

# Database
npx prisma migrate dev    # Run pending migrations
npx prisma studio         # Open Prisma UI

# CLI
bluebird plan --lyrics="..." --genre=trap
bluebird preview --planId=<uuid>
bluebird export --planId=<uuid> --stems
```

## Testing

```bash
# Node unit tests
pnpm test

# Contract tests (OpenAPI snapshot validation)
pnpm -F api test:contract

# Integration tests (Testcontainers)
pnpm test:integration

# E2E (Playwright)
pnpm test:e2e

# Python unit + golden tests
cd ../bluebird-infer
poetry run pytest
```

## Key Data Contracts

All type definitions live in `packages/types` (Zod schemas):

- **ArrangementSpec**: BPM, key, sections, instrumentation, energy curve
- **VocalScore**: Line-to-artist mapping + style notes
- **RemixFeatures**: Contour/rhythm/key extracted from reference
- **SimilarityReport**: Melody + rhythm scores; pass/borderline/block verdict
- **ExportBundle**: Master + stems + BWF markers; sample rates (default 48kHz/24-bit)

## Core API Endpoints

```bash
POST /plan/song                    # Generate arrangement from lyrics + genre
POST /remix/reference/upload       # Upload ≤30s reference for remix guidance
POST /render/preview               # Render 30s preview (SSE stream: /jobs/:id/events)
POST /render/section               # Fast regen single section
POST /check/similarity             # Compute melody/rhythm scores + export verdict
POST /mix/final                    # Sum stems, apply era preset, normalize loudness
POST /export                       # Package stems + master; verify similarity verdict
GET  /jobs/:jobId/events           # Server-Sent Events job progress stream
```

## Performance Targets (SLOs)

- **First 30s preview**: ≤45s P50 (P95 ≤2×)
- **Per-section regen**: ≤20s P50
- **Full 3-min song**: ≤8 min P50
- **GPU cost**: ≤$0.40 per 30s preview, ≤$2.50 per 3-min render
- **Concurrency**: 50 jobs at launch; target 200 with scaling

## Safety & Compliance

- **Original composition only:** No master reuse; all generated melodies are new.
- **No celebrity cloning:** Only in-house licensed AI artists.
- **Similarity-guarded Remix:** Interval n-grams + rhythmic DTW checks prevent near-copy exports.
- **Export gating:** Similarity verdicts block unsafe exports; actionable recommendations shown.
- **Reference privacy:** Feature vectors stored by default; raw audio only if user opts in.
- **Idempotency:** All POSTs require `Idempotency-Key` header for exactly-once semantics.
- **Content policy:** Profanity filter; disallow hateful/illegal content; rate-limit abuse.
- **Data retention:** Default 30 days; user-deletable; no training on user media.

## Development Philosophy

**Schema-driven planning (not one-shot):** Every song goes through `ArrangementSpec` (BPM/key/structure/instruments) and `VocalScore` (line-to-artist mapping) before rendering. This enables control, reproducibility, and section-level regen without full re-composition.

**Deterministic generation:** Every pod call accepts a seed; same seed + inputs = identical outputs. Ensures reproducibility and enables caching.

**Per-section isolation:** Regenerate individual sections in <20s without re-rendering the full song. Cost control + iterative UX.

**Observable from day 1:** OpenTelemetry traces, structured logs, job artifacts in S3. Every request is reproducible and auditable.

## Agent & Developer Guidance

- **AI Agent Instructions:** See `.github/copilot-instructions.md` and `AGENTS.MD`
- **Development Memory:** After each sprint, update this README and `docs/development/DEVELOPMENT_LOG.md` with completed work, architectural decisions, and lessons learned.
- **When Stuck:** Consult `docs/project/requirements/Method.md` (API contracts), `FEATURES.MD` (scope), or `Non-Functional-Requirements.md` (SLOs/cost).

## Sprint Plan

- **Sprint 0** (Foundation): Monorepo, auth, planning endpoints, SSE, queue setup. _Deliverable:_ `bluebird plan` CLI returns planId.
- **Sprint 1** (Preview): Music/Voice stubs, Next.js workspace UI, WebAudio mixer, export. _Deliverable:_ TTFP ≤45s; user → lyrics → preview.
- **Sprint 2–6** (Vertical slices): Section regen, Remix + similarity gate, stems/export, CDN, observability, CLI/extension.

See `docs/project/sprints/sprint_plan_s_0_s_1.md` for detailed breakdown.

## Status

**Pre-implementation.** Specs and requirements finalized; Sprint 0 planning complete. Ready to scaffold monorepo and local stack.

- Owner: Mike Blakeway
- Version: 0.2 (Aligned)
- Last Updated: 8 Dec 2025

## Contributing

1. Read `AGENTS.MD` for coding conventions and patterns.
2. Check `docs/project/FEATURES.MD` for feature scope (F-IDs).
3. After completing work, update `docs/development/DEVELOPMENT_LOG.md` with decisions, patterns, and lessons.
4. Run tests before pushing: `pnpm test && pnpm test:integration`.

## License

TBD

## Contact

Mike Blakeway — [your contact]
