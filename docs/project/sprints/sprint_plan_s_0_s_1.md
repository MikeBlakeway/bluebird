# SPEC-001-Bluebird — Sprint Plan S0–S1

> Default cadence: **2-week sprints**. Environments: **local + staging** until M3, then add prod.

## Sprint 0 (Foundation Ready)

**Goal:** Stand up repo + local stack; auth; SSE hello world; planning endpoints; baseline DB.

**Scope (stories)**

- E0: Monorepo scaffold; local docker stack (PG, Redis, MinIO); CI (lint/type/build/tests).
- E1: Magic-link auth; Project CRUD.
- E2: Analyzer (lyrics parse stub); Planner (structure/BPM/key heuristics v0); `/plan/song` + aliases.
- E3: SSE pipeline shell (job events from worker); queue naming and priorities.

**Acceptance**

- CLI `bluebird plan` returns `planId`; SSE events stream stages.
- DB migrations applied; artifacts written to MinIO; auth works (email console).

**Day plan (10 workdays)**

- D1–D2: Monorepo + docker-compose; Prisma models; migrations; healthchecks.
- D3: CI + test harness; shared `packages/types` + zod DTOs.
- D4: Auth (magic link); sessions/JWT; Project CRUD.
- D5–D6: Analyzer stub (syllables/rhyme hints), Planner v0 (structure, BPM/key guess); persist `plan.json`.
- D7: Orchestrator endpoints (`/plan/song`, `/plan/arrangement`, `/plan/vocals`); idempotency keys.
- D8: Redis/BullMQ queues (plan/analyze + priorities; DLQ); worker skeleton.
- D9: SSE server (`/jobs/:id/events`); heartbeats; reconnect.
- D10: Hardening; docs; demo script; burn‑in tests.

**Risks & mitigations**

- SMTP delivery delays → start with console logger; switch to dev SMTP later.
- DTO drift → contract tests between `web` and `api` using `packages/types`.

---

## Sprint 1 (Preview Vertical Slice)

**Goal:** 30‑second preview (lyrics→audio) end‑to‑end with stubs; UI workspace + local A/B preview.

**Scope (stories)**

- E3: Music Synth stub (click/guide + loop bed); Voice Synth stub (syllable‑aligned tones); Mix (sum + LUFS clamp); signed preview.
- E4: Workspace shell (Lyrics, Structure, Artist/Genre), WebAudio local mixer + A/B, section controls.
- E6: Export preview (WAV/MP3) with presigned URLs.

**Acceptance**

- TTFP ≤ **45s** P50 local/staging.
- User pastes lyrics, selects preset/artist, clicks **Generate Preview**, receives 30s audio; A/B works locally without re‑rendering.

**Day plan (10 workdays)**

- D1: Music stub path + stems scaffold; meters; seed control.
- D2–D3: Voice stub (syllable timing); alignment to sections; harmonies toggle hook.
- D4: Mix & mastering preset v0; loudness/true‑peak checks.
- D5: Export preview (WAV/MP3); S3 presign; cache headers (CDN later).
- D6–D7: Next.js workspace; Structure grid; Artist/Genre sidebar; per‑section controls (lock/regen placeholders).
- D8–D9: WebAudio graph; track gain/mute; A/B compare; keyboard shortcuts.
- D10: UX polish; defect triage; demo; measure TTFP; update docs.

**Risks & mitigations**

- WebAudio sync drift → central transport clock; pre‑roll; small crossfades.
- Perceived latency → optimistic UI; SSE progress; disable controls only when necessary.

---

## Deliverables & Links

- Jira/GitHub import files (Epics/Stories/Tasks for Sprints 0–1).
- Demo script covering plan→preview flow.

---

## Definition of Ready (DoR)

- User story has clear AC, DTO schema in `packages/types`, and dev test fixture.

## Definition of Done (DoD)

- AC met; traces present; artifacts in S3; docs updated; demoable.
