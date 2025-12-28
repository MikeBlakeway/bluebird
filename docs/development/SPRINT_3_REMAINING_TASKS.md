# Sprint 3 Remaining Tasks (Detailed Breakdown)

**Date:** December 23, 2025
**Progress:** 55-60% Complete
**Remaining:** ~45% (Voice, Similarity, Integration, Testing)

---

## Overview

Sprint 3 has made excellent progress with infrastructure and 3 of 5 pods complete:

- ✅ Inference repo setup (Poetry, Docker, shared libs)
- ✅ Analyzer pod (key/BPM detection)
- ✅ Music pod (procedural drums/bass/guitar)
- ✅ Melody pod (syllable-to-MIDI generation)

**Remaining work focuses on:**

1. Voice synthesis (DiffSinger integration)
2. Similarity checking (export gating)
3. API integration (Node ↔ Python pods)
4. Reference upload & remix endpoints
5. Performance validation & testing

---

## Epic E3.4: Voice Pod (DiffSinger Integration)

**Status:** ⏳ Not Started
**Priority:** CRITICAL
**Estimated Time:** 5-7 days
**Complexity:** HIGH (most complex remaining piece)

### S3.4.1: Research & Setup (1 day)

**Tasks:**

- [ ] Research DiffSinger OpenVPI fork (GitHub: openvpi/DiffSinger)
- [ ] Review model requirements (checkpoint format, vocoder)
- [ ] Identify suitable pre-trained models for MVP (English singing)
- [ ] Document model licensing and attribution
- [ ] Set up local development environment with CUDA support (if available)

**Acceptance:**

- DiffSinger fork cloned and documented
- Pre-trained model identified and downloaded
- Licensing cleared for commercial use
- Dev environment ready for inference testing

### S3.4.2: Pod Skeleton & Dependencies (1 day)

**Tasks:**

- [ ] Create `pods/voice/` directory structure
- [ ] Create `pods/voice/main.py` with FastAPI app
- [ ] Create `pods/voice/requirements.txt` with DiffSinger dependencies
- [ ] Set up pod config (port 8004, health check, OTEL)
- [ ] Create Dockerfile.voice based on Dockerfile.base
- [ ] Add voice service to docker-compose.pods.yml

**Files:**

- `bluebird-infer/pods/voice/main.py`
- `bluebird-infer/pods/voice/requirements.txt`
- `bluebird-infer/pods/voice/config.py`
- `bluebird-infer/Dockerfile.voice`
- `bluebird-infer/docker-compose.pods.yml` (update)

**Acceptance:**

- Pod boots and responds to health check
- Docker image builds successfully
- Service accessible at `http://localhost:8004/health`

### S3.4.3: Model Loading & Inference (2 days)

**Tasks:**

- [ ] Create `pods/voice/model_loader.py` for DiffSinger checkpoint loading
- [ ] Create `pods/voice/vocoder.py` for waveform generation
- [ ] Implement model warmup on pod startup
- [ ] Add model caching to avoid reload on every request
- [ ] Test inference with sample phoneme sequence + F0 curve
- [ ] Validate output audio quality

**Files:**

- `bluebird-infer/pods/voice/model_loader.py`
- `bluebird-infer/pods/voice/vocoder.py`

**Acceptance:**

- DiffSinger model loads successfully on pod startup
- Can generate audio from phoneme + F0 input
- Output is melodic (not speech-like)
- Inference time <8s for 30s audio segment

### S3.4.4: Phoneme Alignment (1.5 days)

**Tasks:**

- [ ] Create `pods/voice/phoneme_aligner.py`
- [ ] Map English syllables to ARPABET phonemes
- [ ] Align phonemes to melody note timings
- [ ] Handle phoneme duration stretching for held notes
- [ ] Add silence/breath tokens between phrases
- [ ] Test alignment with various lyric patterns

**Files:**

- `bluebird-infer/pods/voice/phoneme_aligner.py`
- `bluebird-infer/tests/test_pods/test_voice_alignment.py`

**Acceptance:**

- Syllables correctly map to phonemes
- Phoneme timings align with melody note onsets/durations
- Output audio has correct lyric timing
- Test coverage ≥70%

### S3.4.5: Multi-Speaker Support (1 day)

**Tasks:**

- [ ] Create `pods/voice/speaker_loader.py`
- [ ] Support speaker ID or speaker embedding input
- [ ] Create mapping: AI Artist Name → DiffSinger speaker ID
- [ ] Test with multiple speaker voices
- [ ] Document available speakers in pod README

**Files:**

- `bluebird-infer/pods/voice/speaker_loader.py`
- `bluebird-infer/pods/voice/README.md` (update)

**Acceptance:**

- Can synthesize with ≥2 different speaker voices
- Speaker selection works via API parameter
- Voice quality consistent across speakers

### S3.4.6: API Endpoint & Integration (0.5 day)

**Tasks:**

- [ ] Implement POST /synthesize endpoint
- [ ] Request model: syllables, F0 curve, speaker, seed
- [ ] Response model: S3 URL or base64 audio
- [ ] Add error handling (invalid phonemes, model failure)
- [ ] Document API contract in pod README

**Acceptance:**

- Endpoint accepts melody pod output (F0 curve)
- Returns singing voice audio (not speech)
- Deterministic (same seed → same output)
- Documented with example curl commands

---

## Epic E3.5: Similarity Pod

**Status:** ⏳ Not Started
**Priority:** CRITICAL
**Estimated Time:** 3-4 days
**Complexity:** MEDIUM

### S3.5.1: Pod Skeleton & Dependencies (0.5 day)

**Tasks:**

- [ ] Create `pods/similarity/` directory structure
- [ ] Create `pods/similarity/main.py` with FastAPI app
- [ ] Create `pods/similarity/requirements.txt` (numpy, scipy, fastdtw)
- [ ] Set up pod config (port 8005, health check, OTEL)
- [ ] Create Dockerfile.similarity
- [ ] Add similarity service to docker-compose.pods.yml

**Files:**

- `bluebird-infer/pods/similarity/main.py`
- `bluebird-infer/pods/similarity/requirements.txt`
- `bluebird-infer/pods/similarity/config.py`
- `bluebird-infer/Dockerfile.similarity`

**Acceptance:**

- Pod boots and responds to health check
- Service accessible at `http://localhost:8005/health`

### S3.5.2: N-Gram Jaccard Similarity (1 day)

**Tasks:**

- [ ] Create `pods/similarity/similarity_checker.py`
- [ ] Implement interval n-gram generation (reuse from bbfeatures)
- [ ] Implement Jaccard similarity function
- [ ] Test with n=3, n=4, n=5 grams
- [ ] Add weighted combination of n-gram sizes
- [ ] Create golden fixtures for validation

**Files:**

- `bluebird-infer/pods/similarity/similarity_checker.py`
- `bluebird-infer/tests/test_pods/test_similarity.py`
- `bluebird-infer/tests/fixtures/golden_similarity.json`

**Acceptance:**

- Jaccard similarity computed for melody pairs
- Score range: 0.0 (no match) to 1.0 (identical)
- Golden fixtures pass with expected scores
- Test coverage ≥70%

### S3.5.3: DTW Rhythm Comparison (1 day)

**Tasks:**

- [ ] Add DTW rhythm comparison to similarity_checker.py
- [ ] Extract IOI (inter-onset interval) sequences
- [ ] Compute DTW distance between IOI sequences
- [ ] Normalize DTW score to 0.0-1.0 range
- [ ] Test with rhythmically similar/different melodies
- [ ] Add to golden fixtures

**Acceptance:**

- DTW rhythm score computed for melody pairs
- Score reflects rhythmic similarity accurately
- Golden fixtures pass
- Test coverage ≥70%

### S3.5.4: Hard Rules & Clone Detection (0.5 day)

**Tasks:**

- [ ] Implement 8-bar+ exact clone detection
- [ ] Add threshold logic: pass (<0.35), borderline (0.35-0.48), block (≥0.48)
- [ ] Add combined score: 0.7 _ melody + 0.3 _ rhythm
- [ ] Test edge cases (transposed melodies, rhythmic variations)
- [ ] Document decision logic in code comments

**Acceptance:**

- 8-bar+ clones always block (regardless of score)
- Thresholds correctly classify test cases
- Combined score reflects overall similarity
- Edge cases handled correctly

### S3.5.5: Verdict Logic & Recommendations (1 day)

**Tasks:**

- [ ] Create verdict response model (pass/borderline/block)
- [ ] Generate user-facing recommendations for borderline/block
  - "Shift key by +1 semitone"
  - "Regenerate chorus melody"
  - "Adjust rhythm in verse"
- [ ] Add confidence scores to verdict
- [ ] Test verdict generation with various scenarios
- [ ] Document verdict logic in pod README

**Acceptance:**

- Verdict correctly assigned based on scores
- Recommendations are actionable and clear
- Confidence scores reflect certainty
- Pod README documents all verdict cases

### S3.5.6: API Endpoint & Integration (0.5 day)

**Tasks:**

- [ ] Implement POST /check endpoint
- [ ] Request model: reference melody, generated melody
- [ ] Response model: verdict, scores, recommendations
- [ ] Add error handling (invalid input, computation failure)
- [ ] Document API contract

**Acceptance:**

- Endpoint accepts two melodies (as MIDI note sequences)
- Returns verdict with melody/rhythm scores
- Deterministic (same input → same output)
- Documented with example curl commands

---

## Epic E3.6: API Worker Integration

**Status:** ⏳ Not Started
**Priority:** HIGH
**Estimated Time:** 3-4 days
**Complexity:** MEDIUM

### S3.6.1: Music Worker → Music Pod (0.5 day)

**Tasks:**

- [ ] Update `apps/api/src/lib/workers/music-worker.ts`
- [ ] Replace stub with HTTP call to `http://music:8002/synthesize`
- [ ] Pass ArrangementSpec data to pod (BPM, duration, seed)
- [ ] Download synthesized stems from pod response
- [ ] Upload stems to S3
- [ ] Test end-to-end with real pod

**Files:**

- `bluebird/apps/api/src/lib/workers/music-worker.ts`
- `bluebird/apps/api/src/lib/workers/music-worker.test.ts` (update)

**Acceptance:**

- Music worker calls music pod successfully
- Stems uploaded to S3 with correct paths
- Job completes without errors
- Test coverage maintained

### S3.6.2: Melody Worker → Melody Pod (0.5 day)

**Tasks:**

- [ ] Create `apps/api/src/lib/workers/melody-worker.ts` (NEW)
- [ ] Fetch lyrics syllables from database
- [ ] Call `http://melody:8003/generate-melody`
- [ ] Upload MIDI + F0 curve to S3
- [ ] Emit SSE progress event
- [ ] Add to BullMQ queue setup

**Files:**

- `bluebird/apps/api/src/lib/workers/melody-worker.ts` (NEW)
- `bluebird/apps/api/src/lib/queue.ts` (add melody queue)
- `bluebird/apps/api/src/lib/worker.ts` (add melody processor)

**Acceptance:**

- Melody worker enqueues and processes jobs
- F0 curve uploaded to S3
- SSE event emitted on completion
- Test coverage ≥70%

### S3.6.3: Voice Worker → Melody + Voice Pods (1 day)

**Tasks:**

- [ ] Update `apps/api/src/lib/workers/voice-worker.ts`
- [ ] Fetch F0 curve from S3 (from melody worker output)
- [ ] Call `http://voice:8004/synthesize` with F0 + syllables
- [ ] Download singing voice audio from pod
- [ ] Upload vocals to S3
- [ ] Test with multiple speakers/artists

**Files:**

- `bluebird/apps/api/src/lib/workers/voice-worker.ts`
- `bluebird/apps/api/src/lib/workers/voice-worker.test.ts` (update)

**Acceptance:**

- Voice worker calls melody + voice pods in sequence
- Singing voice (not speech) uploaded to S3
- Multiple speakers work correctly
- Test coverage maintained

### S3.6.4: Analyzer Worker → Analyzer Pod (0.5 day)

**Tasks:**

- [ ] Create `apps/api/src/lib/workers/analyzer-worker.ts` (NEW)
- [ ] Accept reference audio S3 URL
- [ ] Call `http://analyzer:8001/analyze/key` and `/analyze/bpm`
- [ ] Extract contour/n-grams via additional endpoints
- [ ] Upload features JSON to S3
- [ ] Emit SSE progress event

**Files:**

- `bluebird/apps/api/src/lib/workers/analyzer-worker.ts` (NEW)
- `bluebird/apps/api/src/lib/queue.ts` (add analyzer queue)
- `bluebird/apps/api/src/lib/worker.ts` (add analyzer processor)

**Acceptance:**

- Analyzer worker extracts features from reference audio
- Features JSON uploaded to S3 (not raw audio)
- SSE event emitted on completion
- Test coverage ≥70%

### S3.6.5: Pod Communication Utilities (0.5 day)

**Tasks:**

- [ ] Create `apps/api/src/lib/pods.ts` (pod client wrapper)
- [ ] Add helper functions: callMusicPod(), callVoicePod(), etc.
- [ ] Centralize retry logic + timeout handling
- [ ] Add structured logging for pod calls
- [ ] Test with mock pod responses

**Files:**

- `bluebird/apps/api/src/lib/pods.ts` (NEW)
- `bluebird/apps/api/src/lib/pods.test.ts` (NEW)

**Acceptance:**

- Pod client wrapper simplifies worker code
- Retry logic handles transient failures
- Logs include correlation IDs
- Test coverage ≥70%

### S3.6.6: Integration Testing (1 day)

**Tasks:**

- [ ] Update `apps/api/src/lib/queue.integration.test.ts`
- [ ] Test plan flow: planner → melody → music → voice → mix
- [ ] Test section regen: melody + music or voice only
- [ ] Test reference analysis: analyzer → features
- [ ] Measure end-to-end latency
- [ ] Verify S3 artifacts created correctly

**Acceptance:**

- Integration tests pass with real pods (via Docker Compose)
- TTFP measured and documented
- Section regen measured and documented
- All S3 artifacts validated

---

## Epic E3.7: Reference Upload & Remix Endpoints

**Status:** ⏳ Not Started
**Priority:** HIGH
**Estimated Time:** 2-3 days
**Complexity:** MEDIUM

### S3.7.1: Reference Upload Endpoint (1 day)

**Tasks:**

- [ ] Create `apps/api/src/routes/remix.ts`
- [ ] Implement POST /remix/reference/upload
- [ ] Validate audio file (≤30s duration, supported formats)
- [ ] Upload to S3: `projects/{projectId}/takes/{takeId}/reference/ref.wav`
- [ ] Enqueue analyzer job for feature extraction
- [ ] Return job ID for SSE tracking
- [ ] Add Idempotency-Key support

**Files:**

- `bluebird/apps/api/src/routes/remix.ts` (NEW)
- `bluebird/packages/types/src/remix.ts` (NEW DTOs)

**Acceptance:**

- Endpoint accepts audio files via multipart/form-data
- Validation rejects files >30s or invalid formats
- Reference audio uploaded to S3
- Analyzer job enqueued
- Idempotency prevents duplicate uploads
- Test coverage ≥70%

### S3.7.2: Reference Feature Storage (0.5 day)

**Tasks:**

- [ ] Update analyzer worker to store features
- [ ] Create RemixFeatures DTO (key, BPM, contour, n-grams)
- [ ] Upload features to S3: `features/remix.json`
- [ ] Optionally delete raw reference audio (GDPR)
- [ ] Update SSE event: reference-analyzed

**Files:**

- `bluebird/apps/api/src/lib/workers/analyzer-worker.ts` (update)
- `bluebird/packages/types/src/remix.ts` (RemixFeatures DTO)

**Acceptance:**

- Features JSON created after analysis
- Raw audio optionally deleted (configurable)
- SSE event emitted on completion
- Features retrievable for melody guidance

### S3.7.3: Remix Melody Endpoint (1 day)

**Tasks:**

- [ ] Implement POST /remix/melody in remix.ts
- [ ] Fetch reference features from S3
- [ ] Apply similarity budget slider (Free: 0.25, Pro: adjustable)
- [ ] Enqueue melody job with contour guidance
- [ ] Enqueue similarity check after generation
- [ ] Return job ID for tracking

**Files:**

- `bluebird/apps/api/src/routes/remix.ts` (update)

**Acceptance:**

- Endpoint triggers remix melody generation
- Contour guidance applied from reference features
- Similarity budget respected
- Similarity check enqueued automatically
- Idempotency supported
- Test coverage ≥70%

### S3.7.4: Similarity Check Workflow (0.5 day)

**Tasks:**

- [ ] Create `apps/api/src/lib/workers/similarity-worker.ts` (NEW)
- [ ] Fetch reference melody and generated melody
- [ ] Call `http://similarity:8005/check`
- [ ] Store verdict in database (takes.similarityVerdict)
- [ ] Emit SSE event: similarity-checked
- [ ] Add to BullMQ queue setup

**Files:**

- `bluebird/apps/api/src/lib/workers/similarity-worker.ts` (NEW)
- `bluebird/apps/api/src/lib/queue.ts` (add similarity queue)
- `bluebird/apps/api/src/lib/worker.ts` (add similarity processor)

**Acceptance:**

- Similarity worker calls similarity pod
- Verdict stored in database
- SSE event includes scores + recommendations
- Test coverage ≥70%

---

## Epic E3.8: Export Gating

**Status:** ⏳ Not Started
**Priority:** HIGH
**Estimated Time:** 1-2 days
**Complexity:** LOW

### S3.8.1: Export Gating Logic (1 day)

**Tasks:**

- [ ] Update POST /export endpoint
- [ ] Check `takes.similarityVerdict` before allowing export
- [ ] Block export if verdict is "block"
- [ ] Show warning modal if verdict is "borderline"
- [ ] Include recommendations in error response
- [ ] Add override flag for Pro users (with audit log)

**Files:**

- `bluebird/apps/api/src/routes/export.ts` (update)
- `bluebird/packages/types/src/export.ts` (update DTOs)

**Acceptance:**

- Export blocked if similarity verdict = "block"
- Warning shown if verdict = "borderline"
- Recommendations displayed to user
- Pro users can override (logged)
- Test coverage ≥70%

### S3.8.2: Frontend Export Modal Updates (0.5 day)

**Tasks:**

- [ ] Update `apps/web/src/components/ExportModal.tsx`
- [ ] Show similarity verdict in modal
- [ ] Display melody/rhythm scores
- [ ] Show recommendations if borderline/block
- [ ] Add "Regenerate Melody" button if blocked
- [ ] Update UI copy for clarity

**Files:**

- `bluebird/apps/web/src/components/ExportModal.tsx`

**Acceptance:**

- Similarity verdict visible in export modal
- Scores displayed with visual indicators
- Recommendations clear and actionable
- Regenerate button triggers melody regen
- UI polished and user-friendly

### S3.8.3: Audit Logging (0.5 day)

**Tasks:**

- [ ] Add audit log table to Prisma schema
- [ ] Log export attempts with similarity verdict
- [ ] Log Pro user overrides
- [ ] Add API endpoint: GET /audit/exports
- [ ] Test audit log retrieval

**Files:**

- `bluebird/apps/api/prisma/schema.prisma` (add AuditLog model)
- `bluebird/apps/api/src/routes/audit.ts` (NEW)

**Acceptance:**

- All export attempts logged
- Overrides clearly marked in audit log
- Admin can retrieve audit logs
- Privacy considerations documented

---

## Epic E3.9: Performance Validation

**Status:** ⏳ Not Started
**Priority:** HIGH
**Estimated Time:** 2 days
**Complexity:** LOW

### S3.9.1: TTFP Measurement with Real Models (1 day)

**Tasks:**

- [ ] Run full preview flow with real pods
- [ ] Measure: plan + melody + music + voice + mix
- [ ] Collect P50, P90, P99 latencies
- [ ] Compare with target (≤45s P50)
- [ ] Identify bottlenecks if over budget
- [ ] Document results in PERFORMANCE_REPORT.md

**Acceptance:**

- TTFP P50 ≤45s with real models
- Latency breakdown documented
- Bottlenecks identified and prioritized
- Report includes charts/graphs

### S3.9.2: Section Regen Measurement (0.5 day)

**Tasks:**

- [ ] Measure section regen latency (music + voice)
- [ ] Collect P50, P90, P99 latencies
- [ ] Compare with target (≤20s P50)
- [ ] Test with locked/unlocked sections
- [ ] Document results

**Acceptance:**

- Section regen P50 ≤20s
- Locked sections skip correctly
- Results documented

### S3.9.3: GPU Cost Tracking (0.5 day)

**Tasks:**

- [ ] Calculate GPU cost per preview (if using GPU)
- [ ] Measure: music + voice synthesis time
- [ ] Compare with budget (≤$0.40 per 30s preview)
- [ ] Identify cost optimization opportunities
- [ ] Document in cost model spreadsheet

**Acceptance:**

- Cost per preview calculated
- Within budget or optimization plan documented
- Cost model spreadsheet updated

---

## Epic E3.10: Integration Testing

**Status:** ⏳ Not Started
**Priority:** MEDIUM
**Estimated Time:** 2 days
**Complexity:** MEDIUM

### S3.10.1: Pod Contract Tests (0.5 day)

**Tasks:**

- [ ] Create contract tests for each pod endpoint
- [ ] Validate request/response schemas
- [ ] Test error handling (invalid input, timeouts)
- [ ] Add to CI pipeline
- [ ] Document pod API contracts in OpenAPI

**Files:**

- `bluebird-infer/tests/test_contracts/` (NEW)
- `bluebird-infer/docs/api/openapi.yaml` (NEW)

**Acceptance:**

- Contract tests pass for all pods
- OpenAPI spec generated and validated
- CI fails on contract breakage
- Test coverage ≥70%

### S3.10.2: End-to-End Similarity Testing (0.5 day)

**Tasks:**

- [ ] Create golden fixture library (20+ melody pairs)
- [ ] Run similarity checks on all fixtures
- [ ] Validate verdicts match expectations
- [ ] Test edge cases (transpositions, inversions, rhythmic shifts)
- [ ] Document fixture library in README

**Files:**

- `bluebird-infer/tests/fixtures/similarity/` (NEW)
- `bluebird-infer/tests/test_similarity_e2e.py` (NEW)

**Acceptance:**

- Golden fixtures pass with expected verdicts
- Edge cases handled correctly
- Fixture library documented
- Test coverage ≥70%

### S3.10.3: Full Workflow E2E Tests (1 day)

**Tasks:**

- [ ] Test: lyrics → plan → preview (with real pods)
- [ ] Test: reference upload → features → remix melody
- [ ] Test: similarity check → export gating
- [ ] Test: section regen with locked sections
- [ ] Test: export with similarity verdict
- [ ] Add to Playwright E2E suite

**Files:**

- `bluebird/apps/web/tests/e2e/sprint-3-workflow.spec.ts` (NEW)

**Acceptance:**

- E2E tests pass with real pods
- All user workflows validated
- Tests run in CI (with Testcontainers for pods)
- Test coverage ≥70%

---

## Summary: Remaining Work Breakdown

| Epic  | Description              | Priority | Est. Days | Status         |
| ----- | ------------------------ | -------- | --------- | -------------- |
| E3.4  | Voice Pod (DiffSinger)   | CRITICAL | 5-7       | ⏳ Not Started |
| E3.5  | Similarity Pod           | CRITICAL | 3-4       | ⏳ Not Started |
| E3.6  | API Worker Integration   | HIGH     | 3-4       | ⏳ Not Started |
| E3.7  | Reference Upload & Remix | HIGH     | 2-3       | ⏳ Not Started |
| E3.8  | Export Gating            | HIGH     | 1-2       | ⏳ Not Started |
| E3.9  | Performance Validation   | HIGH     | 2         | ⏳ Not Started |
| E3.10 | Integration Testing      | MEDIUM   | 2         | ⏳ Not Started |

**Total Estimated Time:** 18-27 days (3-4 weeks)

---

## Success Criteria (Sprint 3 Completion)

- [ ] Voice pod produces singing voice (not speech) with DiffSinger
- [ ] Similarity pod blocks exports when score ≥0.48
- [ ] All Node workers call Python pods via HTTP
- [ ] Reference upload → feature extraction → remix melody works end-to-end
- [ ] Export gating enforces similarity verdict
- [ ] TTFP P50 ≤45s with real models
- [ ] Section regen P50 ≤20s
- [ ] Test coverage ≥70% across all new code
- [ ] User can complete workflow: upload reference → remix → check similarity → export or iterate

---

## Notes & Risks

**Risks:**

- DiffSinger integration complexity (model loading, phoneme alignment)
- Voice quality may require model fine-tuning
- TTFP budget tight if voice synthesis >8s per section
- Golden fixture library requires manual validation

**Mitigation:**

- Start with Voice pod early (highest risk)
- Use pre-trained DiffSinger models from OpenVPI
- Test voice quality with sample lyrics before full integration
- Parallelize similarity pod work while Voice pod in progress
- Prepare golden fixtures incrementally during development

**Dependencies:**

- Voice pod depends on Melody pod output (F0 curves) ✅ Ready
- Similarity pod depends on Analyzer pod (n-grams) ✅ Ready
- Export gating depends on Similarity pod
- Performance validation depends on all pods complete

---

**Status:** Ready to begin Voice Pod (E3.4) as top priority 🚀
