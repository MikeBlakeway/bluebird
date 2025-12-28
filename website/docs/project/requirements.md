---
sidebar_position: 4
---

# Requirements & Specifications

Comprehensive breakdown of Bluebird's functional and non-functional requirements, scope priorities, and technical specifications for the music composition platform.

## Quick Links

- **[Scope & Priorities](#scope)** - MoSCoW method (Must/Should/Could/Won't have)
- **[Non-Functional Requirements](#non-functional)** - Performance, reliability, security, scalability SLOs
- **[Functional Specifications](#functional)** - Feature details, API contracts, user flows
- **[Architecture & Method](#architecture)** - System design, data flow, algorithms

## Scope & Priorities {#scope}

### Must Have (MVP)

**Core Functionality**

- R-M1: Lyrics → Song flow with genre presets; 30s preview ≤45s P50
- R-M2: Per-section generation & selective regen ≤20s P50
- R-M3: 3–5 AI artist voices; harmonies; duet support
- R-M7: Project management (autosave, takes, reproducible seeds)
- R-M11: Account & auth (magic link, httpOnly cookies)

**Remix & Export Safety**

- R-M4: Remix Reference (≤30s, private). Export gated by Similarity Checker
  - Melody: interval n-gram Jaccard similarity
  - Rhythm: Dynamic Time Warping (DTW) alignment
  - Verdict: pass/borderline/block with actionable recommendations

- R-M5: Professional exports
  - Default: 48 kHz/24-bit stereo master + aligned stems
  - Alternative: 44.1 kHz/24-bit selectable at export
  - MP3 320 kbps for quick share
  - BWF markers with BPM/key metadata

- R-M6: Simple mixer with era presets; -14 LUFS loudness target

**Observability & Cost Control**

- R-M8: Observability — job timeline, seeds, downloadable reports
- R-M9: SLOs — First preview ≤45s P50; full render ≤8 min P50; P95 ≤2×
- R-M10: Safety — reference audio never used for training; feature vectors stored by default
- R-M12: Cost controls — GPU minutes metered; max duration 3:30; idempotency keys
- R-M13: Realtime progress via SSE — `GET /jobs/:id/events` with typed JobEvent updates

### Should Have

**Enhanced User Experience**

- R-S1: Section map editor (visual timeline)
- R-S2: Genre/era presets (styles, sounds, arrangements)
- R-S3: Command palette (⌘K / Cmd+K)
- R-S5: Take rating (1–5) with reason tags
- R-S6: Accessibility + dark/light themes
- R-S7: Privacy-respecting usage analytics

**Performance & Distribution**

- R-S4: In-IDE integration (CLI and VS Code extension)
- R-S8: Local WebAudio preview engine — instant client-side A/B mixing
- R-S9: CDN with short-TTL signed URLs for previews/exports
- R-S10: Similarity Budget control slider (Pro tier; Free uses safe defaults)

### Could Have (Future Enhancements)

- R-C1: Melody staff/piano-roll view
- R-C2: Lyric syllable meter assistant
- R-C3: Backing vocal pad generator
- R-C4: Mobile share link with watermark

### Won't Have (Out of Scope)

- R-W1: Celebrity voice cloning (legal + brand risk)
- R-W2: Full DAW parity (desktop app equivalent)
- R-W3: Real-time streaming generation (latency prohibitive)
- R-W4: Collaboration/multi-user editing (scope for future phase)

---

## Non-Functional Requirements {#non-functional}

### Performance (NFR-Perf)

**Time-to-First-Preview (TTFP) Budget: 45s P50**

- Planner: 12s (lyrics parse + arrangement generation)
- Music synth: 20s (backing track with fixed seed)
- Voice synth: 8s (lead vocal)
- Mix: 2s (era preset application)
- Overhead: 3s (network, queue, orchestration)

Per-section regeneration: ≤20s P50 (reuse arrangement, regenerate single section).

Full 3-minute song: ≤8 min P50 (5 sections × 90s each with parallelization).

**Metrics**

- P95 ≤2× P50 (95th percentile within 2× median)
- GPU cost budget: ≤$0.40 per 30s preview; ≤$2.50 per 3-min full render
- Cache hit rate: ≥70% for repeated section parameters (same seed)

### Reliability (NFR-Reliability)

- **Idempotency**: All POST endpoints require `Idempotency-Key` header (UUID); identical requests with same key return same result
- **Resumability**: Every stage persists artifacts and state to S3 and PostgreSQL; jobs continue from last completed stage
- **Exactly-once**: Export packaging validated before returning to user; no duplicate charges for retries

### Security (NFR-Security)

- All media at rest: AES-256 encryption
- Signed URLs: S3 artifacts accessed only via short-TTL presigned URLs
- Reference audio: **Private by default**; feature vectors only (no raw audio storage)
- Audit events: All uploads and exports logged with user ID, timestamp, artifact hash
- Rate limiting: 10 POST requests per 60 seconds per user; burst allowance for Pro tier

### Privacy (NFR-Privacy)

- **No training**: User media never used to train models or inference pods
- **Data retention**: Default 30 days; user-deletable on request; extends to 90 days for Pro with manual purge
- **Feature-only storage**: Reference audio converted to melody/rhythm/key/BPM features; raw audio discarded unless user opts in
- **Consent**: Explicit rights affirmation before upload; terms displayed at signup

### Observability (NFR-Observability)

- **Distributed tracing**: OpenTelemetry spans across orchestrator and all pods
- **Structured logs**: JSON logs with context IDs, stage names, durations
- **Metrics dashboard**: TTFP distribution, GPU minutes per job, pass/borderline/block rates by model

### Compliance (NFR-Compliance)

- Terms of Service: Uploaded by users, stored artifacts, export rights clarified
- Export gating: Similarity report shown before export; block verdict prevents download
- Profanity filter: Optional content moderation on lyrics (via third-party API or local model)
- Accessibility (WCAG 2.1 AA): Keyboard navigation, screen reader support, color contrast

### Scalability (NFR-Scalability)

- **Concurrent jobs**: 50 at launch, 200+ with horizontal pod autoscaling
- **Queue fairness**: Per-plan priorities; named queues (plan, melody, synth, vocal, mix, check, export)
- **Database**: Connection pooling for 100+ concurrent users
- **S3**: Multi-part upload for large stems; lifecycle policies (30-day archive, 90-day delete)

### Interoperability (NFR-Interoperability)

- **DAW compatibility**: Stems importable to Ableton Live, Logic Pro, Pro Tools, Reaper with BWF alignment markers
- **Sample rates**: 48 kHz/24-bit default; 44.1 kHz/24-bit on request
- **Formats**: WAV (masters + stems), MP3 320 kbps (share-friendly)

---

## Functional Specifications {#functional}

### Core User Flow

1. **Create Project** — Provide lyrics, select AI voice, choose genre preset
2. **Generate Preview** — System plans arrangement, renders 30s preview (≤45s)
3. **Review & Iterate** — User reviews preview, can regenerate sections, adjust mix
4. **Optional: Remix Vibe** — Upload ≤30s reference audio (optional); system extracts features
5. **Export & Download** — Similarity check gates export; user downloads master + stems + cue sheet

### Key Endpoints

```
POST /plan/song              — Create project & arrangement plan
POST /remix/reference/upload — Upload reference audio for feature extraction
POST /remix/melody           — Regenerate melody conditioned on remix features
POST /render/preview         — Render 30s preview
POST /render/section         — Render specific section
POST /check/similarity       — Compute similarity vs reference
POST /mix/final              — Render final master & stems
POST /export                 — Package and gate export
GET  /jobs/:jobId/events     — SSE stream for job progress
```

### Data Models

**ArrangementSpec**

- BPM (integer, 60–180)
- Key (string, e.g., "C major")
- Sections (array with start bar, end bar, style)
- Instrumentation (synth, drums, strings, etc.)
- Energy curve (normalized 0–1 per section)

**VocalScore**

- Lyric lines (array of strings)
- Artist mapping (line index → AI voice ID)
- Style notes (e.g., "melancholic," "powerful")
- Harmony parts (optional)

**RemixFeatures**

- Key, BPM (extracted from reference)
- Interval contour (melody shape)
- Rhythmic IOI grid (inter-onset intervals)
- Energy envelope

**SimilarityReport**

- Melody score (0–1, Jaccard on interval n-grams)
- Rhythm score (0–1, DTW alignment)
- Verdict (pass/borderline/block)
- Recommendations (e.g., "shift key ±1 semitone")

---

## Architecture & System Design {#architecture}

### Reference Architecture

**Frontend** → Next.js 15 + React 18 + WebAudio preview
**Orchestrator** → Fastify + BullMQ (Redis queue)
**Inference Pods** → Python FastAPI services (GPU-enabled)
**Data Stores** → PostgreSQL (metadata), MinIO (S3-compatible, audio artifacts), Redis (job queue)
**Observability** → OpenTelemetry, structured JSON logs

### Algorithm Highlights

**Similarity Engine**

1. Extract interval n-grams (n=3..5) from reference melody
2. Compare contours via Jaccard similarity (overlap / union)
3. Compute rhythmic alignment via DTW on IOI sequences
4. Combine scores (weighted): 0.6 × melody + 0.4 × rhythm
5. Hard rule: 8+ bar identical melodies always block

**Remix Conditioning**

1. Reference audio (≤30s) → feature extraction (key, BPM, contour)
2. Melody generator receives feature vector as soft constraint
3. Budget parameter (0–1 slider): 0 = original vibe only, 1 = explore freely
4. Pro tier: adjustable budget; Free: fixed 0.3 (safe defaults)

---

## Constraints & Assumptions

- **A1**: Max song length 3:30; samples at 44.1 kHz (WAV) or 48 kHz (export)
- **A2**: Inference via serverless GPU (Lambda or equivalent); cold start amortized via warm pools
- **A3**: Similarity calibrated on synthetic dataset; false positive rate ≤5%
- **A4**: Budget: ≤$0.40 GPU cost per 30s preview (P50)
- **A5**: IDE integration via CLI; VS Code extension for future
- **A6**: User reference audio retained for 30 days; feature vectors permanent (after opt-in)

---

## Approval & Next Steps

Review the requirements above. Once approved:

1. Method spec details system architecture and algorithms
2. Non-Functional Requirements guide performance budgets
3. UI Requirements document component specs and interactions
4. Implementation guide covers sprint-by-sprint execution

Raise questions or propose changes in GitHub issues; approved requirements will be tagged `requirements-approved`.
