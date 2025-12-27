# Sprint 3 Progress Checklist

**Last Updated:** December 23, 2025
**Progress:** ~55-60% Complete

Quick checklist for tracking Sprint 3 completion. Detailed task breakdown in [SPRINT_3_REMAINING_TASKS.md](SPRINT_3_REMAINING_TASKS.md).

---

## Infrastructure & Foundation ✅ COMPLETE

- [x] bluebird-infer repo created with Poetry
- [x] Docker setup (Dockerfile.base, Dockerfile.analyzer, etc.)
- [x] docker-compose.pods.yml for local development
- [x] bbcore library (S3, audio, config, logging)
- [x] bbfeatures library (key/BPM/n-gram detection)
- [x] bbmelody library (chord utils, generator, MIDI/F0)
- [x] Test suite with 64% coverage

---

## Pods (3 of 5 Complete) 🔄

### Analyzer Pod ✅

- [x] FastAPI service on port 8001
- [x] Key detection endpoint
- [x] BPM detection endpoint
- [x] librosa integration
- [x] Health check

### Music Pod ✅

- [x] FastAPI service on port 8002
- [x] Procedural drums/bass/guitar synthesis
- [x] Grid alignment with seed determinism
- [x] Stem selection (drums/bass/guitar)
- [x] Health check

### Melody Pod ✅

- [x] FastAPI service on port 8003
- [x] Syllable-to-melody generation
- [x] Chord progression support
- [x] Contour guidance
- [x] MIDI and F0 output
- [x] Grid quantization

### Voice Pod ⏳ IN PROGRESS

- [ ] FastAPI service on port 8004
- [ ] DiffSinger model loading
- [ ] Phoneme alignment
- [ ] Multi-speaker support
- [ ] F0 curve input
- [ ] Health check

### Similarity Pod ⏳ IN PROGRESS

- [ ] FastAPI service on port 8005
- [ ] N-gram Jaccard similarity
- [ ] DTW rhythm comparison
- [ ] 8-bar clone detection
- [ ] Verdict logic (pass/borderline/block)
- [ ] Recommendations generator
- [ ] Health check

---

## API Integration (Node ↔ Python) ⏳

### Workers

- [ ] music-worker.ts → music pod integration
- [ ] melody-worker.ts → melody pod (NEW)
- [ ] voice-worker.ts → melody + voice pods
- [ ] analyzer-worker.ts → analyzer pod (NEW)
- [ ] similarity-worker.ts → similarity pod (NEW)

### Utilities

- [ ] Pod client wrapper (pods.ts)
- [ ] Retry logic + timeout handling
- [ ] Structured logging for pod calls

### Testing

- [ ] Integration tests with real pods
- [ ] TTFP measurement
- [ ] Section regen measurement

---

## Reference & Remix Features ⏳

### Endpoints

- [ ] POST /remix/reference/upload (≤30s validation)
- [ ] POST /remix/melody (with similarity budget)
- [ ] Feature extraction workflow
- [ ] Similarity check workflow

### Storage

- [ ] Reference audio → S3
- [ ] Features JSON → S3
- [ ] Raw audio deletion (GDPR)

---

## Export Gating ⏳

### Backend

- [ ] Similarity verdict check in /export
- [ ] Block export if verdict = "block"
- [ ] Warning if verdict = "borderline"
- [ ] Pro user override with audit log

### Frontend

- [ ] Export modal similarity display
- [ ] Recommendations UI
- [ ] Regenerate button

### Audit

- [ ] Audit log table in Prisma
- [ ] Log export attempts
- [ ] Log Pro overrides
- [ ] GET /audit/exports endpoint

---

## Performance & Testing ⏳

### Performance

- [ ] TTFP P50 ≤45s (real models)
- [ ] Section regen P50 ≤20s
- [ ] GPU cost ≤$0.40 per 30s preview
- [ ] Performance report updated

### Testing

- [ ] Pod contract tests
- [ ] Golden similarity fixtures (20+ pairs)
- [ ] E2E workflow tests
- [ ] Test coverage ≥70%

---

## Documentation 📝

### Pod Documentation

- [ ] Voice pod README with API examples
- [ ] Similarity pod README with verdict logic
- [ ] OpenAPI spec for all pods

### User-Facing

- [ ] Remix feature guide
- [ ] Similarity checking explanation
- [ ] Export gating user docs

---

## Quick Status Dashboard

| Component         | Status | Priority | Blocking |
| ----------------- | ------ | -------- | -------- |
| Voice Pod         | ⏳ 0%  | CRITICAL | Export   |
| Similarity Pod    | ⏳ 0%  | CRITICAL | Export   |
| API Integration   | ⏳ 0%  | HIGH     | Testing  |
| Remix Endpoints   | ⏳ 0%  | HIGH     | E2E      |
| Export Gating     | ⏳ 0%  | HIGH     | Release  |
| Performance Tests | ⏳ 0%  | HIGH     | Release  |

---

## Next Action Items

**This Week (Immediate):**

1. ⚡ Start Voice Pod (DiffSinger research & setup)
2. ⚡ Start Similarity Pod skeleton in parallel
3. Review golden fixture requirements

**Next Week:**

1. Complete Voice Pod integration
2. Complete Similarity Pod implementation
3. Begin API worker integration

**Week After:**

1. Reference upload & remix endpoints
2. Export gating logic
3. Performance validation
4. Integration testing

---

## Release Criteria for v0.4.0

Sprint 3 can ship when:

- [ ] All 5 pods operational and tested
- [ ] Node workers call Python pods successfully
- [ ] Reference upload → remix melody → similarity check works E2E
- [ ] Export gating enforces similarity verdict
- [ ] TTFP P50 ≤45s
- [ ] Section regen P50 ≤20s
- [ ] Test coverage ≥70%
- [ ] User workflow validated in E2E tests

---

**Ready to begin!** Start with Voice Pod (highest risk) while building Similarity Pod in parallel.
