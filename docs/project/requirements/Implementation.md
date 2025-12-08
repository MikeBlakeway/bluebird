# Implementation Plan (MVP v0.1)

This plan translates the patched **Requirements** and **Method** into deliverable Epics → Stories → Tasks, with acceptance criteria (AC), estimates, and milestone gates suitable for a solo full‑stack developer.

---

## Execution Plan at a Glance

- **Cadence:** 2‑week sprints (adjustable). Target **Sprints 0–6** for MVP.
- **Key Vertical Slices:**
  1) **Preview Path** (lyrics→30s preview via Analyzer→Planner→Music/Voice stubs→Mix→SSE).
  2) **Section Regen** (lock/regen single section).
  3) **Remix + Similarity Gate** (≤30s reference, features, report, export blocking).
  4) **Pro Export + CDN** (stereo + stems with BWF markers, 48 kHz default, 44.1 optional).
  5) **WebAudio Local Preview + A/B** (perceived speed & cost reduction).

---

## Epics → Stories → Tasks (with AC & Estimates)

> Estimates: **S** ≤ 0.5d, **M** ≈ 1–2d, **L** ≈ 3–5d, **XL** > 5d. Effort assumes solo dev; contiguous GPU time not included.

### E0 — Project Bootstrap & DevEx

Stories:

- S0.1 Monorepo scaffold (pnpm workspaces) with `apps/web`, `apps/api`, `packages/types`, `packages/cli` (**M**)
- S0.2 Local stack via docker‑compose: Postgres, Redis, MinIO (S3), API, mock pods (**M**)
- S0.3 CI (lint, typecheck, build, unit/integration) + `main` → staging deploy (**M**)

Tasks:

- T0.1 Init repo, commit hooks, TS strict, ESLint/Prettier (**S**) — **AC:** CI passes on empty app
- T0.2 Compose file with healthchecks, volumes, networks (**M**) — **AC:** `docker compose up` yields healthy stack
- T0.3 Shared **types** package with zod schemas for DTOs (**M**) — **AC:** `api` and `web` import from `packages/types`
- T0.4 Terraform skeleton for S3/Redis/PG placeholders (**M**) — **AC:** `terraform plan` runs without errors

### E1 — Auth & Accounts

Stories:

- S1.1 Magic‑link auth (passwordless) (**M**)
- S1.2 Project CRUD + ownership model (**S**)

Tasks:

- T1.1 Fastify plugin for session/JWT; magic link email sender (local console first) (**M**) — **AC:** login link grants session
- T1.2 Prisma models + migrations for users/projects (**S**) — **AC:** CRUD tested via Postman

### E2 — Planner Pipeline & Data Model

Stories:

- S2.1 Analyzer pod (lyrics parse; reference analysis stub) (**M**)
- S2.2 Planner pod (structure plan; BPM/key suggestion) (**L**)
- S2.3 Orchestrator `/plan/song`, `/plan/arrangement`, `/plan/vocals` (**M**)

Tasks:

- T2.1 Create `jobs`, `takes`, `sections`, `artifacts` tables (per spec) (**M**) — **AC:** migrations applied
- T2.2 Worker consumes `plan`/`analyze` queues; persists plan.json to S3 (**M**) — **AC:** artifact visible in MinIO
- T2.3 CLI `bluebird plan` (**S**) — **AC:** returns planId/seed

### E3 — Preview Path (Stubs → Realistic Audio)

Stories:

- S3.1 Music Synth (stub generator producing click/guide + simple loops) (**M**) → later swap to real models (**XL**)
- S3.2 Voice Synth (stub TTS/tones aligned to lyrics syllables) (**L**)
- S3.3 Mix & Master (basic summing + LUFS constraint) (**M**)
- S3.4 SSE job stream `GET /jobs/:id/events` (**M**)

Tasks:

- T3.1 Queues: `synth`, `vocal`, `mix` named; priority lanes in BullMQ (**M**) — **AC:** Pro vs standard priority works
- T3.2 SSE server with heartbeats & reconnect (**M**) — **AC:** front‑end subscribes; sees stage/progress
- T3.3 Export preview WAV/MP3 to S3; presigned GET (**S**) — **AC:** 30s preview downloadable

### E4 — Web Frontend: Song Workspace & Local Preview

Stories:

- S4.1 Workspace scaffolding: Lyrics panel, Structure grid, Artist/Genre sidebar (**L**)
- S4.2 Local WebAudio mixer + A/B compare (**L**)
- S4.3 Section controls: regen/lock/harmony toggle (**M**)
- S4.4 Similarity status pill + Report drawer UI (**M**)

Tasks:

- T4.1 RSC pages + server actions; optimistic updates for regen/lock (**M**) — **AC:** UX responsive during renders
- T4.2 WebAudio graph builder; per‑track gain/mute; sync transport (**L**) — **AC:** A/B instant, no GPU call
- T4.3 Keyboard shortcuts (space/R/L/H/E/?) (**S**) — **AC:** shortcuts functional

### E5 — Remix & Similarity Gate

Stories:

- S5.1 `/remix/reference/upload` + presigned PUT; length limit 30s (**M**)
- S5.2 `reference_features` extraction (Analyzer) (**L**)
- S5.3 **Melody Generator (Remix)** pod + `/remix/melody` (**XL**)
- S5.4 Similarity Checker (interval n‑grams + rhythm DTW + hard rules) (**XL**)
- S5.5 Export gate enforcing verdicts; Budget slider (Pro) (**M**)

Tasks:

- T5.1 HPSS/vocal‑separation (lightweight) for reference (**L**) — **AC:** pitch/IOI features stable
- T5.2 Scores & thresholds; JSON report with excerpts & recs (**L**) — **AC:** sample borderline/pass/block cases
- T5.3 UI Budget slider (Pro) and fixed defaults (Free) (**S**) — **AC:** server validates budget limits

### E6 — Export Packaging & CDN

Stories:

- S6.1 Stems + master packaging; BWF markers; metadata embed (**L**)
- S6.2 48 kHz/24‑bit default; optional 44.1 kHz at export (**M**)
- S6.3 CDN distribution + short‑TTL signed URLs (**M**)

Tasks:

- T6.1 Exporter pod: pack stems; write `cue` markers (**L**) — **AC:** DAW import aligns
- T6.2 Sample‑rate conversion (soxlib/ffmpeg) (**S**) — **AC:** ABX transparent
- T6.3 CDN IaC + cache control headers (**M**) — **AC:** cache HITs on re‑download

### E7 — Observability, Analytics, Cost Controls

Stories:

- S7.1 OpenTelemetry traces (API, worker, pods) + Prometheus metrics (**M**)
- S7.2 GPU‑minutes/job, cache‑hit rate, similarity pass/block dashboard (**M**)
- S7.3 Idempotency keys on all POSTs (**S**)

Tasks:

- T7.1 Run‑ID propagation; span attributes: seed, section, pod (**S**) — **AC:** trace shows full path
- T7.2 DLQ per queue + retries/exponential backoff (**S**)
- T7.3 Usage analytics (privacy‑respecting) events (**S**)

### E8 — IDE + Agent Integration

Stories:

- S8.1 CLI (`bluebird`) verbs: plan, preview, render, check, export (**M**)
- S8.2 VS Code extension (Webview for Job Timeline, artifacts) (**L**)
- S8.3 Agent prompt packs (Planner, Similarity Analyst) (**S**)

Tasks:

- T8.1 CLI auth & config; JSON outputs for scripting (**S**)
- T8.2 Extension listens to SSE; open artifact links (**M**)

### E9 — Security & Compliance

Stories:

- S9.1 Rights affirmation + content policy at upload (**S**)
- S9.2 Private buckets; presigned URL lifetimes; Redis TLS + ACL (**M**)
- S9.3 Privacy defaults: store **features** not raw reference; opt‑in for raw (**S**)

Tasks:

- T9.1 Audit log for upload/export actions (**S**)
- T9.2 Secrets management (env + SOPS or parameter store) (**M**)

### E10 — Performance & Scaling

Stories:

- S10.1 Warm pool for pods; autoscale by queue depth (**L**)
- S10.2 Section‑parallel full renders with per‑project caps (**M**)
- S10.3 P50/P95 SLO alerts; regression guard in CI (**M**)

Tasks:

- T10.1 Benchmark harness + golden previews (fixtures) (**M**)
- T10.2 Cost ceiling per user (budget alerts) (**S**)

---

## Milestones & Gates

### M0 — Foundation Ready (end Sprint 0)

- Deliverables: Monorepo, local stack, auth, basic CRUD, SSE hello‑world.
- Gate: CI green; local demo runs `bluebird plan` and SSE events stream.

### M1 — Preview Path Vertical Slice (end Sprint 1)

- Deliverables: Analyzer+Planner, music/voice stubs, mix, 30s preview via UI + SSE.
- Gate: TTFP ≤ 45s in local/staging; preview downloadable.

### M2 — Section Regen & Workspace (end Sprint 2)

- Deliverables: Structure grid, per‑section regen/lock, Local WebAudio A/B.
- Gate: Regen P50 ≤ 20s; A/B works offline with cached audio.

### M3 — Remix + Similarity Gate (end Sprint 4)

- Deliverables: Reference upload, features, Melody Generator, Similarity Checker with report; export blocking.
- Gate: Test corpus yields pass/borderline/block as expected.

### M4 — Export & CDN (end Sprint 5)

- Deliverables: Stems + master, BWF markers, 48 kHz default/44.1 optional, CDN.
- Gate: DAW import alignment verified in Ableton/Logic.

### M5 — Observability & Hardening (end Sprint 6)

- Deliverables: Dashboards, idempotency, DLQs, SLO alerts, security/privacy controls.
- Gate: Load test with 50 concurrent jobs; P95 ≤ 2× P50.

---

## Environment & Configuration

- **Env vars (api)**: `DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET`, `CDN_BASE`, `JWT_SECRET`, `EMAIL_FROM`, `SMTP_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`.
- **Queues**: `plan`, `analyze`, `melody`, `synth`, `vocal`, `mix`, `check`, `export` with priorities `pro`, `standard`.
- **Presign TTLs**: previews 10 min; exports 30 min.

---

## Test Plan (MVP)

- **Unit**: DTO validation, planner heuristics, similarity math.
- **Integration**: plan→preview slice; section regen; export pack/unpack.
- **Golden**: 10 lyric fixtures, 5 reference fixtures; expected similarity verdicts.
- **E2E**: Signup→lyrics→preview→regen→remix→export (happy path).

---

## Backlog (post‑MVP)

- Backing vocal pad generator; staff/piano‑roll; mobile share link; watermarked internal previews; Pro priority + pricing linkage; rhythm‑only remix mode.

---

## Definition of Done (DoD)

- ACs met; traces and metrics present; artifacts stored; docs updated; demo script recorded.
