# Sprint 2: Section Regeneration & Frontend Foundation

**Sprint Duration:** 2 weeks (Jan 23 – Feb 3, 2026)

**Sprint Goal:** Complete frontend workspace with section-level regeneration, local WebAudio preview/mixing, and A/B comparison capabilities. Enable sub-20s per-section regen workflow.

**Success Metrics:**

- Per-section regen P50 ≤20s
- WebAudio A/B comparison works offline (no GPU calls)
- UI responsive during renders (optimistic updates)
- Test coverage ≥70%
- User can complete: lyrics → preview → lock section → regen different section → A/B compare → download

---

## Sprint Context

**What We Have (Sprint 0-1):**

- ✅ Backend: Queue system, SSE streaming, music/voice/mix/export workers
- ✅ API: All core endpoints implemented
- ✅ Stubs: Music synthesis (click patterns), voice synthesis (sine tones), mixing
- ✅ Database: Full schema with projects, takes, sections, jobs, artifacts
- ✅ CLI: `bluebird plan` with SSE watch mode

**What We Need (Sprint 2):**

- Frontend workspace UI (Next.js)
- WebAudio local preview engine
- Section-level lock/regen controls
- A/B comparison without GPU calls
- Real-time job progress visualization

---

## Epic Breakdown

### E2.1 — Next.js Frontend Foundation (Priority: CRITICAL)

**Goal:** Stand up Next.js workspace with API integration and SSE streaming.

**Stories:**

- S2.1.1: Next.js App Router setup with Tailwind + shadcn/ui
- S2.1.2: API client package with typed methods
- S2.1.3: SSE client with reconnection and heartbeat handling
- S2.1.4: Core UI component library

---

### E2.2 — Workspace UI Implementation (Priority: CRITICAL)

**Goal:** Build the main song workspace interface where users create and iterate.

**Stories:**

- S2.2.1: Workspace page layout (lyrics/structure/controls)
- S2.2.2: Lyrics input panel with section tagging
- S2.2.3: Genre and artist selection UI
- S2.2.4: Job timeline and progress visualization
- S2.2.5: Structure grid with section status display

---

### E2.3 — WebAudio Local Preview Engine (Priority: HIGH)

**Goal:** Client-side audio mixing for instant A/B comparison without GPU calls.

**Stories:**

- S2.3.1: WebAudio transport (play/pause/seek)
- S2.3.2: Multi-track mixer with per-track gain/mute/pan
- S2.3.3: A/B comparison mode
- S2.3.4: Audio buffer loading and caching

---

### E2.4 — Section Controls & Regeneration (Priority: HIGH)

**Goal:** Enable lock/regen workflow for iterative composition.

**Stories:**

- S2.4.1: Section lock/unlock UI and API integration
- S2.4.2: Per-section regenerate (music stems)
- S2.4.3: Per-section regenerate (vocals)
- S2.4.4: Section status tracking and visual feedback

---

### E2.5 — Integration & Polish (Priority: MEDIUM)

**Goal:** End-to-end flow working smoothly.

**Stories:**

- S2.5.1: Export preview download flow
- S2.5.2: Error handling and recovery
- S2.5.3: Optimistic UI updates
- S2.5.4: Keyboard shortcuts

---

## Detailed Task Breakdown

### Week 1: Frontend Foundation + Workspace UI

#### Task 2.1: Next.js Project Setup

**Estimate:** 3-4 hours
**Priority:** P0 (blocks everything)

**Subtasks:**

- [ ] Initialize Next.js 15 with App Router in `apps/web/`
- [ ] Configure TypeScript (strict mode)
- [ ] Set up Tailwind CSS with custom theme tokens
- [ ] Install and configure shadcn/ui components
- [ ] Create base layout with navigation shell
- [ ] Add environment variable configuration
- [ ] Set up hot module replacement
- [ ] Create health check page

**Acceptance Criteria:**

- `pnpm -F web dev` runs on localhost:3000
- Tailwind utilities work correctly
- shadcn/ui components importable
- TypeScript strict mode passes
- Layout renders with navigation

**Files to Create:**

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/tailwind.config.ts`
- `apps/web/components.json`
- `apps/web/next.config.js`
- `apps/web/tsconfig.json`

---

#### Task 2.2: API Client Package

**Estimate:** 3-4 hours
**Priority:** P0 (blocks API integration)

**Subtasks:**

- [ ] Implement `packages/client/src/index.ts`
- [ ] Create typed client class using `@bluebird/types`
- [ ] Implement methods:
  - [ ] `planSong(request: PlanSongRequest): Promise<PlanResponse>`
  - [ ] `renderMusic(request: RenderMusicRequest): Promise<JobResponse>`
  - [ ] `renderVoice(request: RenderVoiceRequest): Promise<JobResponse>`
  - [ ] `mixFinal(request: MixRequest): Promise<JobResponse>`
  - [ ] `exportPreview(request: ExportRequest): Promise<ExportResponse>`
  - [ ] `getJob(jobId: string): Promise<Job>`
- [ ] Add request interceptor for auth headers
- [ ] Add response error handling
- [ ] Add retry logic (exponential backoff)
- [ ] Add request/response logging

**Acceptance Criteria:**

- All API methods return correctly typed responses
- Errors surface with helpful messages
- Retry logic works for transient failures
- Auth headers automatically included
- Can import from `@bluebird/client` in web app

**Files to Create:**

- `packages/client/src/index.ts`
- `packages/client/src/types.ts`
- `packages/client/package.json`

---

#### Task 2.3: SSE Client Implementation

**Estimate:** 3-4 hours
**Priority:** P0 (blocks progress updates)

**Subtasks:**

- [ ] Create `apps/web/src/lib/sse-client.ts`
- [ ] Implement EventSource wrapper class
- [ ] Add heartbeat detection (15s timeout)
- [ ] Implement exponential backoff reconnection (500ms → 8s max)
- [ ] Parse `JobEvent` messages from SSE stream
- [ ] Emit typed events via callbacks or event emitter
- [ ] Handle connection state (connecting/open/error/closed)
- [ ] Add cleanup on component unmount
- [ ] Add unit tests for reconnection logic

**Acceptance Criteria:**

- SSE connects to `/jobs/:jobId/events`
- Receives and parses job events correctly
- Reconnects automatically after network loss
- Heartbeat prevents stale connections
- Events are TypeScript-typed
- No memory leaks from orphaned connections

**Files to Create:**

- `apps/web/src/lib/sse-client.ts`
- `apps/web/src/lib/sse-client.test.ts`

---

#### Task 2.4: Core UI Components

**Estimate:** 6-8 hours
**Priority:** P1

**Subtasks:**

- [ ] `LyricsInput` component (textarea with line/word counts)
  - [ ] Validation (10-5000 chars)
  - [ ] Section marker UI (tag lines as verse/chorus)
  - [ ] Auto-save on change
- [ ] `GenreSelector` component
  - [ ] Dropdown with genre presets
  - [ ] Visual preview badges
- [ ] `ArtistSelector` component
  - [ ] Grid layout with artist cards
  - [ ] Audition preview buttons (future: play sample audio)
  - [ ] Selected state
- [ ] `StructureGrid` component
  - [ ] Visual timeline of sections
  - [ ] Bar count display
  - [ ] Color-coded by section type
- [ ] `SectionCard` component
  - [ ] Status badge (generated/locked/rendering/dirty)
  - [ ] Lock/unlock button
  - [ ] Regen button
  - [ ] Solo playback toggle
- [ ] `JobTimeline` component
  - [ ] Progress bar with stage labels
  - [ ] ETA display
  - [ ] Status messages from SSE

**Acceptance Criteria:**

- All components render correctly
- Props fully typed with TypeScript
- Accessible (keyboard nav, ARIA labels)
- Responsive design (mobile + desktop)
- Loading states and skeletons
- Error boundaries around each component

**Files to Create:**

- `apps/web/src/components/lyrics-input.tsx`
- `apps/web/src/components/genre-selector.tsx`
- `apps/web/src/components/artist-selector.tsx`
- `apps/web/src/components/structure-grid.tsx`
- `apps/web/src/components/section-card.tsx`
- `apps/web/src/components/job-timeline.tsx`
- `apps/web/src/components/ui/` (shadcn components)

---

#### Task 2.5: Workspace Page Layout

**Estimate:** 4-5 hours
**Priority:** P1

**Subtasks:**

- [ ] Create `/workspace` route
- [ ] Design 3-column layout:
  - Left: Lyrics input panel
  - Center: Structure grid + section cards
  - Right: Controls (genre/artist) + job timeline
- [ ] Wire up state management (React state or Zustand)
- [ ] Connect LyricsInput to state
- [ ] Connect GenreSelector to state
- [ ] Connect ArtistSelector to state
- [ ] Add "Generate Preview" button
- [ ] Trigger API call to `planSong()` on button click
- [ ] Display JobTimeline when job starts
- [ ] Subscribe to SSE for job updates
- [ ] Show StructureGrid when plan completes

**Acceptance Criteria:**

- User can input lyrics (10-5000 chars)
- User can select genre from presets
- User can select artist from roster
- "Generate Preview" button triggers planning
- Job timeline shows progress in real-time
- Structure grid populates after planning completes
- Layout responsive on tablet/desktop

**Files to Create:**

- `apps/web/src/app/workspace/page.tsx`
- `apps/web/src/app/workspace/layout.tsx`
- `apps/web/src/hooks/use-workspace-state.ts`

---

### Week 2: WebAudio Engine + Section Regen

#### Task 2.6: WebAudio Transport

**Estimate:** 4-5 hours
**Priority:** P0 (blocks playback)

**Subtasks:**

- [ ] Create `apps/web/src/lib/audio-engine.ts`
- [ ] Initialize AudioContext (on user interaction)
- [ ] Implement transport controls:
  - [ ] `play()` - start playback
  - [ ] `pause()` - pause playback
  - [ ] `stop()` - stop and reset position
  - [ ] `seek(seconds: number)` - jump to position
- [ ] Add playback position tracking (update every 100ms)
- [ ] Implement master gain control
- [ ] Handle audio buffer loading from S3 presigned URLs
- [ ] Add buffer caching (Map<url, AudioBuffer>)
- [ ] Handle AudioContext state transitions
- [ ] Add cleanup on unmount

**Acceptance Criteria:**

- AudioContext initializes on first user interaction
- Play/pause/stop controls work correctly
- Position updates in real-time (within 100ms accuracy)
- Seeking works without clicks or pops
- Buffers load efficiently and cache properly
- No memory leaks from orphaned AudioNodes

**Files to Create:**

- `apps/web/src/lib/audio-engine.ts`
- `apps/web/src/lib/audio-engine.test.ts`

---

#### Task 2.7: WebAudio Mixer

**Estimate:** 6-8 hours
**Priority:** P0 (blocks A/B comparison)

**Subtasks:**

- [ ] Create `apps/web/src/components/mixer.tsx`
- [ ] Build audio graph architecture:
  - [ ] AudioBufferSourceNode per stem
  - [ ] GainNode per track (volume control)
  - [ ] StereoPannerNode per track
  - [ ] Master GainNode
  - [ ] Connect to AudioContext.destination
- [ ] Implement track synchronization (all stems start at same time)
- [ ] Add UI controls:
  - [ ] Volume faders (0-100%, -60dB to 0dB)
  - [ ] Mute/solo buttons per track
  - [ ] Pan knobs (-100% to +100%)
  - [ ] Master fader
  - [ ] Transport controls (play/pause/stop)
- [ ] Implement A/B comparison mode:
  - [ ] Load two different takes
  - [ ] Instant switching between A and B
  - [ ] Maintain playback position on switch
- [ ] Add visual meters (optional: peak/VU for each track)
- [ ] Add keyboard shortcuts:
  - [ ] Space: play/pause
  - [ ] M: mute selected track
  - [ ] S: solo selected track

**Acceptance Criteria:**

- All stems play in perfect sync
- Gain/pan/mute controls work per track
- Master output level correct
- A/B comparison switches seamlessly (<100ms)
- No audio glitches, clicks, or dropouts
- Keyboard shortcuts functional
- Visual feedback for all controls

**Files to Create:**

- `apps/web/src/components/mixer.tsx`
- `apps/web/src/components/mixer-channel.tsx`
- `apps/web/src/hooks/use-audio-graph.ts`

---

#### Task 2.8: Section Lock/Unlock Implementation

**Estimate:** 3-4 hours
**Priority:** P1

**Subtasks:**

- [ ] Add `locked` boolean field to Section model (Prisma migration)
- [ ] Create API endpoint `PATCH /sections/:sectionId/lock`
- [ ] Update SectionCard component with lock toggle
- [ ] Add visual indicator (lock icon) when section is locked
- [ ] Prevent regeneration of locked sections (UI + API validation)
- [ ] Add bulk lock/unlock actions (optional)
- [ ] Update database queries to respect lock status

**Acceptance Criteria:**

- User can lock/unlock individual sections
- Locked sections show lock icon
- Regenerate button disabled for locked sections
- Lock status persists across page reloads
- Bulk actions work (if implemented)

**Files to Modify/Create:**

- `apps/api/prisma/schema.prisma` (add `locked Boolean @default(false)`)
- `apps/api/src/routes/sections.ts` (new endpoint)
- `apps/web/src/components/section-card.tsx`

---

#### Task 2.9: Per-Section Music Regeneration

**Estimate:** 4-5 hours
**Priority:** P1

**Subtasks:**

- [ ] Create API endpoint `POST /render/section`
  - [ ] Accept `{ takeId, sectionId, instrumentType?, seed? }`
  - [ ] Validate section is not locked
  - [ ] Enqueue music-worker job for specific section
  - [ ] Return jobId for SSE tracking
- [ ] Update music-worker to handle section-scoped jobs
- [ ] Implement section-level artifact storage
- [ ] Add "Regen" button to SectionCard component
- [ ] Show progress spinner during regeneration
- [ ] Update UI when new stem is ready
- [ ] Cache previous version for A/B comparison

**Acceptance Criteria:**

- User can click "Regen" on a section
- Only that section's music regenerates
- Other sections remain untouched
- New stem loads into mixer automatically
- Previous version cached for A/B
- Regen completes in ≤20s P50

**Files to Modify/Create:**

- `apps/api/src/routes/render.ts` (add section endpoint)
- `apps/api/src/lib/workers/music-worker.ts` (handle section jobs)
- `apps/web/src/components/section-card.tsx`

---

#### Task 2.10: Per-Section Vocal Regeneration

**Estimate:** 4-5 hours
**Priority:** P1

**Subtasks:**

- [ ] Extend `POST /render/section` to support vocals
- [ ] Update voice-worker to handle section-scoped jobs
- [ ] Add "Regen Vocals" option in SectionCard
- [ ] Implement lyrics-to-section mapping
- [ ] Handle syllable alignment per section
- [ ] Update UI when new vocal stem ready

**Acceptance Criteria:**

- User can regenerate vocals for a section
- Syllable alignment preserved
- Other sections unchanged
- Previous vocal cached for A/B
- Regen completes in ≤20s P50

**Files to Modify:**

- `apps/api/src/lib/workers/voice-worker.ts`
- `apps/web/src/components/section-card.tsx`

---

#### Task 2.11: A/B Comparison Implementation

**Estimate:** 3-4 hours
**Priority:** P1

**Subtasks:**

- [ ] Add take versioning to database (previous/current stems)
- [ ] Store previous stem URLs when regenerating
- [ ] Add A/B toggle UI in mixer
- [ ] Implement instant stem switching in audio graph
- [ ] Maintain playback position during switch
- [ ] Visual indicator of active version (A or B)

**Acceptance Criteria:**

- User can toggle between A and B versions
- Switch happens instantly (<100ms)
- Playback position maintained
- All tracks switch atomically
- Clear visual feedback of active version

**Files to Modify/Create:**

- `apps/api/prisma/schema.prisma` (add version tracking)
- `apps/web/src/components/mixer.tsx`
- `apps/web/src/lib/audio-engine.ts`

---

#### Task 2.12: Export Preview Download Flow

**Estimate:** 2-3 hours
**Priority:** P2

**Subtasks:**

- [ ] Add "Export Preview" button to workspace
- [ ] Call `exportPreview()` API method
- [ ] Show export progress via SSE
- [ ] Display download links when ready
- [ ] Support WAV and MP3 formats
- [ ] Add "Include Stems" checkbox (optional)

**Acceptance Criteria:**

- User can trigger export from workspace
- Progress shown in job timeline
- Download links appear when ready
- Links download correct formats
- Stems included if requested

**Files to Modify/Create:**

- `apps/web/src/components/export-modal.tsx`
- `apps/web/src/app/workspace/page.tsx`

---

#### Task 2.13: Error Handling & Recovery

**Estimate:** 3-4 hours
**Priority:** P2

**Subtasks:**

- [ ] Add error boundaries to workspace components
- [ ] Display user-friendly error messages
- [ ] Add retry buttons for failed jobs
- [ ] Handle network failures gracefully
- [ ] Handle SSE disconnection
- [ ] Log errors to console (future: Sentry)
- [ ] Show error state in job timeline
- [ ] Handle auth failures (redirect to login)

**Acceptance Criteria:**

- Errors don't crash the app
- Messages are clear and actionable
- Retry works for transient failures
- SSE reconnects after network loss
- Auth errors handled properly

**Files to Modify:**

- `apps/web/src/app/error.tsx`
- `apps/web/src/components/job-timeline.tsx`
- `apps/web/src/lib/sse-client.ts`

---

#### Task 2.14: Optimistic UI Updates

**Estimate:** 2-3 hours
**Priority:** P2

**Subtasks:**

- [ ] Disable controls during active jobs
- [ ] Show optimistic state on button clicks
- [ ] Add loading spinners/skeletons
- [ ] Revert optimistic updates on error
- [ ] Show toast notifications for status changes
- [ ] Prevent double-click spam

**Acceptance Criteria:**

- UI feels responsive
- No accidental duplicate requests
- Errors clear optimistic state
- Loading states consistent
- Toast notifications helpful

**Files to Modify:**

- All interactive components
- `apps/web/src/components/ui/toast.tsx`

---

#### Task 2.15: Keyboard Shortcuts

**Estimate:** 2-3 hours
**Priority:** P2

**Subtasks:**

- [ ] Implement keyboard shortcut system
- [ ] Add shortcuts:
  - [ ] Space: play/pause
  - [ ] R: regenerate selected section
  - [ ] L: lock/unlock selected section
  - [ ] E: export preview
  - [ ] ?: show shortcut cheatsheet
- [ ] Display cheatsheet modal
- [ ] Handle shortcut conflicts
- [ ] Add visual indicators (tooltips with shortcuts)

**Acceptance Criteria:**

- All shortcuts work as expected
- Cheatsheet modal accessible via ?
- Tooltips show shortcuts
- No conflicts with browser shortcuts

**Files to Create:**

- `apps/web/src/hooks/use-keyboard-shortcuts.ts`
- `apps/web/src/components/shortcut-cheatsheet.tsx`

---

#### Task 2.16: Performance Testing & Optimization

**Estimate:** 3-4 hours
**Priority:** P2

**Subtasks:**

- [ ] Measure TTFP (Time to First Preview) - target: ≤45s P50
- [ ] Measure per-section regen time - target: ≤20s P50
- [ ] Profile WebAudio engine performance
- [ ] Test with large projects (10+ sections)
- [ ] Test concurrent job handling
- [ ] Optimize bundle size (code splitting)
- [ ] Add performance monitoring
- [ ] Document baseline metrics

**Acceptance Criteria:**

- TTFP meets target (≤45s P50)
- Section regen meets target (≤20s P50)
- Audio playback smooth (no dropouts)
- UI responsive during heavy load
- Bundle size optimized
- Metrics documented in DEVELOPMENT_LOG.md

**Files to Create:**

- `docs/development/SPRINT_2_METRICS.md`

---

#### Task 2.17: Component Tests

**Estimate:** 4-5 hours
**Priority:** P2

**Subtasks:**

- [ ] Set up Vitest for component testing
- [ ] Install React Testing Library
- [ ] Add tests for:
  - [ ] LyricsInput component
  - [ ] GenreSelector component
  - [ ] ArtistSelector component
  - [ ] StructureGrid component
  - [ ] SectionCard component
  - [ ] JobTimeline component
- [ ] Test user interactions (clicks, typing)
- [ ] Test error states
- [ ] Test loading states
- [ ] Target 70% coverage for components

**Acceptance Criteria:**

- All components have tests
- User interactions tested
- Error/loading states covered
- Coverage ≥70%

**Files to Create:**

- `apps/web/src/components/*.test.tsx`
- `apps/web/vitest.config.ts`

---

#### Task 2.18: Documentation Update

**Estimate:** 2 hours
**Priority:** P3

**Subtasks:**

- [ ] Update `docs/development/DEVELOPMENT_LOG.md`:
  - [ ] Document Sprint 2 completion
  - [ ] Record architectural decisions
  - [ ] Note integration patterns
  - [ ] List lessons learned
  - [ ] Performance baselines
- [ ] Update `README.md` with frontend setup instructions
- [ ] Document component architecture
- [ ] Add WebAudio engine documentation
- [ ] Document known issues/limitations

**Files to Modify:**

- `docs/development/DEVELOPMENT_LOG.md`
- `README.md`
- `docs/development/SPRINT_2_LEARNINGS.md` (new)

---

## Task Priority Matrix

### 🔴 Critical Path (Must Complete)

1. Task 2.1 - Next.js Setup
2. Task 2.2 - API Client
3. Task 2.3 - SSE Client
4. Task 2.4 - Core UI Components
5. Task 2.5 - Workspace Page
6. Task 2.6 - WebAudio Transport
7. Task 2.7 - WebAudio Mixer
8. Task 2.9 - Section Music Regen
9. Task 2.10 - Section Vocal Regen

### 🟡 High Priority (Needed for Good UX)

10. Task 2.8 - Section Lock/Unlock
11. Task 2.11 - A/B Comparison
12. Task 2.12 - Export Preview Flow
13. Task 2.13 - Error Handling
14. Task 2.14 - Optimistic UI

### 🟢 Medium Priority (Polish)

15. Task 2.15 - Keyboard Shortcuts
16. Task 2.16 - Performance Testing
17. Task 2.17 - Component Tests
18. Task 2.18 - Documentation

---

## Recommended Execution Order

**Week 1: Frontend Foundation**

- Day 1-2: Tasks 2.1, 2.2, 2.3 (Next.js + API client + SSE)
- Day 3-4: Task 2.4 (Core UI components)
- Day 5: Task 2.5 (Workspace page integration)

**Week 2: Audio Engine + Section Regen**

- Day 6-7: Tasks 2.6, 2.7 (WebAudio transport + mixer)
- Day 8: Task 2.8, 2.9 (Lock + music regen)
- Day 9: Task 2.10, 2.11 (Vocal regen + A/B)
- Day 10: Tasks 2.12-2.18 (Polish, testing, docs)

---

## Definition of Done (Sprint 2)

**Functional:**

- [ ] User can paste lyrics and generate preview
- [ ] User can lock sections to prevent regeneration
- [ ] User can regenerate individual sections (music + vocals)
- [ ] User can A/B compare previous and current versions
- [ ] User can play/pause/mute individual tracks
- [ ] User can export preview (WAV/MP3)
- [ ] Job progress updates in real-time via SSE
- [ ] WebAudio mixer works offline (no GPU calls for A/B)

**Technical:**

- [ ] TTFP ≤45s P50 (measured and documented)
- [ ] Section regen ≤20s P50 (measured and documented)
- [ ] Test coverage ≥70%
- [ ] 0 TypeScript errors
- [ ] 0 ESLint errors
- [ ] No memory leaks in audio engine

**Quality:**

- [ ] No audio artifacts (sync drift, clicks, pops)
- [ ] UI responsive (no freezing during render)
- [ ] Errors handled gracefully with helpful messages
- [ ] Works in Chrome, Safari, Firefox
- [ ] Keyboard shortcuts functional

**Documentation:**

- [ ] DEVELOPMENT_LOG.md updated with Sprint 2 learnings
- [ ] Performance baselines documented
- [ ] Component architecture documented
- [ ] Known issues/limitations noted
- [ ] Demo video recorded (optional)

---

## Risk Mitigation

**Risk:** WebAudio sync drift between tracks
**Mitigation:** Central transport clock; pre-roll buffer; sample-aligned mixing; zero-crossing detection

**Risk:** Section regen exceeds 20s P50
**Mitigation:** Profile workers; optimize S3 uploads; implement stem caching; reduce job overhead

**Risk:** Audio artifacts in playback (clicks, pops)
**Mitigation:** Buffer pre-loading; crossfades; ramp gain changes; use exponential ramping for fades

**Risk:** Frontend state management complexity
**Mitigation:** Keep state local to workspace; use React Query for server state; minimize global state

**Risk:** SSE connection drops during long renders
**Mitigation:** Heartbeat every 15s; exponential backoff; resume from last event ID; show connection status

**Risk:** Memory leaks in audio engine
**Mitigation:** Cleanup AudioNodes on unmount; disconnect all nodes; clear buffer cache; use WeakMap where possible

---

## Sprint Dependencies

**External:**

- Sprint 0 ✅ Complete (queue system, SSE, database)
- Sprint 1 ✅ Complete (workers, API endpoints, stubs)

**Internal (Sprint 2):**

- Week 1 blocks Week 2 (frontend foundation required for audio engine)
- Task 2.7 (Mixer) depends on Task 2.6 (Transport)
- Task 2.11 (A/B) depends on Task 2.7 (Mixer)
- Tasks 2.9, 2.10 (Section regen) depend on Task 2.8 (Lock/unlock)

---

## Success Criteria

**User Experience:**

- ✅ Lyrics → preview flow completes in ≤45s
- ✅ Section regeneration feels fast (≤20s perceived)
- ✅ A/B comparison instant (<100ms switch)
- ✅ Audio playback smooth (no dropouts)
- ✅ UI never freezes during renders
- ✅ Error messages clear and actionable

**Technical Quality:**

- ✅ All critical path tasks complete
- ✅ Performance targets met (TTFP, regen time)
- ✅ Test coverage ≥70%
- ✅ No console errors in production
- ✅ Lighthouse score ≥90 for performance

**Deliverables:**

- ✅ Working Next.js workspace
- ✅ WebAudio local preview engine
- ✅ Section lock/regen workflow
- ✅ A/B comparison mode
- ✅ Export download flow
- ✅ Updated documentation

---

## Next Sprint Preview (Sprint 3)

**Sprint 3 Focus:** Remix feature implementation (reference upload, feature extraction, similarity checking, export gating)

**Key Deliverables:**

- Reference audio upload (≤30s)
- Analyzer pod: extract RemixFeatures (key/BPM/contour/rhythm)
- Melody Generator pod: guided composition
- Similarity Checker pod: interval n-grams + DTW
- Export gating based on similarity verdicts
- Similarity report UI with recommendations

**Blockers to Resolve Before Sprint 3:**

- [ ] Sprint 2 Definition of Done met
- [ ] Performance baselines documented
- [ ] WebAudio engine stable and tested
- [ ] Frontend state management patterns established

---

## Notes

**Development Philosophy for Sprint 2:**

- **Iterative UX First:** Build for the 80% use case, polish edge cases later
- **Performance Budget Conscious:** Profile early, optimize proactively
- **Audio Quality Non-Negotiable:** No sync drift, no clicks, no artifacts
- **Fail Fast on Errors:** Surface errors immediately with clear recovery paths
- **Document as You Build:** Update DEVELOPMENT_LOG.md after each major task

**Team Communication:**

- Daily standups: What shipped? What's blocked?
- Mid-sprint check-in: Are we on track for DoD?
- End-sprint retro: What worked? What to improve?

**Quality Gates:**

- PR review required for all code
- TypeScript strict mode enforced
- ESLint errors block merge
- Test coverage checked in CI
- Performance regression tests before merge

---

**Sprint Owner:** Mike Blakeway
**Last Updated:** 12 Dec 2025
**Status:** Ready for Sprint Planning
