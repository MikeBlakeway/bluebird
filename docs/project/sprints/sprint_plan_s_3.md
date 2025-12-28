# Sprint 3: Real Model Integration & Advanced Features (DiffSinger Edition)

**Sprint Duration:** 3–4 weeks (January 2026)

**Sprint Version:** v0.4.0 (Revised for DiffSinger)

**Sprint Goal:** Replace placeholder stubs with open-source models (zero-cost MVP), implement DiffSinger for true singing synthesis, add reference-guided remix with similarity checking, and achieve production-ready performance targets.

**Inference Strategy:**

- **Separate repo** (`bluebird-infer`): Python FastAPI pods, Docker containers
- **Cost**: Zero (all open-source, self-hosted)
- **Models**:
  - **DiffSinger** (singing voice synthesis - OpenVPI fork)
  - **Procedural synthesis** (music - drums/bass/guitar)
  - **librosa** (feature extraction - key/BPM/contour)
  - **Pure logic** (similarity checking - n-gram Jaccard)
- **Determinism**: All inference seeded for reproducibility
- **Quality**: True singing (melodic, pitch-accurate) not speech

**Success Metrics:**

- Singing voice synthesis working with DiffSinger (melodic, not speech-like)
- Feature extraction via librosa (key, BPM, contour, onset detection)
- Remix reference upload + feature extraction end-to-end
- Similarity checker with golden fixtures and hard rules
- Per-section regen ≤20s P50 (realistic, not stubs)
- TTFP P50 ≤45s (measured with real audio)
- All test coverage ≥70%
- User workflow: upload reference → remix melody → check similarity → export or iterate

---

## Inference Architecture

```bash
bluebird/ (Node/TS, main repo)
  apps/api/src/lib/workers/
    ├── music-worker.ts (enqueue music synthesis job)
    ├── voice-worker.ts (enqueue voice synthesis job)
    ├── melody-worker.ts (NEW: generate melody from lyrics/chords)
    ├── analyzer-worker.ts (feature extraction job)
    └── similarity-worker.ts (similarity checking job)

bluebird-infer/ (Python, separate repo)
  pyproject.toml (Poetry)
  libs/
    ├── bbcore/ (shared: S3 client, logging, config, audio I/O)
    ├── bbfeatures/ (librosa-based: key extraction, BPM detection, n-gram generation)
    └── bbmelody/ (NEW: melody generation, phoneme alignment)
  pods/
    ├── music/ (FastAPI)
    │   ├── app.py (procedural drum/bass/guitar synth; deterministic seed)
    │   ├── synthesizer.py (core procedural logic)
    │   └── requirements.txt
    ├── voice/ (FastAPI) **CHANGED TO DIFFSINGER**
    │   ├── app.py (DiffSinger wrapper; seed for determinism)
    │   ├── speaker_loader.py (multi-speaker support)
    │   ├── phoneme_aligner.py (NEW: align phonemes to music grid)
    │   └── requirements.txt
    ├── melody/ (FastAPI) **NEW POD**
    │   ├── app.py (generate melody from ArrangementSpec)
    │   ├── melody_generator.py (procedural melody composition)
    │   └── requirements.txt
    ├── analyzer/ (FastAPI)
    │   ├── app.py (librosa-based feature extraction)
    │   ├── feature_extractor.py (key, BPM, contour, IOI)
    │   └── requirements.txt
    └── similarity/ (FastAPI)
        ├── app.py (n-gram Jaccard, DTW, hard rules)
        ├── similarity_checker.py (core logic)
        └── requirements.txt
```

---

## Model Choices & Rationale (Updated)

| Component              | Model/Library                           | Why                                                       | Notes                                      |
| ---------------------- | --------------------------------------- | --------------------------------------------------------- | ------------------------------------------ |
| **Music Synth**        | Procedural (drums/bass/guitar patterns) | Fast (1–2s), deterministic, full control                  | Can upgrade later if needed                |
| **Voice Synth**        | **DiffSinger (OpenVPI fork)**           | True singing, high quality, zero cost, active maintenance | Requires melody/pitch input                |
| **Melody Generator**   | **Procedural (rule-based)**             | Simple, fast, deterministic                               | Uses chord progressions + contour guidance |
| **Feature Extract**    | **librosa** (scipy-based)               | Industry standard, free, works great                      | Key detection, BPM, onset tracking         |
| **Similarity Checker** | Pure logic (n-gram Jaccard, DTW)        | No model needed, deterministic                            | Hand-validated with golden fixtures        |

---

## Sprint Context (Updated)

**What We Have (Sprint 0–2):**

- ✅ Backend: Queue system, SSE streaming, BullMQ workers
- ✅ API: All endpoints implemented (/plan, /render, /remix, /check/similarity, /mix, /export)
- ✅ Frontend: Workspace UI, WebAudio preview, SSE client, section lock/regen, A/B compare
- ✅ Database: Full schema with projects, takes, sections, jobs, artifacts
- ✅ Integration tests: Plan flow, preview flow, export flow
- ✅ Performance baseline: TTFP ~42s (with stubs); target ≤45s with real models

**What We Need (Sprint 3):**

- ⭕ Feature extraction pod (analyzer): librosa-based key/BPM/contour extraction
- ⭕ Music synthesis pod: Procedural drum/bass/guitar generator with seed control
- ⭕ **Melody generation pod**: Convert lyrics+chords to MIDI/F0 curves
- ⭕ **Voice synthesis pod**: DiffSinger wrapper with multi-speaker + phoneme alignment
- ⭕ Similarity checker pod: N-gram Jaccard + DTW implementation with golden fixtures
- ⭕ Reference upload endpoint: Accept ≤30s audio, enqueue feature extraction
- ⭕ Remix endpoint: Enqueue remix job (melody guidance from reference features)
- ⭕ Export gating: Check similarity verdict before allowing export
- ⭕ Performance validation: Measure TTFP and section regen with real models

---

## Epic Breakdown (Updated)

### E3.0 — Inference Repo Setup (Priority: CRITICAL, Start Here)

**Goal:** Create `bluebird-infer` repo structure and shared utilities.

**Stories:**

- S3.0.1: Create GitHub repo (`bluebird-infer`), Poetry pyproject.toml, Dockerfile.base (Python 3.8 + FFmpeg)
- S3.0.2: Implement `libs/bbcore/` (S3 client wrapper, audio I/O, config, logging)
- S3.0.3: Implement `libs/bbfeatures/` (librosa-based feature extraction, n-gram generation)
- S3.0.4: **NEW**: Implement `libs/bbmelody/` (melody generation utilities, MIDI/F0 conversion)
- S3.0.5: Set up local Docker Compose for all pods + shared volumes
- S3.0.6: Define pod API contract (JSON request/response schemas, OpenAPI spec)

**Acceptance Criteria:**

- GitHub repo created and documented
- Poetry works for local dev and Docker builds
- S3 client + audio I/O utilities tested
- Feature extraction core logic (librosa integration) working
- Melody generation utilities implemented
- Pod API contracts defined and versioned

---

### E3.1 — Feature Extraction Pod (Priority: CRITICAL)

**Goal:** Build analyzer pod using librosa for key, BPM, contour, onset detection.

**Stories:** _(Same as before)_

- S3.1.1: Analyzer pod setup (FastAPI app, librosa dependencies)
- S3.1.2: Key detection (chroma-based, 12 semitones)
- S3.1.3: BPM and onset detection (tempogram + peak picking)
- S3.1.4: Melody contour extraction (pitch tracking via piptrack or pyin)
- S3.1.5: N-gram generation (3–5 gram intervals for similarity comparison)
- S3.1.6: HTTP endpoint: `POST /extract` (accept audio file, return RemixFeatures JSON)
- S3.1.7: Test with golden fixtures (known audio → validated key/BPM/contour)

**Estimate:** 12–14 hours _(increased from 8-10h for robustness)_

**Acceptance Criteria:**

- Analyzer pod running in Docker
- Feature extraction accurate (matches human ear for key/BPM)
- RemixFeatures schema complete and validated
- Deterministic (same audio, same features every time)
- Performance: <5s per 30s audio on CPU
- Golden fixtures for validation
- Edge case handling (mono/stereo, extreme BPM, noise)

---

### E3.2 — Music Synthesis Pod (Priority: CRITICAL)

**Goal:** Implement procedural music synthesis for drums, bass, guitar.

**Stories:** _(Same as before)_

- S3.2.1: Procedural synth core (deterministic waveform generation with seed)
- S3.2.2: Seed-driven randomization (same seed → identical output)
- S3.2.3: HTTP endpoint: `POST /synthesize` (accept ArrangementSpec + section + seed, return WAV)
- S3.2.4: Grid alignment (samples at exact BPM boundaries, no drift)
- S3.2.5: Multi-stem output (drums, bass, guitar as separate tracks)
- S3.2.6: Performance optimization (target: ≤2s per section on CPU)

**Estimate:** 10–12 hours

**Acceptance Criteria:**

- Procedural synth generates valid WAV (48kHz, 24-bit, grid-aligned)
- Per-section isolation: same section + seed = identical output
- Performance: ≤2s per section
- Multi-stem stems align perfectly in mix
- API contract tested with golden audio fixtures

---

### E3.3 — Melody Generation Pod (Priority: CRITICAL) **NEW**

**Goal:** Generate melodic contours from lyrics + chord progressions for DiffSinger input.

**Stories:**

- S3.3.1: Melody pod setup (FastAPI app, MIDI/F0 utilities)
- S3.3.2: Procedural melody generator
  - Takes: lyrics (syllable count), key, chords, genre, contour guidance (optional)
  - Outputs: MIDI note sequence OR F0 pitch curve (Hz over time)
  - Uses: chord tones, scale degrees, rhythmic patterns, seed-driven variation
- S3.3.3: Syllable-to-note mapping (align lyric syllables to melody notes)
- S3.3.4: Contour guidance integration (when remixing, bias toward reference contour)
- S3.3.5: HTTP endpoint: `POST /generate-melody`
  - Input: `{ lyrics, key, bpm, chords, genre, seed, referenceContour? }`
  - Output: `{ melody: [{ pitch, duration, syllable }], midiFile }`
- S3.3.6: Seed-driven determinism (same inputs + seed = identical melody)
- S3.3.7: Genre-specific patterns (blues pentatonic, pop stepwise motion, etc.)
- S3.3.8: Golden fixtures (known inputs → validated melodies)

**Estimate:** 12–15 hours

**Acceptance Criteria:**

- Melody generator produces valid MIDI/F0 curves
- Syllables correctly aligned to notes
- Genre patterns distinguishable (blues vs pop)
- Deterministic with seed
- Contour guidance works (biases melody toward reference shape)
- Performance: <2s per section
- Golden fixtures for validation

**Technical Notes:**

```python
# Example melody generation logic
def generate_melody(lyrics, key, chords, seed, reference_contour=None):
    """
    Procedural melody generation

    Args:
        lyrics: ["Hel", "lo", "world", "how", "are", "you"]
        key: "C major"
        chords: ["C", "Am", "F", "G"]
        seed: 42
        reference_contour: [0, 2, 1, -1, 0, 2] (optional, for remix)

    Returns:
        melody: [
            {"pitch": "C4", "duration": 0.5, "syllable": "Hel"},
            {"pitch": "D4", "duration": 0.5, "syllable": "lo"},
            ...
        ]
    """
    rng = np.random.default_rng(seed)
    scale = get_scale_notes(key)  # [C, D, E, F, G, A, B]

    melody = []
    for i, syllable in enumerate(lyrics):
        # Get chord tones for current position
        chord_index = (i * len(chords)) // len(lyrics)
        chord_tones = get_chord_tones(chords[chord_index], scale)

        # If reference contour provided, bias pitch toward it
        if reference_contour:
            target_interval = reference_contour[i % len(reference_contour)]
            pitch = select_pitch_near_interval(chord_tones, target_interval, rng)
        else:
            # Default: favor chord tones, occasional passing tones
            pitch = rng.choice(chord_tones, p=[0.5, 0.3, 0.2])

        duration = assign_duration(syllable, bpm, rng)

        melody.append({
            "pitch": pitch,
            "duration": duration,
            "syllable": syllable
        })

    return melody
```

---

### E3.4 — Voice Synthesis Pod (DiffSinger) (Priority: CRITICAL) **UPDATED**

**Goal:** Integrate DiffSinger for true singing voice synthesis (not speech).

**Stories:**

- S3.4.1: DiffSinger setup and environment
  - Clone OpenVPI DiffSinger fork
  - Install dependencies (PyTorch 1.9.0, specific versions)
  - Download pretrained models (English/Chinese speakers)
  - Test inference with sample MIDI + lyrics
- S3.4.2: Speaker roster management (3–5 built-in speakers for MVP)
  - Load pretrained voice models
  - Speaker metadata (range, timbre, sweet spot genres)
  - Audio preview generation for each speaker
- S3.4.3: Phoneme alignment system
  - Convert lyrics to phonemes (G2P)
  - Align phonemes to melody notes
  - Duration prediction (how long each phoneme lasts)
  - Sync to music grid (±50ms tolerance)
- S3.4.4: Melody-to-F0 conversion
  - Convert MIDI notes to F0 pitch curve (Hz over time)
  - Smooth pitch transitions (vibrato, portamento optional)
  - Handle pitch bends and expression
- S3.4.5: HTTP endpoint: `POST /synthesize`
  - Input: `{ vocalScore, sectionIndex, speakerId, melody, seed }`
  - Output: `{ voiceUrl, duration_ms, alignment_error }`
  - Error handling (invalid melody, phoneme mismatch, GPU timeout)
- S3.4.6: Seed-driven inference (control randomness for determinism)
- S3.4.7: Audio quality validation
  - Output 48kHz, 24-bit, no clipping
  - Pitch accuracy (MIDI note vs synthesized pitch)
  - Syllable timing (aligned to music grid)
- S3.4.8: Performance optimization
  - Target: ≤8s per section on GPU, ≤15s on CPU
  - Profile DiffSinger inference stages
  - Batch processing if possible

**Estimate:** 14–18 hours _(increased due to complexity)_

**Acceptance Criteria:**

- DiffSinger generates melodic singing (not speech-like)
- Multiple speakers produce distinct timbres
- Pitch accuracy within ±20 cents (human perception threshold)
- Syllable alignment to music grid within ±50ms
- Deterministic with seed (same input + seed = identical output)
- Performance: ≤8s P50 per section on GPU
- Golden audio fixtures for quality validation (compare to reference singing)

**Technical Notes:**

```python
# DiffSinger API wrapper
def synthesize_singing(lyrics, melody, speaker_id, seed):
    """
    DiffSinger synthesis

    Args:
        lyrics: "Hello world"
        melody: [{"pitch": "C4", "duration": 0.5, "syllable": "Hel"}, ...]
        speaker_id: "speaker_female_pop"
        seed: 42

    Returns:
        audio: np.ndarray (48kHz samples)
    """
    # 1. Lyrics to phonemes
    phonemes = g2p.convert(lyrics)  # ["HH", "EH", "L", "OW", ...]

    # 2. Align phonemes to melody notes
    ph_dur = align_phonemes_to_notes(phonemes, melody)  # [(ph, dur), ...]

    # 3. Convert melody to F0 curve
    f0_curve = melody_to_f0(melody, sample_rate=48000)

    # 4. DiffSinger inference
    set_seed(seed)
    mel_spectrogram = diffsinger_model.synthesize(
        phonemes=phonemes,
        durations=ph_dur,
        f0=f0_curve,
        speaker_id=speaker_id
    )

    # 5. Vocoder (NSF-HiFiGAN)
    audio = vocoder.synthesize(mel_spectrogram)

    return audio
```

---

### E3.5 — Reference Upload & Feature Extraction (Priority: HIGH)

**Goal:** Accept user reference audio (≤30s) and extract features for remix guidance.

**Stories:** _(Same as before)_

- S3.5.1: Reference upload endpoint (`POST /remix/reference/upload`)
- S3.5.2: Enqueue analyzer job for feature extraction
- S3.5.3: Frontend reference upload UI
- S3.5.4: Error handling

**Estimate:** 5–6 hours

**Acceptance Criteria:**

- Reference upload validates ≤30s, correct codec
- Feature extraction async and cached
- Frontend provides clear feedback
- API contract tested end-to-end

---

### E3.6 — Remix Melody (Similarity-Guarded) (Priority: HIGH)

**Goal:** Generate melodies guided by reference features; integrate similarity checking.

**Stories:**

- S3.6.1: Remix worker enqueue (load reference features, pass to melody generation)
- S3.6.2: Melody generation logic with contour guidance
  - Use reference key/BPM as anchor
  - Generate contour biased toward reference intervals
  - Apply similarity budget (0 = max originality, 1 = closer to reference)
  - Seed-driven for reproducibility
- S3.6.3: HTTP endpoint: `POST /remix/melody` (accept reference features + section + budget, return melody JSON)
- S3.6.4: Per-section regeneration (regen only unlocked sections, preserve locked melodies)
- S3.6.5: Pro tier gating (Free: budget=0, Pro: budget user-controllable)

**Estimate:** 8–10 hours

**Acceptance Criteria:**

- Remix endpoint accepts reference features + budget
- Melody contour generated and stored
- Per-section isolation maintained
- Budget slider affects output (qualitative: budget=0 → max diversity, budget=1 → closer to reference)
- Golden fixtures for melody comparison

---

### E3.7 — Similarity Checking & Export Gating (Priority: CRITICAL)

**Goal:** Detect if melody is too close to reference; block export if verdict=block.

**Stories:** _(Same as before)_

- S3.7.1: N-gram Jaccard implementation (interval-based melody similarity)
- S3.7.2: DTW rhythm similarity (dynamic time warping)
- S3.7.3: Combined scoring (melody: 60%, rhythm: 40%)
- S3.7.4: Hard rule (8+ consecutive bars identical → verdict=block, override score)
- S3.7.5: HTTP endpoint: `POST /check/similarity`
- S3.7.6: Export gating (`POST /export`)
- S3.7.7: Frontend verdict display
- S3.7.8: **NEW**: Threshold calibration with labeled dataset (50+ melody pairs)

**Estimate:** 11–13 hours _(increased for threshold calibration)_

**Acceptance Criteria:**

- N-gram Jaccard matches hand-computed reference scores (golden fixtures)
- DTW rhythm score correlates with perceived similarity
- Hard rule triggers correctly
- Export endpoint rejects block verdict
- Frontend shows clear recommendations
- Thresholds calibrated against human judgments
- Audit trail logged

---

### E3.8 — Performance Measurement (Priority: HIGH)

**Goal:** Measure TTFP and per-section regen with real models; identify bottlenecks.

**Stories:** _(Same as before, but add melody pod)_

- S3.8.1: TTFP measurement harness (plan → melody → music → voice → mix)
- S3.8.2: Section regen measurement
- S3.8.3: Cache hit analysis
- S3.8.4: Bottleneck identification (which pod is slowest?)
- S3.8.5: Performance regression tests in CI

**Estimate:** 6–8 hours

**Acceptance Criteria:**

- TTFP P50 ≤45s with real models (measured)
- Section regen P50 ≤20s (measured)
- Bottleneck identified (DiffSinger? melody? music?)
- Performance metrics tracked and trending
- CI tests in place

---

### E3.9 — Quality Validation & Early Checkpoint (Priority: HIGH) **NEW**

**Goal:** Validate DiffSinger singing quality meets "proof of concept" bar.

**Stories:**

- S3.9.1: Generate 10 test songs with DiffSinger (various genres, speakers)
- S3.9.2: Stakeholder listening session
  - Compare to: (a) procedural stubs, (b) speech TTS, (c) commercial examples
  - Rate on scale: 1=robotic, 5=acceptable MVP, 10=indistinguishable from real
- S3.9.3: Quality metrics
  - Pitch accuracy (MIDI vs synthesized)
  - Syllable alignment (timing errors)
  - Naturalness (MOS score)
- S3.9.4: **Decision point (Day 5)**:
  - If quality ≥5/10 → proceed with DiffSinger
  - If quality <5/10 → fallback to speech TTS (accept limitations)
- S3.9.5: Document quality issues and improvement roadmap (Sprint 4+)

**Estimate:** 6–8 hours

**Acceptance Criteria:**

- 10 test songs generated across genres
- Quality rated by ≥3 stakeholders
- Average rating ≥5/10 (acceptable MVP)
- Decision documented (go/no-go)
- Quality issues tracked for future improvements

---

### E3.10 — Testing & Documentation (Priority: MEDIUM)

**Goal:** Comprehensive tests, golden fixtures, and user/developer docs.

**Stories:** _(Same as before, plus melody pod)_

- S3.10.1: Golden fixtures for all pods (including melody generator)
- S3.10.2: Integration tests (end-to-end reference upload → remix → similarity → export)
- S3.10.3: API contract tests (OpenAPI snapshots, request/response validation)
- S3.10.4: Golden audio fixtures (known quality baselines for singing)
- S3.10.5: API documentation
- S3.10.6: User documentation (DiffSinger capabilities, limitations)
- S3.10.7: Developer documentation (DiffSinger setup, melody generation algorithm)

**Estimate:** 10–12 hours

**Acceptance Criteria:**

- ≥70% test coverage (new modules)
- Golden fixtures for similarity, features, audio, **melody**
- API docs auto-generated
- User guide covers all new features (including singing limitations)
- Developer guide for DiffSinger setup and troubleshooting

---

## Detailed Task Breakdown

### Week 1: Foundation + Music/Melody Pods

#### Task 3.0: Set Up `bluebird-infer` Repository (Shared Foundation)

**Estimate:** 5–6 hours _(increased for melody lib)_
**Priority:** P0 (unblocks all pod work)

**Subtasks:**

- [ ] Create GitHub repo: `bluebird/bluebird-infer`
- [ ] Initialize Poetry: `pyproject.toml` with Python 3.8, FFmpeg, torch, librosa, DiffSinger deps
- [ ] Create Docker setup:
  - [ ] `Dockerfile.base` (Python 3.8 + FFmpeg + system deps, multi-stage)
  - [ ] `docker-compose.yml` (all pods + volumes for S3 cache + logs)
- [ ] Implement `libs/bbcore/`:
  - [ ] S3 client wrapper (boto3, presigned URLs, streaming)
  - [ ] Audio I/O utilities (librosa, soundfile, WAV/MP3 handling)
  - [ ] Config management (env vars, logging)
  - [ ] Pytest setup
- [ ] Implement `libs/bbfeatures/`:
  - [ ] Librosa integration (key, BPM, onset detection)
  - [ ] N-gram generation (interval extraction, n-gram creation)
  - [ ] Tests for each feature (golden fixtures)
- [ ] **NEW**: Implement `libs/bbmelody/`:
  - [ ] MIDI/F0 conversion utilities
  - [ ] Phoneme alignment helpers
  - [ ] Syllable counting and mapping
  - [ ] Scale/chord theory utilities
- [ ] Define pod API contracts (OpenAPI/JSON schemas)
- [ ] Local development setup (README: how to run locally)

**Acceptance Criteria:**

- Repo created and publicly accessible
- Poetry builds successfully locally and in Docker
- S3 client, audio I/O, features, **melody utils** working with tests
- Docker Compose spins up all services
- Pod API contracts documented (request/response schemas)

**Files to Create:**

- `bluebird-infer/pyproject.toml`
- `bluebird-infer/Dockerfile.base`
- `bluebird-infer/docker-compose.yml`
- `bluebird-infer/libs/bbcore/` (package structure)
- `bluebird-infer/libs/bbfeatures/` (package structure)
- `bluebird-infer/libs/bbmelody/` (package structure) **NEW**
- `bluebird-infer/pods/` (directory structure, no apps yet)
- `bluebird-infer/README.md` (setup guide)

---

#### Task 3.1: Analyzer Pod (Feature Extraction with Librosa)

**Estimate:** 12–14 hours
**Priority:** P0 (blocks remix + similarity)

**Subtasks:** _(Same as before, but add edge case handling)_

- [ ] Set up analyzer pod structure
- [ ] Implement feature extraction:
  - [ ] Key detection (chroma-based, 12 semitones, confidence scoring)
  - [ ] BPM + onset detection (tempogram, peak picking)
  - [ ] Melody contour (pitch tracking: piptrack or pyin)
  - [ ] IOI grid (inter-onset intervals for rhythm)
  - [ ] N-gram generation (3–5 gram intervals)
- [ ] HTTP endpoint: `POST /extract`
- [ ] **NEW**: Edge case handling
  - [ ] Audio normalization/preprocessing
  - [ ] Mono vs stereo handling
  - [ ] Extreme BPM detection (40–240 range)
  - [ ] Confidence scoring (reject if confidence <0.7)
  - [ ] Noise/silence detection
- [ ] Create golden fixtures and tests
- [ ] Performance optimization (<5s per 30s audio)

**Acceptance Criteria:**

- Analyzer pod running in Docker
- Feature extraction accurate (key/BPM/contour validated)
- HTTP endpoint working with golden fixtures
- Deterministic (same audio → same features always)
- Performance: <5s per 30s audio
- Edge cases handled gracefully
- Tests passing with ≥80% coverage

**Files to Create:**

- `bluebird-infer/pods/analyzer/app.py`
- `bluebird-infer/pods/analyzer/feature_extractor.py`
- `bluebird-infer/pods/analyzer/test_analyzer.py`
- `bluebird-infer/pods/analyzer/Dockerfile`
- `bluebird-infer/pods/analyzer/requirements.txt`

---

#### Task 3.2: Music Synthesis Pod (Procedural)

**Estimate:** 10–12 hours
**Priority:** P0

**Subtasks:** _(Same as before)_

- [ ] Set up music pod structure
- [ ] Implement procedural synthesis (drums, bass, guitar/keys)
- [ ] Deterministic seed control
- [ ] Grid alignment (exact BPM boundaries)
- [ ] HTTP endpoint: `POST /synthesize`
- [ ] Audio quality validation (48kHz, 24-bit)
- [ ] Golden audio fixtures
- [ ] Performance optimization (≤2s per section)

**Acceptance Criteria:**

- Procedural synth generates valid WAV (48kHz, 24-bit, grid-aligned)
- Per-section isolation: same section + seed = identical output
- Performance: ≤2s per section
- Multi-stem output aligns perfectly in mix
- API contract tested with golden audio fixtures
- Tests passing with ≥80% coverage

**Files to Create:**

- `bluebird-infer/pods/music/app.py`
- `bluebird-infer/pods/music/synthesizer.py`
- `bluebird-infer/pods/music/test_music_synth.py`
- `bluebird-infer/pods/music/Dockerfile`
- `bluebird-infer/pods/music/requirements.txt`

---

#### Task 3.3: Melody Generation Pod (Procedural) **NEW**

**Estimate:** 12–15 hours
**Priority:** P0 (blocks voice synthesis)

**Subtasks:**

- [ ] Set up melody pod structure:
  - [ ] `pods/melody/app.py` (FastAPI)
  - [ ] `pods/melody/melody_generator.py` (core procedural logic)
  - [ ] `pods/melody/requirements.txt`
  - [ ] `pods/melody/Dockerfile`
- [ ] Implement procedural melody generator:
  - [ ] Scale/chord theory utilities (get notes in key, chord tones)
  - [ ] Syllable counting (from lyrics text)
  - [ ] Note selection algorithm:
    - [ ] Favor chord tones (50%), scale tones (30%), passing tones (20%)
    - [ ] Stepwise motion bias (avoid large leaps)
    - [ ] Rhythmic pattern assignment (quarter, eighth, etc.)
  - [ ] Genre-specific patterns:
    - [ ] Blues: pentatonic scale, blue notes
    - [ ] Pop: stepwise motion, hook repetition
    - [ ] Jazz: altered chords, chromatic passing tones
- [ ] Contour guidance integration:
  - [ ] Accept optional reference contour (from RemixFeatures)
  - [ ] Bias note selection toward reference intervals
  - [ ] Similarity budget control (how closely to follow reference)
- [ ] Syllable-to-note mapping:
  - [ ] Align lyric syllables to melody notes
  - [ ] Handle melisma (multiple notes per syllable)
  - [ ] Preserve prosody (stress patterns)
- [ ] HTTP endpoint: `POST /generate-melody`
  - [ ] Input: `{ lyrics, key, bpm, chords, genre, seed, referenceContour?, similarityBudget? }`
  - [ ] Output: `{ melody: [{ pitch, duration, syllable }], midiFile }`
- [ ] Seed-driven determinism (same inputs + seed = identical melody)
- [ ] MIDI/F0 output:
  - [ ] Export as MIDI file (for DiffSinger)
  - [ ] Export as F0 curve (Hz over time)
- [ ] Golden fixtures (known inputs → validated melodies)
- [ ] Performance optimization (<2s per section)

**Acceptance Criteria:**

- Melody generator produces valid MIDI/F0 curves
- Syllables correctly aligned to notes (1:1 or melisma)
- Genre patterns distinguishable (blues vs pop)
- Deterministic with seed
- Contour guidance works (biases melody toward reference shape)
- Performance: <2s per section
- Golden fixtures for validation (hand-crafted expected outputs)
- Tests passing with ≥75% coverage

**Files to Create:**

- `bluebird-infer/pods/melody/app.py`
- `bluebird-infer/pods/melody/melody_generator.py`
- `bluebird-infer/pods/melody/music_theory.py` (scale/chord utilities)
- `bluebird-infer/pods/melody/test_melody_gen.py`
- `bluebird-infer/pods/melody/Dockerfile`
- `bluebird-infer/pods/melody/requirements.txt`

**Example Algorithm:**

```python
def generate_melody(lyrics, key, chords, seed, reference_contour=None, budget=0.0):
    """
    Procedural melody generation

    Args:
        lyrics: "Hello world how are you"
        key: "C major"
        chords: ["C", "Am", "F", "G"]
        seed: 42
        reference_contour: [0, 2, 1, -1, 0, 2] (optional, semitone intervals)
        budget: 0.0 (max originality) to 1.0 (closer to reference)

    Returns:
        melody: [
            {"pitch": "C4", "duration": 0.5, "syllable": "Hel", "midi": 60},
            {"pitch": "D4", "duration": 0.5, "syllable": "lo", "midi": 62},
            ...
        ]
    """
    rng = np.random.default_rng(seed)
    scale = SCALES[key]  # ["C", "D", "E", "F", "G", "A", "B"]
    syllables = split_syllables(lyrics)  # ["Hel", "lo", "world", ...]

    melody = []
    current_pitch = scale[0] + 4  # Start at C4 (middle C)

    for i, syllable in enumerate(syllables):
        # Determine current chord
        chord_idx = (i * len(chords)) // len(syllables)
        chord = chords[chord_idx]
        chord_tones = get_chord_tones(chord, scale)  # [C, E, G] for C major

        # If reference contour provided, use it to guide pitch selection
        if reference_contour and budget > 0:
            target_interval = reference_contour[i % len(reference_contour)]

            # Mix between procedural and reference-guided selection
            if rng.random() < budget:
                # Follow reference contour
                next_pitch = current_pitch + target_interval
                # Snap to nearest scale tone
                next_pitch = snap_to_scale(next_pitch, scale)
            else:
                # Procedural: favor chord tones
                next_pitch = select_from_chord(chord_tones, current_pitch, rng)
        else:
            # Pure procedural: favor chord tones, stepwise motion
            next_pitch = select_from_chord(chord_tones, current_pitch, rng)

        # Assign rhythmic duration (quarter, eighth, etc.)
        duration = assign_duration(syllable, bpm=120, rng=rng)

        melody.append({
            "pitch": midi_to_note_name(next_pitch),
            "duration": duration,
            "syllable": syllable,
            "midi": next_pitch
        })

        current_pitch = next_pitch

    return melody
```

---

### Week 2: DiffSinger Integration + Quality Validation

#### Task 3.4: DiffSinger Pod Setup

**Estimate:** 14–18 hours
**Priority:** P0 (blocks voice synthesis)

**Subtasks:**

- [ ] DiffSinger environment setup:
  - [ ] Clone OpenVPI DiffSinger fork (`git clone https://github.com/openvpi/DiffSinger`)
  - [ ] Create conda environment (Python 3.8)
  - [ ] Install dependencies:

    ```bash
    conda create -n diffsinger python=3.8
    conda activate diffsinger
    pip install torch==1.9.0
    pip install -r requirements.txt
    ```

  - [ ] Download pretrained models:
    - [ ] Base acoustic model
    - [ ] NSF-HiFiGAN vocoder
    - [ ] Speaker embeddings (3–5 voices)

- [ ] Test DiffSinger inference locally:
  - [ ] Prepare test MIDI + lyrics
  - [ ] Run inference script
  - [ ] Validate output quality (listen to audio)
  - [ ] Measure inference time (GPU vs CPU)
- [ ] Set up voice pod structure:
  - [ ] `pods/voice/app.py` (FastAPI wrapper)
  - [ ] `pods/voice/diffsinger_wrapper.py` (core integration)
  - [ ] `pods/voice/speaker_loader.py` (manage speakers)
  - [ ] `pods/voice/phoneme_aligner.py` (G2P + alignment)
  - [ ] `pods/voice/requirements.txt`
  - [ ] `pods/voice/Dockerfile`
- [ ] Implement phoneme alignment:
  - [ ] G2P (grapheme-to-phoneme) conversion
    - [ ] Use `g2p_en` for English
    - [ ] Handle special characters, contractions
  - [ ] Syllable-to-phoneme mapping
  - [ ] Duration prediction (how long each phoneme)
  - [ ] Align to music grid (match note onsets)
- [ ] Implement melody-to-F0 conversion:
  - [ ] MIDI notes → Hz pitch curve
  - [ ] Sample at DiffSinger's expected rate (e.g., 100 Hz)
  - [ ] Smooth pitch transitions (linear interpolation or splines)
  - [ ] Handle sustain vs pitch bends
- [ ] HTTP endpoint: `POST /synthesize`
  - [ ] Input: `{ vocalScore, sectionIndex, speakerId, melody, seed }`

    ```json
    {
      "vocalScore": {
        "lines": [{ "lineText": "Hello world", "performer": "speaker_1" }]
      },
      "sectionIndex": 0,
      "speakerId": "speaker_female_pop",
      "melody": [
        { "pitch": "C4", "duration": 0.5, "syllable": "Hel" },
        { "pitch": "D4", "duration": 0.5, "syllable": "lo" }
      ],
      "seed": 42
    }
    ```

  - [ ] Output: `{ voiceUrl, duration_ms, alignment_error }`
  - [ ] Error handling (invalid melody, phoneme mismatch, GPU OOM, timeout)

- [ ] Speaker roster management:
  - [ ] Load 3–5 pretrained voices
  - [ ] Speaker metadata (name, range, timbre description, genre sweet spots)
  - [ ] Generate preview audio (4–5 sample phrases per speaker)
  - [ ] Store speaker configs in JSON
- [ ] Seed-driven inference:
  - [ ] Set PyTorch random seed
  - [ ] Ensure DiffSinger uses seed for sampling
  - [ ] Validate determinism (same input + seed = identical output)
- [ ] Audio quality validation:
  - [ ] Output 48kHz, 24-bit depth
  - [ ] No clipping (amplitude checks)
  - [ ] Pitch accuracy measurement (compare MIDI vs synthesized F0)
  - [ ] Syllable timing accuracy (measure alignment errors)
- [ ] Performance optimization:
  - [ ] Profile DiffSinger inference stages (acoustic model, vocoder)
  - [ ] Test GPU vs CPU performance
  - [ ] Target: ≤8s per section on GPU
  - [ ] Implement timeout (kill job if >30s)
- [ ] Golden audio fixtures:
  - [ ] Known lyrics + melody → expected output
  - [ ] Test pitch accuracy (within ±20 cents)
  - [ ] Test timing alignment (within ±50ms)
  - [ ] Test seed reproducibility (byte-for-byte identical)

**Acceptance Criteria:**

- DiffSinger running in Docker with pretrained models
- Generated singing is melodic, not speech-like
- Multiple speakers (3–5) produce distinct timbres
- Pitch accuracy within ±20 cents of MIDI input
- Syllable alignment to music grid within ±50ms
- Deterministic with seed (same input + seed = identical output)
- Performance: ≤8s P50 per section on GPU, ≤15s on CPU
- Golden fixtures validate quality (compare to reference recordings)
- Tests passing with ≥70% coverage

**Files to Create:**

- `bluebird-infer/pods/voice/app.py`
- `bluebird-infer/pods/voice/diffsinger_wrapper.py`
- `bluebird-infer/pods/voice/speaker_loader.py`
- `bluebird-infer/pods/voice/phoneme_aligner.py`
- `bluebird-infer/pods/voice/melody_to_f0.py`
- `bluebird-infer/pods/voice/test_voice_synth.py`
- `bluebird-infer/pods/voice/Dockerfile`
- `bluebird-infer/pods/voice/requirements.txt`

**Technical Notes:**

```python
# DiffSinger wrapper example
class DiffSingerSynthesizer:
    def __init__(self, model_path, vocoder_path, device='cuda'):
        self.device = device
        self.model = load_acoustic_model(model_path, device)
        self.vocoder = load_vocoder(vocoder_path, device)
        self.g2p = G2P()

    def synthesize(self, lyrics, melody, speaker_id, seed):
        """
        Synthesize singing from lyrics + melody

        Args:
            lyrics: "Hello world"
            melody: [{"pitch": "C4", "duration": 0.5, "syllable": "Hel"}, ...]
            speaker_id: "speaker_1"
            seed: 42

        Returns:
            audio: np.ndarray (48kHz samples)
        """
        # Set seed for determinism
        torch.manual_seed(seed)
        np.random.seed(seed)

        # 1. Lyrics to phonemes
        phonemes = self.g2p.convert(lyrics)
        # ["HH", "AH", "L", "OW", "W", "ER", "L", "D"]

        # 2. Align phonemes to melody notes
        ph_durs = self.align_phonemes_to_notes(phonemes, melody)
        # [(ph, dur_in_frames), ...]

        # 3. Convert melody to F0 curve
        f0_curve = self.melody_to_f0(melody, sample_rate=48000)
        # [pitch_in_hz, ...] at DiffSinger's hop size (e.g., 10ms)

        # 4. DiffSinger acoustic model
        with torch.no_grad():
            mel = self.model.infer(
                phonemes=phonemes,
                ph_dur=ph_durs,
                f0=f0_curve,
                speaker_id=speaker_id
            )

        # 5. NSF-HiFiGAN vocoder
        with torch.no_grad():
            audio = self.vocoder.infer(mel)

        # Convert to numpy
        audio = audio.cpu().numpy()

        return audio

    def align_phonemes_to_notes(self, phonemes, melody):
        """
        Align phonemes to melody notes based on syllables
        """
        ph_durs = []
        ph_idx = 0

        for note in melody:
            syllable = note['syllable']
            duration_sec = note['duration']

            # Get phonemes for this syllable
            syllable_phonemes = []
            while ph_idx < len(phonemes):
                ph = phonemes[ph_idx]
                syllable_phonemes.append(ph)
                ph_idx += 1
                # Simple heuristic: stop at next vowel
                if is_vowel(ph) and len(syllable_phonemes) > 1:
                    break

            # Distribute duration across phonemes
            # (equal distribution for simplicity; can be improved)
            frames_per_ph = (duration_sec * 48000 / hop_length) / len(syllable_phonemes)
            for ph in syllable_phonemes:
                ph_durs.append((ph, frames_per_ph))

        return ph_durs

    def melody_to_f0(self, melody, sample_rate=48000, hop_length=512):
        """
        Convert melody notes to F0 pitch curve
        """
        f0_curve = []

        for note in melody:
            pitch_hz = midi_to_hz(note_to_midi(note['pitch']))
            duration_frames = int(note['duration'] * sample_rate / hop_length)

            # Repeat pitch for duration
            f0_curve.extend([pitch_hz] * duration_frames)

        return np.array(f0_curve)
```

---

#### Task 3.5: Quality Validation & Early Checkpoint **NEW**

**Estimate:** 6–8 hours
**Priority:** P0 (decision point)

**Subtasks:**

- [ ] Generate 10 test songs with DiffSinger:
  - [ ] Genre variety: Blues, Pop, Ballad, Upbeat
  - [ ] Speaker variety: Use all 3–5 available speakers
  - [ ] Lyric variety: Simple (1 syllable/note) to complex (melisma)
  - [ ] Length: 15–30 seconds each
- [ ] Stakeholder listening session:
  - [ ] Invite 3–5 team members/stakeholders
  - [ ] Play samples blind (no context)
  - [ ] Rate each on scale 1–10:
    - 1 = Robotic/unusable
    - 5 = Acceptable for MVP/proof of concept
    - 10 = Indistinguishable from real singer
  - [ ] Collect qualitative feedback (what sounds good/bad?)
- [ ] Quality metrics (automated):
  - [ ] Pitch accuracy: MIDI note vs synthesized F0 (±cents)
  - [ ] Syllable alignment: Timing error per syllable (ms)
  - [ ] Naturalness: MOS (Mean Opinion Score) if possible
- [ ] **Decision point (End of Day 5)**:
  - [ ] If average rating ≥5/10 → **GO**: Continue with DiffSinger
  - [ ] If average rating <5/10 → **NO-GO**: Fallback to speech TTS (Fish Speech)
  - [ ] Document decision in DEVELOPMENT_LOG.md
- [ ] If GO: Document known issues and improvement roadmap
  - [ ] E.g., "Breathiness too high in soprano range → fine-tune model"
  - [ ] E.g., "Consonants blurred at fast tempo → adjust phoneme durations"
- [ ] If NO-GO: Pivot plan
  - [ ] Switch voice pod to Fish Speech V1.5 (speech TTS)
  - [ ] Update user expectations (spoken-word style vocals)
  - [ ] Reschedule true singing for Sprint 4+

**Acceptance Criteria:**

- 10 test songs generated across genres and speakers
- Quality rated by ≥3 stakeholders
- Average rating calculated and documented
- Decision made (GO/NO-GO) by end of Day 5
- If GO: Quality issues tracked for future work
- If NO-GO: Pivot plan executed (voice pod switched)

**Files to Create:**

- `docs/development/SPRINT_3_QUALITY_VALIDATION.md` (results)
- `bluebird-infer/test_audio/` (sample outputs)
- Updated `docs/development/DEVELOPMENT_LOG.md`

---

### Week 2–3: Similarity Checking + Export Gating

#### Task 3.6: Reference Upload Endpoint

**Estimate:** 5–6 hours
**Priority:** P1

**Subtasks:** _(Same as before)_

- [ ] Create route `apps/api/src/routes/remix.ts`
- [ ] `POST /remix/reference/upload` endpoint
- [ ] Analyzer worker integration
- [ ] Frontend reference upload UI
- [ ] Integration tests

**Acceptance Criteria:**

- Reference upload endpoint validates ≤30s
- Features extracted and stored in S3
- Frontend provides clear feedback
- Tests passing

**Files to Create/Modify:**

- `apps/api/src/routes/remix.ts` (new)
- `apps/api/src/lib/workers/analyzer-worker.ts` (new)
- `apps/web/src/components/reference-upload.tsx` (new)
- `apps/api/src/test/reference-upload.integration.test.ts` (new)

---

#### Task 3.7: Remix Melody Endpoint

**Estimate:** 8–10 hours
**Priority:** P1

**Subtasks:** _(Updated for melody worker)_

- [ ] Implement remix worker (`apps/api/src/lib/workers/remix-worker.ts`)
  - [ ] Load reference features from S3
  - [ ] Call melody pod with reference contour + budget
  - [ ] Store melody JSON in S3
  - [ ] Emit SSE progress
- [ ] Remix endpoint: `POST /remix/melody`
- [ ] Per-section isolation (respect locked sections)
- [ ] Pro tier gating (Free: budget=0, Pro: budget adjustable)
- [ ] Integration tests

**Acceptance Criteria:**

- Remix endpoint accepts features + budget
- Melody contour generated and stored
- Per-section isolation verified
- Budget slider affects output (testable qualitatively)
- Tests passing

**Files to Create/Modify:**

- `apps/api/src/lib/workers/remix-worker.ts` (new)
- `apps/api/src/lib/workers/melody-worker.ts` (new) **NEW**
- `apps/api/src/routes/remix.ts` (add remix endpoint)
- `apps/api/src/test/remix-melody.integration.test.ts` (new)

---

#### Task 3.8: Similarity Checking Pod

**Estimate:** 11–13 hours _(increased for threshold calibration)_
**Priority:** P0 (blocks export gating)

**Subtasks:** _(Same as before, plus calibration)_

- [ ] Define similarity checker pod API contract
- [ ] Implement similarity checking logic:
  - [ ] Interval n-gram Jaccard (melody contour)
  - [ ] DTW rhythm similarity
  - [ ] Combined score (60% melody, 40% rhythm)
  - [ ] Verdict thresholds (pass <0.35, borderline 0.35–0.48, block ≥0.48)
  - [ ] Hard rule (8+ consecutive bars identical → block)
- [ ] **NEW**: Threshold calibration
  - [ ] Create dataset of 50+ melody pairs
  - [ ] Human raters score similarity (1–10)
  - [ ] Tune thresholds to match human judgment
  - [ ] Document rationale for chosen thresholds
- [ ] Create golden fixtures for testing
- [ ] Implement similarity worker integration
- [ ] Store reports in S3
- [ ] Update take record with verdict

**Acceptance Criteria:**

- N-gram Jaccard computation correct (validated against golden fixtures)
- DTW rhythm score computed correctly
- Combined score in [0, 1] range
- Verdict thresholds applied correctly
- **Thresholds calibrated with human data**
- Hard rule triggers for 8+ bar matches
- All computations tested with golden fixtures
- Worker integration complete

**Files to Create/Modify:**

- `bluebird-infer/pods/similarity/app.py` (new)
- `bluebird-infer/pods/similarity/similarity_checker.py` (new)
- `bluebird-infer/pods/similarity/test_similarity.py` (new)
- `apps/api/src/lib/workers/similarity-worker.ts` (new)
- `apps/api/src/test/similarity-worker.integration.test.ts` (new)
- `docs/development/SIMILARITY_THRESHOLDS.md` (calibration results) **NEW**

---

#### Task 3.9: Export Endpoint Gating

**Estimate:** 4–5 hours
**Priority:** P0

**Subtasks:** _(Same as before)_

- [ ] Update `POST /export` endpoint
- [ ] Load take record with similarity_verdict
- [ ] Check verdict, block if verdict=block
- [ ] Frontend display of verdict before export
- [ ] Edge case handling

**Acceptance Criteria:**

- Export endpoint respects verdict=block
- Clear, actionable error messages
- Audit trail of all export attempts
- Frontend shows verdict clearly
- No export allowed if verdict=block (hard rule)

**Files to Create/Modify:**

- `apps/api/src/routes/export.ts` (update POST /export)
- `apps/web/src/components/export-modal.tsx` (add verdict display)

---

### Week 3–4: Performance + Testing + Documentation

#### Task 3.10: Performance Measurement

**Estimate:** 6–8 hours
**Priority:** P1

**Subtasks:** _(Updated to include melody pod)_

- [ ] Create performance measurement harness
  - [ ] Script: spin up API, enqueue full song job, measure latency
  - [ ] Breakdown: planner, **melody**, music, voice, mix, overhead
  - [ ] Report: P50, P95, P99 percentiles
- [ ] Automated TTFP test in CI
- [ ] Per-section regen measurement (music + **melody** + voice)
- [ ] GPU cost tracking (melody is CPU, voice is GPU)
- [ ] Cache hit rate analysis

**Acceptance Criteria:**

- TTFP P50 ≤45s (with real models: melody + DiffSinger + procedural music)
- Section regen P50 ≤20s
- Bottleneck identified (likely DiffSinger voice synthesis)
- Performance metrics tracked in CI
- GPU cost estimates documented

**Files to Create/Modify:**

- `apps/api/src/test/performance.benchmark.ts` (new)
- `scripts/measure-ttfp.ts` (new)
- Updated `docs/development/PERFORMANCE_REPORT.md`

---

#### Task 3.11: Integration & Contract Tests

**Estimate:** 10–12 hours
**Priority:** P1

**Subtasks:** _(Updated for melody pod)_

- [ ] End-to-end integration test: reference upload → melody remix → voice synth → similarity check → export
- [ ] Contract tests for all new endpoints (including melody pod)
- [ ] Happy path + sad path coverage
- [ ] Edge cases

**Acceptance Criteria:**

- All new endpoints have contract tests
- Happy + sad paths covered
- ≥70% test coverage for new modules (melody, voice, similarity)
- Integration test passes end-to-end
- Edge cases handled gracefully

**Files to Create/Modify:**

- `apps/api/src/test/remix-similarity-export.integration.test.ts` (new)
- `bluebird-infer/test/integration/` (pod integration tests)
- Updated `apps/api/TESTING.md`

---

#### Task 3.12: Documentation & User Guide

**Estimate:** 6–8 hours _(increased for DiffSinger docs)_
**Priority:** P1

**Subtasks:**

- [ ] API documentation
  - [ ] OpenAPI spec for new endpoints (melody, voice, similarity)
  - [ ] Swagger UI generation
  - [ ] Example requests/responses
- [ ] User guide
  - [ ] DiffSinger capabilities (melodic singing, pitch accuracy)
  - [ ] DiffSinger limitations (current quality level, genres that work best)
  - [ ] Reference upload tutorial (what works, what doesn't)
  - [ ] Similarity budget explanation (Pro feature)
  - [ ] Export gating troubleshooting
  - [ ] Recommended remix workflow
- [ ] Internal documentation
  - [ ] **DiffSinger setup guide** (installation, model download, testing)
  - [ ] Melody generation algorithm (procedural approach, chord/scale theory)
  - [ ] Phoneme alignment system (G2P, duration prediction)
  - [ ] Similarity algorithm (n-gram Jaccard, DTW, hard rules)
  - [ ] Pod API contracts
- [ ] DEVELOPMENT_LOG update
  - [ ] Decisions made during Sprint 3 (DiffSinger vs Coqui TTS)
  - [ ] Quality validation results (Day 5 checkpoint)
  - [ ] Performance bottlenecks discovered
  - [ ] Integration learnings

**Acceptance Criteria:**

- All new endpoints documented in OpenAPI / Swagger
- User guide covers DiffSinger, remix, and export gating
- **DiffSinger setup guide** complete with troubleshooting
- Internal docs explain melody + similarity algorithms
- DEVELOPMENT_LOG updated with decisions and learnings

**Files to Create/Modify:**

- `docs/project/requirements/Method.md` (add new endpoints)
- `docs/api/SWAGGER_SETUP.md` (update examples)
- **NEW**: `docs/deployment/DIFFSINGER_SETUP.md` (setup guide)
- **NEW**: `docs/project/USER_GUIDE_REMIX.md` (user guide)
- **NEW**: `docs/development/MELODY_ALGORITHM.md` (internal docs)
- Updated `docs/development/DEVELOPMENT_LOG.md`

---

## Dependencies & Blockers (Updated)

### External Dependencies

1. **DiffSinger (OpenVPI fork)**: Pretrained models and vocoder
2. **Music Synthesis Pod**: Procedural synthesis (no external deps)
3. **Feature Extraction Pod**: librosa (standard library)
4. **Similarity Checker Pod**: Pure logic (no external deps)

### Internal Dependencies

- Task 3.3 (melody) must complete before Task 3.4 (voice)
- Task 3.4 (voice) must complete before Task 3.5 (quality checkpoint)
- **Task 3.5 (quality checkpoint) is a DECISION POINT** (Day 5)
  - If GO: continue with DiffSinger
  - If NO-GO: fallback to speech TTS
- Task 3.1 (analyzer) must complete before Task 3.6 (reference upload)
- Task 3.3 (melody) must complete before Task 3.7 (remix)
- Task 3.8 (similarity) must complete before Task 3.9 (export gating)

### Optional Early Starts

- Task 3.11 (integration tests) can begin once API contracts are defined
- Task 3.12 (documentation) can begin after API contracts are finalized

---

## Risk Mitigation (Updated)

| Risk                                | Likelihood | Impact       | Mitigation                                                       |
| ----------------------------------- | ---------- | ------------ | ---------------------------------------------------------------- |
| **DiffSinger quality insufficient** | Medium     | Critical     | **Early quality gate (Day 5)**; fallback to speech TTS if needed |
| DiffSinger setup complexity         | Medium     | Blocks voice | Clear setup docs; allocate 2–3 days; ask community for help      |
| Melody generation too simplistic    | Low        | Medium       | Acceptable for MVP; improve in Sprint 4 with better algorithms   |
| Performance regression (TTFP)       | Medium     | High         | Measure early; identify bottlenecks; DiffSinger likely slowest   |
| Phoneme alignment errors            | Medium     | Medium       | Test with diverse lyrics; adjust G2P and duration prediction     |
| Similarity algorithm accuracy       | Medium     | Medium       | Threshold calibration with human raters; golden fixtures         |
| Audio artifacts in singing          | Low        | Medium       | Golden fixtures; validate pitch/timing; adjust DiffSinger params |
| Scope creep (duet, era FX)          | Medium     | High         | **Defer to Sprint 4**; focus on core singing first               |

---

## Success Checklist (Ready to Close Sprint 3)

- [ ] Melody generation pod working (procedural, deterministic)
- [ ] **DiffSinger voice synthesis working** (melodic singing, not speech)
- [ ] **Quality validation passed** (≥5/10 rating from stakeholders)
- [ ] Music synthesis working (procedural or stubs)
- [ ] Reference upload and feature extraction complete
- [ ] Remix endpoint producing valid melodies with contour guidance
- [ ] Similarity checker blocking/passing correctly (thresholds calibrated)
- [ ] Export gating enforced and tested
- [ ] TTFP P50 ≤45s (measured with real models)
- [ ] Section regen P50 ≤20s (measured)
- [ ] All tests passing, coverage ≥70%
- [ ] API docs updated and Swagger reflecting new endpoints
- [ ] User guide covering DiffSinger, remix, export gating
- [ ] **DiffSinger setup guide** complete
- [ ] Release notes drafted (v0.4.0)
- [ ] DEVELOPMENT_LOG updated with decisions (especially quality checkpoint)

---

## Recommended Execution Order (Updated)

### **Week 1: Foundation + Melody + Music**

- **Day 1–2**: Task 3.0 (Repo setup) + Task 3.1 (Analyzer)
- **Day 3**: Task 3.2 (Music synth)
- **Day 4–5**: Task 3.3 (Melody generation) + **Task 3.5 Quality Validation**
  - **END OF DAY 5: DECISION POINT** (DiffSinger GO/NO-GO)

### **Week 2: DiffSinger + Remix** _(If GO)_

- **Day 6–8**: Task 3.4 (DiffSinger pod - complex integration)
- **Day 9**: Task 3.6 (Reference upload)
- **Day 10**: Task 3.7 (Remix melody)

### **Week 3: Similarity + Export + Polish**

- **Day 11–12**: Task 3.8 (Similarity checker + calibration)
- **Day 13**: Task 3.9 (Export gating)
- **Day 14**: Task 3.10 (Performance measurement)
- **Day 15**: Tasks 3.11–3.12 (Testing + documentation)

---

## Fallback Plan (If Quality Checkpoint Fails)

**If Day 5 quality rating <5/10:**

1. **Immediate pivot** (Day 6):
   - Switch voice pod from DiffSinger to **Fish Speech V1.5** (speech TTS)
   - Estimated switch time: 4–6 hours (simpler than DiffSinger)
   - Update user expectations: "Spoken-word style vocals for MVP"

2. **Continue Sprint 3** with speech TTS:
   - Tasks 3.6–3.12 proceed as planned
   - Remix still works (melody guidance for prosody)
   - Export gating still applies

3. **Reschedule true singing**:
   - Sprint 4: Research better singing models (commercial APIs as fallback)
   - Sprint 5: Fine-tune DiffSinger on custom data

---

## Post-Sprint Review & Retrospective

**Questions to Answer:**

1. Did DiffSinger meet the quality bar (≥5/10)? If not, why?
2. What was the actual TTFP breakdown? Which pod was the bottleneck?
3. Did melody generation produce musically coherent results?
4. Did similarity algorithm work as expected? False positives/negatives?
5. What was the most surprising finding or lesson learned?
6. How should we approach pod integration in future sprints?

**Retrospective Topics:**

- DiffSinger setup: Was it easier/harder than expected?
- Melody generation: Is procedural approach sufficient or do we need ML?
- Performance: Did we hit targets or need further optimization?
- Quality: Are golden fixtures sufficient for validation?
- Collaboration: Backend/frontend/ML coordination effectiveness
