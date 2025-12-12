# Sprint 1: Preview Vertical Slice - Task Breakdown

**Sprint Goal:** End-to-end 30s preview (lyrics→audio) with stubs; workspace UI; local A/B preview.

**Target:** TTFP ≤45s P50, 70% test coverage

**Status:** API scaffolding complete (~30%), implementation pending

---

## Phase 1: Backend Core (Priority: Critical)

### Task 1.1: Complete Music Synthesis Worker ⚡ PRIORITY

**Estimate:** 4-6 hours
**Status:** 🟡 Partially complete (stub exists, worker needed)

**Subtasks:**

- [ ] Create `apps/api/src/lib/workers/music-worker.ts`
- [ ] Implement worker that consumes from `music` queue
- [ ] Call `synthesizeMusic()` with arrangement spec + section index
- [ ] Generate stems per instrument (drums, bass, guitar, etc.)
- [ ] Write WAV files to S3: `projects/{projectId}/takes/{takeId}/sections/{idx}/music/{stem}.wav`
- [ ] Emit progress events via SSE (0% → 100%)
- [ ] Update Take record with section completion status
- [ ] Add error handling + DLQ routing

**Acceptance Criteria:**

- Music worker processes job from queue
- Generates click pattern + loop bed per section
- WAV files stored in S3 with correct paths
- SSE events stream progress updates
- Worker handles failures gracefully

**Files to modify:**

- New: `apps/api/src/lib/workers/music-worker.ts`
- Modify: `apps/api/src/worker-entry.ts` (register worker)
- Modify: `apps/api/src/routes/render.ts` (ensure job enqueueing works)

---

### Task 1.2: Complete Voice Synthesis Worker ⚡ PRIORITY

**Estimate:** 4-6 hours
**Status:** 🔴 Not started (stub exists, worker needed)

**Subtasks:**

- [ ] Create `apps/api/src/lib/workers/voice-worker.ts`
- [ ] Implement worker that consumes from `voice` queue
- [ ] Call `synthesizeVoice()` with lyrics + syllable timing
- [ ] Generate vocal track aligned to BPM grid
- [ ] Write WAV to S3: `projects/{projectId}/takes/{takeId}/sections/{idx}/vocals/{part}.wav`
- [ ] Emit progress events via SSE
- [ ] Update Take record with vocal completion status
- [ ] Add tests mirroring music-synth pattern (target: 9+ tests)

**Acceptance Criteria:**

- Voice worker processes job from queue
- Generates syllable-aligned tones
- WAV files stored in S3
- SSE progress updates working
- Test coverage >80% for voice-synth.ts

**Files to modify:**

- New: `apps/api/src/lib/workers/voice-worker.ts`
- Modify: `apps/api/src/worker-entry.ts` (register worker)
- New: `apps/api/src/lib/test/voice-synth.test.ts`

---

### Task 1.3: Implement Mix Worker

**Estimate:** 3-5 hours
**Status:** 🔴 Not started (route exists, logic needed)

**Subtasks:**

- [ ] Create `apps/api/src/lib/workers/mix-worker.ts`
- [ ] Implement worker that consumes from `mix` queue
- [ ] Fetch all section stems from S3 (music + vocals)
- [ ] Sum stems with basic mixing:
  - [ ] Apply per-track gain adjustments
  - [ ] Align to common timeline (BPM-locked)
  - [ ] Sum to stereo master
- [ ] Implement LUFS normalization (-14 dBFS default)
- [ ] Implement true-peak limiting (-1 dBTP default)
- [ ] Write master WAV to S3: `projects/{projectId}/takes/{takeId}/mix/master.wav`
- [ ] Emit progress events
- [ ] Update Take record with mix completion

**Acceptance Criteria:**

- Mix worker sums all stems correctly
- LUFS normalization within ±0.5 dB of target
- True-peak limiting prevents clipping
- Master WAV plays back correctly
- No audio artifacts (clicks, pops)

**Files to modify:**

- New: `apps/api/src/lib/workers/mix-worker.ts`
- Modify: `apps/api/src/worker-entry.ts`
- Modify: `apps/api/src/routes/mix.ts` (complete handler logic)

---

### Task 1.4: Implement Export Worker

**Estimate:** 3-4 hours
**Status:** 🔴 Not started (route exists, logic needed)

**Subtasks:**

- [ ] Create `apps/api/src/lib/workers/export-worker.ts`
- [ ] Implement worker that consumes from `export` queue
- [ ] Fetch master WAV from S3
- [ ] Generate MP3 (320kbps) using ffmpeg or similar
- [ ] Optionally bundle stems if requested
- [ ] Generate presigned S3 URLs (10min TTL for preview, 30min for download)
- [ ] Write export manifest to DB
- [ ] Emit completion event with download URLs

**Acceptance Criteria:**

- Export worker generates MP3 from WAV
- Presigned URLs work and expire correctly
- Stems bundled when requested
- Export manifest includes all file paths
- SSE completion event includes download links

**Files to modify:**

- New: `apps/api/src/lib/workers/export-worker.ts`
- Modify: `apps/api/src/worker-entry.ts`
- Modify: `apps/api/src/routes/export.ts` (complete presign logic)

---

### Task 1.5: Integration Testing - Preview Path

**Estimate:** 2-3 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Create `apps/api/src/test/preview-flow.integration.test.ts`
- [ ] Test full flow: Plan → Render Music → Render Voice → Mix → Export
- [ ] Verify S3 artifacts exist at each stage
- [ ] Verify SSE events emitted correctly
- [ ] Verify Take record updated at each stage
- [ ] Test error scenarios (missing artifacts, queue failures)
- [ ] Measure TTFP baseline (target: <45s)

**Acceptance Criteria:**

- Integration test runs full preview path end-to-end
- All S3 artifacts verified
- SSE event sequence verified
- TTFP measured and documented
- Test passes consistently

**Files to create:**

- New: `apps/api/src/test/preview-flow.integration.test.ts`

---

## Phase 2: Frontend Foundation (Priority: High)

### Task 2.1: Next.js Project Setup

**Estimate:** 2-3 hours
**Status:** 🔴 Not started (empty web app)

**Subtasks:**

- [ ] Set up Next.js 15 App Router structure
- [ ] Configure Tailwind CSS
- [ ] Install and configure shadcn/ui components
- [ ] Set up API client (@bluebird/client)
- [ ] Configure environment variables
- [ ] Create base layout with navigation
- [ ] Add health check page
- [ ] Verify hot reload works

**Acceptance Criteria:**

- Next.js dev server runs on port 3000
- Tailwind styling works
- shadcn/ui components importable
- API client can call backend
- Layout renders correctly

**Files to create:**

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/tailwind.config.ts`
- `apps/web/components.json` (shadcn config)

---

### Task 2.2: API Client Package

**Estimate:** 2 hours
**Status:** 🟡 Scaffold exists, needs implementation

**Subtasks:**

- [ ] Implement `packages/client/src/index.ts`
- [ ] Create typed API methods:
  - [ ] `planSong(request: PlanSongRequest)`
  - [ ] `renderMusic(request: RenderMusicRequest)`
  - [ ] `renderVoice(request: RenderVoiceRequest)`
  - [ ] `mixFinal(request: MixFinalRequest)`
  - [ ] `exportPreview(request: ExportPreviewRequest)`
- [ ] Add SSE client helper: `subscribeToJob(jobId: string)`
- [ ] Add error handling and retries
- [ ] Add request/response logging

**Acceptance Criteria:**

- All API methods typed correctly
- SSE client handles reconnection
- Errors surfaced to UI
- Request IDs tracked

**Files to modify:**

- Modify: `packages/client/src/index.ts`

---

### Task 2.3: Core UI Components

**Estimate:** 4-5 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Create `LyricsInput` component (textarea with validation)
- [ ] Create `GenreSelector` component (dropdown with presets)
- [ ] Create `ArtistSelector` component (list with previews)
- [ ] Create `StructureGrid` component (visual section timeline)
- [ ] Create `SectionCard` component (lock/regen/status)
- [ ] Create `JobTimeline` component (SSE progress display)
- [ ] Add loading states and skeletons
- [ ] Add error boundaries

**Acceptance Criteria:**

- All components render correctly
- Props typed with TypeScript
- Accessible (keyboard nav, ARIA labels)
- Responsive design (mobile + desktop)
- Storybook stories (optional)

**Files to create:**

- `apps/web/src/components/lyrics-input.tsx`
- `apps/web/src/components/genre-selector.tsx`
- `apps/web/src/components/artist-selector.tsx`
- `apps/web/src/components/structure-grid.tsx`
- `apps/web/src/components/section-card.tsx`
- `apps/web/src/components/job-timeline.tsx`

---

### Task 2.4: Workspace Page

**Estimate:** 3-4 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Create `/workspace` route
- [ ] Layout: Lyrics (left), Structure (center), Controls (right)
- [ ] Wire up LyricsInput to state
- [ ] Wire up GenreSelector to state
- [ ] Wire up ArtistSelector to state
- [ ] Add "Generate Preview" button
- [ ] Connect to API client `planSong()`
- [ ] Display JobTimeline when job starts
- [ ] Show StructureGrid when plan completes

**Acceptance Criteria:**

- User can input lyrics
- User can select genre/artist
- Generate button triggers API call
- Job progress displays in timeline
- Structure grid populates after planning

**Files to create:**

- `apps/web/src/app/workspace/page.tsx`

---

## Phase 3: Audio Playback (Priority: High)

### Task 3.1: WebAudio Transport

**Estimate:** 3-4 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Create `apps/web/src/lib/audio-engine.ts`
- [ ] Initialize AudioContext
- [ ] Implement transport controls (play/pause/stop)
- [ ] Add playback position tracking
- [ ] Add seek functionality
- [ ] Implement master gain control
- [ ] Handle audio buffer loading from S3 URLs
- [ ] Add buffer caching

**Acceptance Criteria:**

- AudioContext initializes on user interaction
- Play/pause/stop work correctly
- Position updates in real-time
- Seeking works without clicks
- Buffers load efficiently

**Files to create:**

- New: `apps/web/src/lib/audio-engine.ts`

---

### Task 3.2: WebAudio Mixer

**Estimate:** 4-5 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Create `apps/web/src/components/mixer.tsx`
- [ ] Build audio graph with per-track nodes:
  - [ ] Source nodes (AudioBufferSourceNode per stem)
  - [ ] Gain nodes (per-track volume)
  - [ ] Pan nodes (stereo positioning)
  - [ ] Master output
- [ ] Add UI controls:
  - [ ] Faders (volume sliders)
  - [ ] Mute/solo buttons
  - [ ] Pan knobs
  - [ ] Master fader
- [ ] Implement A/B comparison mode
- [ ] Add keyboard shortcuts (space = play/pause)
- [ ] Add visual meters (VU/peak)

**Acceptance Criteria:**

- All stems play in sync
- Gain/pan/mute work per track
- Master output level correct
- A/B comparison switches seamlessly
- No audio glitches or dropouts
- Keyboard shortcuts work

**Files to create:**

- New: `apps/web/src/components/mixer.tsx`
- New: `apps/web/src/components/mixer-channel.tsx`

---

### Task 3.3: Preview Player Integration

**Estimate:** 2-3 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Integrate audio engine into workspace
- [ ] Load stems after render completes
- [ ] Display mixer UI
- [ ] Wire transport controls
- [ ] Add download button for preview
- [ ] Handle loading states
- [ ] Add error recovery (reload stems)

**Acceptance Criteria:**

- Stems auto-load when ready
- Mixer displays with all tracks
- Playback works immediately
- Download triggers export job
- Errors handled gracefully

**Files to modify:**

- Modify: `apps/web/src/app/workspace/page.tsx`

---

## Phase 4: Polish & Performance (Priority: Medium)

### Task 4.1: SSE Client Implementation

**Estimate:** 2 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Create `apps/web/src/lib/sse-client.ts`
- [ ] Implement EventSource wrapper
- [ ] Add heartbeat detection (15s timeout)
- [ ] Implement exponential backoff (500ms → 8s)
- [ ] Parse JobEvent messages
- [ ] Emit typed events to UI
- [ ] Handle connection errors

**Acceptance Criteria:**

- SSE connects on job start
- Events parsed correctly
- Reconnection works after network loss
- Heartbeat prevents stale connections
- Events typed with TypeScript

**Files to create:**

- New: `apps/web/src/lib/sse-client.ts`

---

### Task 4.2: Optimistic UI Updates

**Estimate:** 2 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Disable controls during render (prevent spam)
- [ ] Show optimistic state on button clicks
- [ ] Add loading spinners/skeletons
- [ ] Revert on error
- [ ] Show toast notifications for status

**Acceptance Criteria:**

- UI feels responsive
- No accidental double-clicks
- Errors clear and actionable
- Loading states consistent

---

### Task 4.3: Error Handling & Recovery

**Estimate:** 2 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Add error boundaries
- [ ] Display user-friendly error messages
- [ ] Add retry buttons
- [ ] Log errors to console/Sentry
- [ ] Handle network failures
- [ ] Handle auth failures (redirect to login)

**Acceptance Criteria:**

- Errors don't crash app
- Messages are helpful
- Retry works for transient failures
- Auth errors handled

---

### Task 4.4: Performance Testing

**Estimate:** 2-3 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Measure TTFP (Time to First Preview) - target: ≤45s P50
- [ ] Measure per-section regen time - target: ≤20s P50
- [ ] Profile audio engine performance
- [ ] Test with large projects (10+ sections)
- [ ] Test concurrent job handling
- [ ] Document baseline metrics

**Acceptance Criteria:**

- TTFP meets target (<45s)
- Section regen meets target (<20s)
- Audio playback smooth (no dropouts)
- UI responsive during heavy load
- Metrics documented in DEVELOPMENT_LOG.md

---

## Phase 5: Testing & Documentation (Priority: Medium)

### Task 5.1: Component Tests

**Estimate:** 3-4 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Add tests for all UI components
- [ ] Test user interactions (clicks, typing)
- [ ] Test error states
- [ ] Test loading states
- [ ] Use React Testing Library
- [ ] Target 70% coverage for components

**Files to create:**

- Multiple `*.test.tsx` files in components/

---

### Task 5.2: E2E Tests (Optional for Sprint 1)

**Estimate:** 4-6 hours
**Status:** 🔴 Deferred to Sprint 2

**Subtasks:**

- [ ] Set up Playwright
- [ ] Test signup → lyrics → preview flow
- [ ] Test section regeneration
- [ ] Test export download
- [ ] Run in CI

---

### Task 5.3: Update Documentation

**Estimate:** 1-2 hours
**Status:** 🔴 Not started

**Subtasks:**

- [ ] Update DEVELOPMENT_LOG.md with Sprint 1 learnings
- [ ] Document performance baselines
- [ ] Update README with frontend setup
- [ ] Add architecture diagrams
- [ ] Document known issues/limitations

**Files to modify:**

- `docs/development/DEVELOPMENT_LOG.md`
- `README.md`

---

## Task Priority Matrix

### 🔴 Critical Path (Must Complete for MVP)

1. Task 1.1 - Music Worker (blocks everything)
2. Task 1.2 - Voice Worker (blocks everything)
3. Task 1.3 - Mix Worker (blocks playback)
4. Task 1.4 - Export Worker (blocks download)
5. Task 2.1 - Next.js Setup (blocks frontend)
6. Task 3.1 - WebAudio Transport (blocks playback)
7. Task 3.2 - WebAudio Mixer (blocks A/B)

### 🟡 High Priority (Needed for Good UX)

8. Task 2.2 - API Client
9. Task 2.3 - Core UI Components
10. Task 2.4 - Workspace Page
11. Task 3.3 - Preview Player Integration
12. Task 4.1 - SSE Client
13. Task 1.5 - Integration Testing

### 🟢 Medium Priority (Polish)

14. Task 4.2 - Optimistic UI
15. Task 4.3 - Error Handling
16. Task 4.4 - Performance Testing
17. Task 5.1 - Component Tests
18. Task 5.3 - Documentation

### ⚪ Low Priority (Can Defer)

19. Task 5.2 - E2E Tests (move to Sprint 2)

---

## Recommended Execution Order

**Week 1 (Backend Focus):**

- Day 1-2: Tasks 1.1, 1.2 (Music + Voice workers)
- Day 3: Task 1.3 (Mix worker)
- Day 4: Task 1.4 (Export worker)
- Day 5: Task 1.5 (Integration testing)

**Week 2 (Frontend Focus):**

- Day 6: Tasks 2.1, 2.2 (Next.js setup + API client)
- Day 7: Task 2.3 (Core UI components)
- Day 8: Tasks 2.4, 3.1 (Workspace page + Audio engine)
- Day 9: Tasks 3.2, 3.3 (Mixer + integration)
- Day 10: Tasks 4.1-4.4 (SSE + polish + testing)

---

## Success Metrics

**Technical:**

- ✅ TTFP ≤45s P50
- ✅ Section regen ≤20s P50
- ✅ Test coverage ≥70%
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors

**Functional:**

- ✅ User can paste lyrics and get 30s preview
- ✅ User can play/pause/mute individual tracks
- ✅ User can A/B compare versions
- ✅ User can download preview (WAV/MP3)
- ✅ Job progress updates in real-time via SSE

**Quality:**

- ✅ No audio artifacts (clicks, pops, sync drift)
- ✅ UI responsive (no freezing during render)
- ✅ Errors handled gracefully
- ✅ Works in Chrome, Safari, Firefox

---

## Risk Mitigation

**Risk:** WebAudio sync drift between tracks

- **Mitigation:** Central transport clock; pre-roll; crossfades

**Risk:** TTFP exceeds 45s

- **Mitigation:** Profile workers; optimize S3 uploads; cache stems

**Risk:** Audio artifacts in playback

- **Mitigation:** Buffer pre-loading; sample-aligned mixing; zero-crossing detection

**Risk:** Frontend state management complexity

- **Mitigation:** Keep state local; use React Query for server state

**Risk:** SSE connection drops during long renders

- **Mitigation:** Heartbeat detection; exponential backoff; resume from last event

---

## Definition of Done (Sprint 1)

- [ ] All critical path tasks complete
- [ ] TTFP ≤45s measured and documented
- [ ] 70% test coverage achieved
- [ ] Integration test passes consistently
- [ ] User can complete end-to-end flow: lyrics → preview → playback → download
- [ ] No blocking bugs
- [ ] Performance baselines documented
- [ ] DEVELOPMENT_LOG.md updated
- [ ] Demo video recorded
- [ ] Ready to merge to main
