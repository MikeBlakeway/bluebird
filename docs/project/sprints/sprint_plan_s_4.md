# Sprint 4: Audio Separation & Speaker Diarization Service

**Duration:** 2 weeks (10 working days)
**Start Date:** TBD
**Owner:** Mike Blakeway
**Status:** Planning

---

## Sprint Goals

1. **Primary**: Deploy Demucs-based source separation pod for 4-stem audio splitting (vocals, drums, bass, other)
2. **Primary**: Deploy pyannote-based speaker diarization pod for multi-speaker isolation
3. **Primary**: Prepare ADR to extend canonical endpoints before exposing public API for analysis
4. **Secondary**: Enable reference track feature extraction for future Remix capabilities
5. **Stretch**: Implement combined pipeline (music separation → vocal diarization)

---

## Success Criteria

- [ ] Demucs pod processes 5-minute audio file in <60 seconds on A10 GPU
- [ ] pyannote pod identifies and timestamps speakers with <20% DER on test recordings
- [ ] API endpoints (post-ADR) validate inputs with Zod and return typed responses
- [ ] Docker images build successfully and deploy to Runpod serverless
- [ ] Integration tests pass for end-to-end workflows
- [ ] S3 storage pattern follows existing conventions (projects/{projectId}/analysis/)

---

## New Components

### API Endpoints (apps/api/src/routes)

Canonical endpoint names are controlled in §3 of copilot-instructions. We will not implement non-canonical routes until an ADR updates §3. Plan of record:

```
GET  /jobs/:jobId/events     - SSE for analysis progress (existing)

Pending ADR (required before implementation):
POST /analyze/separate       - Source separation (Demucs)
POST /analyze/diarize        - Speaker diarization (pyannote timestamps)
POST /analyze/speakers       - Speaker audio separation (pyannote speech-separation)
POST /analyze/reference      - Extract RemixFeatures from reference track (≤30s)
```

If ADR is deferred, Sprint 4 will implement internal BullMQ jobs and S3 outputs without exposing new public routes.

### New DTOs (packages/types/src)

```typescript
// NOTE: DTOs must be defined as Zod schemas in @bluebird/types and exported types inferred from them.
// Avoid raw interfaces in production code.

// Source Separation
// Zod schema: SeparationRequestSchema
// export type SeparationRequest = z.infer<typeof SeparationRequestSchema>
// Includes: audioUrl (presigned S3 URL), mode ('vocals' | '4stem' | '6stem'), quality ('fast' | 'balanced' | 'best')

// Zod schema: SeparationResultSchema
// export type SeparationResult = z.infer<typeof SeparationResultSchema>
// Includes: jobId, stems (vocals/drums/bass/other; piano/guitar for 6stem), processingTime, metadata (duration/sampleRate/channels)

// Speaker Diarization
// Zod schema: DiarizationRequestSchema
// export type DiarizationRequest = z.infer<typeof DiarizationRequestSchema>
// Includes: audioUrl, mode ('timestamps' | 'separation'), minSpeakers?, maxSpeakers?

// Zod schema: DiarizationResultSchema
// export type DiarizationResult = z.infer<typeof DiarizationResultSchema>
// Includes: jobId, speakers [{ speakerId, segments [{ start, end, confidence }], audioUrl? }], totalSpeakers, processingTime

// Reference Feature Extraction (for future Remix)
// Zod schema: ReferenceAnalysisRequestSchema (enforce ≤30s)
// Zod schema: ReferenceFeaturesSchema (key, bpm, contour, rhythm, duration, checksum)
```

### Inference Pods (locations)

Pods must live in the Python monorepo `bluebird-infer/` (see §1). Do not create Python pods inside the Node monorepo.

```
bluebird-infer/
└── pods/
  ├── separation/          # NEW: Demucs-based separation pod
  │   ├── Dockerfile
  │   ├── handler.py
  │   ├── requirements.txt
  │   └── models/          # Demucs model cache
  └── diarization/         # NEW: pyannote diarization pod
    ├── Dockerfile
    ├── handler.py
    ├── requirements.txt
    └── models/          # pyannote model cache
```

---

## Daily Breakdown

### Week 1: Source Separation Foundation

#### Day 1: Setup & Demucs Pod Scaffold

- [ ] Create `packages/inference-pods/separation-pod/` structure
- [ ] Write Dockerfile with PyTorch 2.1 + CUDA 12.1 base
- [ ] Add Demucs dependencies to requirements.txt
- [ ] Implement basic handler.py with model loading
- [ ] Pre-download htdemucs model in Docker build
- [ ] Test local Docker build
- [ ] **Deliverable**: Docker image builds successfully, loads model

#### Day 2: Demucs Processing Logic

- [ ] Implement 4-stem separation in handler.py
- [ ] Add support for `--two-stems=vocals` mode
- [ ] Handle segment processing for long files (>5min)
- [ ] Add error handling for corrupt/unsupported audio
- [ ] Write unit tests for audio processing
- [ ] **Deliverable**: Pod processes test audio files locally

#### Day 3: Runpod Integration & S3 Upload

- [ ] Add Runpod serverless handler wrapper
- [ ] Implement S3 upload for separated stems
- [ ] Follow storage pattern: `projects/{projectId}/takes/{takeId}/analysis/separation/{jobId}/`
- [ ] Add idempotency key handling
- [ ] Configure OTEL attributes (jobId, projectId, seed)
- [ ] Deploy to Runpod dev environment
- [ ] **Deliverable**: End-to-end test via Runpod API succeeds

#### Day 4: API Route for Separation

- [ ] Add new DTO Zod schemas to `packages/types/src/analysis.ts` and update OpenAPI snapshot
- [ ] Create `apps/api/src/routes/analyze/separate.ts`
- [ ] Implement POST /analyze/separate with Zod validation (AFTER ADR approval)
- [ ] Add BullMQ job creation for 'analysis' queue
- [ ] Require Idempotency-Key header
- [ ] Add SSE progress updates via /jobs/:jobId/events
- [ ] **Deliverable**: API accepts requests and enqueues jobs

#### Day 5: Integration Testing & Quality Check

- [ ] Write integration test: upload audio → separate → verify stems
- [ ] Test with various audio formats (MP3, WAV, M4A)
- [ ] Validate processing times (target: <60s for 5min audio)
- [ ] Test error cases (corrupted files, oversized files)
- [ ] Load test with 10 concurrent requests
- [ ] **Checkpoint**: Review quality of separated stems
- [ ] **Decision Point**: If quality insufficient, evaluate BS-Roformer upgrade

---

### Week 2: Speaker Diarization & Integration

#### Day 6: Diarization Pod Scaffold

- [ ] Create `packages/inference-pods/diarization-pod/` structure
- [ ] Write Dockerfile (PyTorch base + pyannote.audio)
- [ ] Fix onnxruntime-gpu dependency issue
- [ ] Add Hugging Face token handling for model access
- [ ] Pre-download pyannote/speaker-diarization-3.1 model
- [ ] Test local Docker build
- [ ] **Deliverable**: Docker image builds, loads pyannote pipeline

#### Day 7: Diarization Processing Logic

- [ ] Implement timestamp-only diarization in handler.py
- [ ] Add speaker counting and segment extraction
- [ ] Handle variable speaker counts (2-10 speakers)
- [ ] Add confidence scoring per segment
- [ ] Write unit tests for diarization logic
- [ ] **Deliverable**: Pod identifies speakers in test audio

#### Day 8: Speaker Audio Separation (Optional Advanced)

- [ ] Evaluate need for pyannote speech-separation pipeline
- [ ] If needed: implement separate WAV export per speaker
- [ ] Add S3 upload for per-speaker tracks
- [ ] Handle overlapping speech scenarios
- [ ] **Deliverable**: Per-speaker audio files or skip if timestamp-only sufficient

#### Day 9: API Routes & Combined Pipeline

- [ ] Add diarization DTO Zod schemas to `packages/types/src/analysis.ts`
- [ ] Create `apps/api/src/routes/analyze/diarize.ts`
- [ ] Implement POST /analyze/diarize with Zod validation (AFTER ADR approval)
- [ ] Add BullMQ job for 'diarization' queue
- [ ] **(Stretch)** Implement combined pipeline endpoint (AFTER ADR approval):
  - POST /analyze/vocals-by-speaker
  - Chain: Demucs vocals → pyannote diarization → per-speaker tracks
- [ ] **Deliverable**: Diarization API functional

#### Day 10: End-to-End Testing & Documentation

- [ ] Integration test: full separation + diarization pipeline
- [ ] Test reference feature extraction (for Remix prep)
- [ ] Validate S3 storage structure
- [ ] Write API documentation (OpenAPI schema updates)
- [ ] Create example usage guide for frontend team
- [ ] Performance benchmark report (processing times, costs)
- [ ] **Deliverable**: Sprint complete, ready for Sprint 5 integration

---

## Technical Architecture

### Storage Layout (S3)

```
projects/
  {projectId}/
    takes/
      {takeId}/
        analysis/
          separation/
            {jobId}/
              vocals.wav
              drums.wav
              bass.wav
              other.wav
              metadata.json
          diarization/
            {jobId}/
              speakers.json        # timestamp data
              speaker_00.wav       # if audio separation enabled
              speaker_01.wav
              metadata.json
          reference/
            {referenceId}/
              features.json        # RemixFeatures DTO
              checksum.txt
```

### Queue Configuration (BullMQ)

```typescript
// Use existing queues; do not add non-canonical names.
export const QUEUES = {
  plan: 'plan',
  analyze: 'analyze', // Use job names for separation/diarization within this queue
  melody: 'melody',
  synth: 'synth',
  vocal: 'vocal',
  mix: 'mix',
  check: 'check',
  export: 'export',
}

// Job names example within 'analyze': 'separate', 'diarize'
// Priority levels remain: pro > standard; include DLQ and idempotency key in job opts.
```

### Runpod Pod Specifications

| Pod                    | GPU | VRAM | Estimated Cost | Use Case                     |
| ---------------------- | --- | ---- | -------------- | ---------------------------- |
| separation-pod         | A10 | 24GB | $0.076/min     | Production source separation |
| diarization-pod        | L4  | 24GB | $0.050/min     | Production diarization       |
| combined-pod (stretch) | A10 | 24GB | $0.076/min     | Unified MVP deployment       |

---

## Dependencies & Risks

### External Dependencies

- Hugging Face account + token (free, required for pyannote models)
- Runpod serverless GPU availability (A10/L4 tier)
- ffmpeg for audio format conversion

### Technical Risks

| Risk                               | Impact | Mitigation                                           |
| ---------------------------------- | ------ | ---------------------------------------------------- |
| pyannote CPU bottleneck            | High   | Select Runpod instances with 8+ vCPUs                |
| Cold start latency (30-60s)        | Medium | Pre-download models in Docker, maintain warm workers |
| VRAM OOM on long files             | Medium | Implement chunked processing with overlap windows    |
| Overlapping speech accuracy        | Low    | Use speech-separation pipeline if needed             |
| BS-Roformer quality upgrade needed | Medium | Audio-Separator already wraps it, easy swap          |

### Timeline Risks

- **Day 5 quality checkpoint**: If Demucs quality insufficient, may need 1-2 days to integrate BS-Roformer
- **Day 8 speech separation**: Complex feature, consider deferring to Sprint 5 if timestamp-only sufficient

---

## Testing Strategy

### Unit Tests (Vitest)

- Audio format validation
- S3 upload/download helpers
- DTO schema validation
- Error handling (corrupt files, timeouts)

### Integration Tests (Testcontainers)

- End-to-end: upload → separate → verify stems
- End-to-end: upload → diarize → verify speaker count
- Queue processing with BullMQ

### Manual QA

- Test audio samples: music (4-stem), podcast (2-4 speakers), mixed (music + dialogue)
- Verify stem quality (no artifacts, proper isolation)
- Validate speaker identification accuracy
- Check S3 file organization

### Performance Benchmarks

- Demucs: 1min, 3min, 5min audio files (measure GPU time)
- pyannote: 10min, 30min, 60min recordings (measure DER)
- Cost per job calculation

---

## Future Sprint Connections

### Sprint 5: Remix Reference Integration

- Use `/analyze/reference` endpoint to extract features from user uploads
- Store `RemixFeatures` for similarity checking
- Integrate with existing Remix flow (F-MVP-REF-01)

### Sprint 6+: Advanced Use Cases

- Multi-track vocal production (separate lead, harmonies, ad-libs)
- Podcast editing (auto-split speakers for mixing)
- Sample isolation (extract specific instruments from reference)
- Karaoke track generation (remove vocals, keep instrumental)

---

## Definition of Done

- [ ] All API endpoints return typed responses validated by Zod
- [ ] Docker images deploy successfully to Runpod serverless
- [ ] Integration tests pass with >90% success rate
- [ ] S3 storage follows documented pattern
- [ ] API documentation updated in OpenAPI schema
- [ ] Performance meets targets (<60s for 5min separation, <30% DER for diarization)
- [ ] No blocking bugs in production deployment
- [ ] Handoff document created for frontend team

---

## Resources

### Documentation

- [Demucs GitHub](https://github.com/adefossez/demucs)
- [pyannote.audio](https://github.com/pyannote/pyannote-audio)
- [pyannote Models (HF)](https://huggingface.co/pyannote)
- [Runpod Serverless Docs](https://docs.runpod.io/serverless/overview)

### Code References

- Existing inference pod pattern: `bluebird-infer/pods/*`
- Existing API route pattern: `apps/api/src/routes/render/`
- Existing queue setup: `packages/queue/src/workers/`

---

## Open Questions

1. **Combined pod vs separate pods**: Start with unified A10 pod or immediately split separation/diarization?
   - **Recommendation**: Start unified for MVP, split in Sprint 5 when scaling needs clarify

2. **Speaker audio separation necessity**: Do we need per-speaker WAV files or just timestamps?
   - **Recommendation**: Start with timestamps-only, add audio separation if user research shows demand

3. **Reference feature extraction scope**: Extract only for Remix or support general analysis?
   - **Recommendation**: Build for Remix, expose as general endpoint for future flexibility

4. **Quality vs speed tradeoff**: htdemucs (fast) vs htdemucs_ft/roformer (slow but better)?
   - **Recommendation**: Default to htdemucs, add quality tier parameter for future paid features

---

## Post-Sprint Review Items

- Actual vs estimated processing times
- GPU cost per job type
- User feedback on stem/speaker quality
- Infrastructure scaling observations
- Lessons learned for Sprint 5 Remix integration
