# Sprint 2 Tasks: Frontend Foundation & Section Regeneration

**Sprint Duration:** 2 weeks
**Sprint Goal:** Complete frontend workspace UI (deferred from Sprint 1) + section-level regeneration
**Target Version:** v0.3.0

---

## Task Status Legend

- 🔲 Not Started
- 🔄 In Progress
- ✅ Complete
- ⏭️ Blocked

---

## Part 1: Deferred Frontend Work (Sprint 1 Tasks 2.1-2.8)

### Task 2.1: Next.js Workspace Setup ✅

**Estimate:** 2-3 hours
**Actual:** 1.5 hours
**Priority:** Critical (blocks all other frontend work)

**Completed:**

- [x] Next.js 15 App Router configured in `apps/web`
- [x] TypeScript strict mode enabled
- [x] Tailwind CSS configured with design tokens
- [x] Basic routing structure: `/`, `/studio/:projectId`, `/studio/:projectId/:takeId`
- [x] Layout with header/navigation
- [x] Environment variables for API URL
- [x] Hot reload working
- [x] Build passes with 0 errors

**Files Created:**

- `apps/web/next.config.js` - Next.js configuration (ESM)
- `apps/web/tailwind.config.ts` - Tailwind with shadcn design tokens
- `apps/web/postcss.config.js` - PostCSS with Tailwind/Autoprefixer
- `apps/web/src/app/layout.tsx` - Root layout with header/footer
- `apps/web/src/app/page.tsx` - Home page (marketing)
- `apps/web/src/app/globals.css` - Global styles with CSS variables
- `apps/web/src/app/studio/new/page.tsx` - New composition page (stub)
- `apps/web/src/app/studio/[projectId]/page.tsx` - Project studio (stub)
- `apps/web/src/app/studio/[projectId]/[takeId]/page.tsx` - Take editor (stub)
- `apps/web/src/lib/utils.ts` - cn() utility for class merging
- `apps/web/.env.local` - Local environment variables
- `apps/web/.env.example` - Environment variable template

**Dependencies Added:**

- tailwindcss@^3.4.0
- postcss@^8.4.32
- autoprefixer@^10.4.16
- clsx@^2.1.0
- tailwind-merge@^2.2.0

**Build Output:**

- Bundle size: ~102 kB First Load JS
- 5 routes: /, /studio/new, /studio/[projectId], /studio/[projectId]/[takeId], /\_not-found
- Build time: ~2.5s
- Dev server: http://localhost:3000

**Branch:** `feature/f-2.1-nextjs-setup`

**Status:** ✅ **COMPLETE** (merged to develop)

---

### Task 2.2: shadcn/ui Component Library ✅

**Estimate:** 2-3 hours
**Priority:** High (needed for all UI components)

**Completed:**

- [x] shadcn/ui initialized in `apps/web`
- [x] Core components installed: Button, Input, Card, Select, Slider, Dialog
- [x] Shared components moved to `packages/ui`
- [x] Theme switching (light/dark mode) working
- [x] Component testing with Vitest + Testing Library

**Files to Create/Modify:**

- `apps/web/components/ui/*` - shadcn components
- `packages/ui/src/components/*` - Shared components
- `apps/web/src/lib/utils.ts` - cn() utility
- `apps/web/src/app/globals.css` - Global styles with CSS variables

**Dependencies:**

- @radix-ui/react-\* (various)
- class-variance-authority
- clsx
- tailwind-merge

**Branch:** `feature/f-2.2-shadcn-ui`

**Status:** ✅ **COMPLETE** (merged to develop)

---

### Task 2.3: API Client Package ✅

**Estimate:** 3-4 hours
**Actual:** 4 hours (including schema additions and comprehensive testing)
**Priority:** High (needed for data fetching)

**Completed:**

- [x] `packages/client` exports typed API client
- [x] All endpoints typed from `@bluebird/types`
- [x] Fetch wrapper with error handling
- [x] Automatic `Idempotency-Key` injection for POSTs
- [x] Request/response validation with Zod
- [x] Retry logic for transient failures (500/429 errors, exponential backoff)
- [x] Client-side logging (debug mode with custom logger support)
- [x] Unit tests for all client methods (31 tests, 100% passing)

**Files Created/Modified:**

- `packages/client/src/index.ts` - Main client with all API methods
- `packages/client/src/index.test.ts` - Comprehensive test suite (31 tests)
- `packages/types/src/index.ts` - Added 4 new schemas:
  - `RenderSectionRequestSchema`
  - `UploadReferenceRequestSchema`
  - `CheckSimilaritySimpleRequestSchema`
  - `ExportTakeRequestSchema`

**API Methods Implemented:**

```typescript
// Auth
requestMagicLink(email)
verifyMagicLink(token)

// Projects
createProject(input)
getProject(projectId)
updateProject(projectId, input)
deleteProject(projectId)
listProjects()

// Planning & Rendering
planSong(request)
renderPreview(request)
renderMusic(request)
renderVocals(request)
renderSection(request) // NEW - Section-level regeneration

// Remix & Similarity
uploadReference(request) // NEW - Reference audio upload
checkSimilarity(planId) // NEW - Similarity checking

// Export & Mix
exportPreview(request)
exportTake(request) // NEW - Export with stems/markers
mixFinal(request) // NEW - Final mix

// Job Events
getJobEventsUrl(jobId) // SSE URL generator
subscribeToJobEvents(jobId, callbacks) // EventSource wrapper
```

**Quality Metrics:**

✅ Tests: 31/31 passing (100%)
✅ TypeScript: 0 errors
✅ ESLint: 0 errors, 0 warnings
✅ Coverage: All methods tested with error scenarios
✅ Build: Successful (dist/index.js + dist/index.d.ts)

**Branch:** `feature/f-2.3-api-client` (merged to develop)

**Status:** ✅ **COMPLETE**

---

### Task 2.4: SSE Client with Reconnection ✅

**Estimate:** 2-3 hours
**Priority:** High (needed for job progress)

**Acceptance Criteria:**

- [x] EventSource wrapper with automatic reconnection
- [x] Exponential backoff (500ms → 8s max)
- [x] Heartbeat detection (15s timeout)
- [x] Type-safe event parsing from `@bluebird/types`
- [x] React hook: `useJobEvents(jobId)`
- [ ] State management for job timeline (deferred)
- [x] Error handling for connection failures
- [x] Unit tests for reconnection logic

**Files to Create/Modify:**

- `apps/web/src/lib/sse-client.ts` - EventSource wrapper
- `apps/web/src/hooks/use-job-events.ts` - React hook
- `apps/web/src/lib/sse-client.test.ts` - Tests

**Integration:**

- Consume events from `GET /jobs/:jobId/events`
- Update UI timeline as events arrive
- Handle connection drops gracefully

**Branch:** `feature/f-2.4-sse-client`

**Status:** ✅ **COMPLETE** (merged to develop)

---

### Task 2.5: WebAudio Preview Engine ✅

**Estimate:** 4-5 hours
**Actual:** 5 hours (including waveform visualization and comprehensive testing)
**Priority:** High (core feature)

**Completed:**

- [x] WebAudio context with per-track gain nodes
- [x] Transport controls (play, pause, stop, seek)
- [x] Waveform visualization with peaks
- [x] A/B comparison mode (version switching without GPU calls)
- [x] Mute/solo per track
- [x] Master volume control
- [x] Time sync across all tracks
- [x] Pre-roll handling to avoid clicks (512 samples with gain ramping)
- [x] Audio buffer caching
- [x] React hook: `useAudioEngine()`

**Files Created:**

- `apps/web/src/lib/audio-engine.ts` - Core WebAudio logic with A/B versioning
- `apps/web/src/lib/peaks.ts` - Peak extraction for waveform visualization
- `apps/web/src/hooks/use-audio-engine.ts` - React integration hook
- `apps/web/src/components/Waveform.tsx` - Waveform visualization component
- `apps/web/src/lib/audio-engine.test.ts` - Audio engine tests (28 tests)
- `apps/web/src/hooks/use-audio-engine.test.ts` - Hook tests (18 tests)
- `apps/web/src/components/Waveform.test.tsx` - Waveform tests (12 tests)
- `apps/web/src/lib/peaks.test.ts` - Peak extraction tests
- `apps/web/test/setup.ts` - Updated with ResizeObserver mock

**Key Features Implemented:**

Architecture

- WebAudio graph: AudioContext → Master Gain → Track Gains → Sources
- Per-track version storage (A/B) with independent buffers and peaks
- Pre-roll system: 512 samples (10.67ms at 48kHz) with linear gain ramp
- Time sync: RequestAnimationFrame loop for sub-frame precision

A/B Comparison

- setActiveVersion(version: 'A' | 'B') - Seamless version switching
- Preserves playback position and state when switching
- Independent buffers and peaks per version
- No GPU calls required for A/B switching

Waveform Visualization

- Canvas-based rendering with device pixel ratio support
- Interactive seek on click
- Playback cursor and progress coloring
- Overlay mode for A/B comparison (semi-transparent waveform B)
- Hover tooltip with time display
- Responsive resize handling via ResizeObserver

Pre-roll System

- Prevents audio clicks when seeking mid-track
- 512-sample offset (configurable via preRollSamples config)
- Linear gain ramp from 0 to target gain over ramp duration
- Automatically disabled when playing from start (position 0)

**Quality Metrics:**

✅ Tests: 79/79 passing (100%)
✅ TypeScript: 0 errors
✅ ESLint: 0 errors
✅ Test Coverage: All audio engine methods + hook behaviors + waveform rendering
✅ Browser Compatibility: Modern browsers with Web Audio API support

**Branch:** `feature/f-2.5-webaudio-engine`

**Status:** ✅ **COMPLETE**

---

### Task 2.6: Lyrics Input & Controls 🔲

**Estimate:** 3-4 hours
**Priority:** High (entry point for user workflow)

**Acceptance Criteria:**

- [ ] Lyrics textarea with line numbering
- [ ] Genre selection dropdown (from predefined list)
- [ ] AI artist selection (stub: 3-5 placeholder artists)
- [ ] Form validation (min 4 lines, max 100 lines)
- [ ] "Generate Preview" button with loading state
- [ ] Optimistic UI updates (disable during job)
- [ ] Error handling with user-friendly messages
- [ ] Integration with API client `/plan/song`

**Files to Create/Modify:**

- `apps/web/src/components/LyricsInput.tsx`
- `apps/web/src/components/GenreSelect.tsx`
- `apps/web/src/components/ArtistSelect.tsx`
- `apps/web/src/components/GenerateButton.tsx`
- `apps/web/src/test/LyricsInput.test.tsx`

**UI Mockup:**

```
┌─────────────────────────────────────┐
│ Lyrics (paste or type)              │
│ ┌─────────────────────────────────┐ │
│ │ 1 | Verse line 1...             │ │
│ │ 2 | Verse line 2...             │ │
│ └─────────────────────────────────┘ │
│ Genre: [Pop ▼] Artist: [Aria ▼]    │
│ [Generate Preview]                   │
└─────────────────────────────────────┘
```

**Branch:** `feature/f-2.6-lyrics-input`

---

### Task 2.7: Job Timeline Visualization 🔲

**Estimate:** 3-4 hours
**Priority:** Medium (nice-to-have for Sprint 2)

**Acceptance Criteria:**

- [ ] Timeline component showing job stages
- [ ] Real-time updates from SSE events
- [ ] Progress indicators (spinner, percentage)
- [ ] Stage labels: Planning → Music → Vocals → Mixing → Done
- [ ] Estimated time remaining (based on TTFP baseline)
- [ ] Error states with retry option
- [ ] Collapsible details panel
- [ ] Accessible (ARIA labels, keyboard nav)

**Files to Create/Modify:**

- `apps/web/src/components/JobTimeline.tsx`
- `apps/web/src/components/StageIndicator.tsx`
- `apps/web/src/test/JobTimeline.test.tsx`

**UI Mockup:**

```
Job Progress
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Planning (2s)
✓ Analyzing (1s)
⟳ Music Synthesis (15s / ~20s)
○ Vocal Synthesis
○ Mixing
○ Done
```

**Branch:** `feature/f-2.7-job-timeline`

---

### Task 2.8: E2E Test Foundation 🔲

**Estimate:** 4-5 hours
**Priority:** Medium (CI/CD integration)

**Acceptance Criteria:**

- [ ] Playwright configured in `apps/web`
- [ ] E2E test for: signup → lyrics → preview flow
- [ ] Fixtures for test data (lyrics, genres, artists)
- [ ] Page Object Model for maintainability
- [ ] Visual regression tests (optional)
- [ ] CI integration (runs on develop, release/\*, main)
- [ ] Parallel test execution
- [ ] HTML reporter with screenshots on failure

**Files to Create/Modify:**

- `apps/web/playwright.config.ts`
- `apps/web/tests/e2e/preview-flow.spec.ts`
- `apps/web/tests/e2e/page-objects/*`
- `apps/web/tests/fixtures/*`

**Test Scenarios:**

1. User signs up → lands on workspace
2. User enters lyrics → selects genre/artist → generates preview
3. User sees job progress → hears audio → downloads

**Branch:** `feature/f-2.8-e2e-tests`

---

## Part 2: New Sprint 2 Features

### Task 2.9: Section-Level Lock/Unlock 🔲

**Estimate:** 2-3 hours
**Priority:** High (enables regeneration workflow)

**Acceptance Criteria:**

- [ ] Lock icon on each section in UI
- [ ] Click to toggle lock state
- [ ] Visual indicator (locked sections grayed out)
- [ ] Persist lock state in browser (localStorage)
- [ ] Locked sections excluded from regeneration
- [ ] Keyboard shortcut: `L` to lock/unlock focused section
- [ ] Accessible (screen reader announces lock state)

**Files to Create/Modify:**

- `apps/web/src/components/SectionCard.tsx`
- `apps/web/src/components/LockToggle.tsx`
- `apps/web/src/hooks/useSectionLock.ts`
- `apps/web/src/test/SectionCard.test.tsx`

**Branch:** `feature/f-2.9-section-lock`

---

### Task 2.10: Per-Section Regeneration 🔲

**Estimate:** 4-5 hours
**Priority:** High (key Sprint 2 feature)

**Acceptance Criteria:**

- [ ] "Regen" button on each unlocked section
- [ ] API call to `POST /render/section` with section ID
- [ ] Optimistic UI: show spinner, disable controls
- [ ] SSE updates for section-specific jobs
- [ ] Replace only regenerated section audio in WebAudio graph
- [ ] Cache previous version for A/B comparison
- [ ] P50 latency target: ≤20s
- [ ] Error handling with retry option

**Files to Create/Modify:**

- `apps/web/src/components/RegenButton.tsx`
- `apps/web/src/hooks/useRegenSection.ts`
- `apps/web/src/lib/audio/replaceSection.ts`
- `apps/api/src/routes/render.ts` (update endpoint)
- `apps/api/src/lib/workers/section-worker.ts` (new worker)

**API Contract:**

```typescript
POST /render/section
{
  takeId: string
  sectionIdx: number
  seed?: number // optional: for reproducibility
}
→ { jobId: string }
```

**Branch:** `feature/f-2.10-section-regen`

---

### Task 2.11: A/B Comparison UI 🔲

**Estimate:** 3-4 hours
**Priority:** Medium (enhances user experience)

**Acceptance Criteria:**

- [ ] Toggle between Version A (original) and Version B (regenerated)
- [ ] Seamless switching (no playback interruption)
- [ ] Visual indicator of active version
- [ ] Keyboard shortcut: `A` / `B` to switch
- [ ] Waveform overlay showing differences
- [ ] Works entirely in WebAudio (no GPU calls)
- [ ] Preserves playback position when switching

**Files to Create/Modify:**

- `apps/web/src/components/ABToggle.tsx`
- `apps/web/src/hooks/useABComparison.ts`
- `apps/web/src/lib/audio/abSwitch.ts`

**UI Mockup:**

```
┌─────────────────────────────────┐
│ Section 2: Chorus               │
│ Version: [A] [B*]               │
│ ▶️ ━━━━━━●━━━━━ 0:15 / 0:30    │
└─────────────────────────────────┘
```

**Branch:** `feature/f-2.11-ab-comparison`

---

### Task 2.12: Optimistic UI Updates 🔲

**Estimate:** 2-3 hours
**Priority:** Medium (UX polish)

**Acceptance Criteria:**

- [ ] Disable controls during active jobs (no double-submit)
- [ ] Show skeleton loaders for pending sections
- [ ] Progress indicators on section cards
- [ ] Optimistic state rollback on error
- [ ] Toast notifications for job completion/errors
- [ ] Smooth transitions (no UI jumps)

**Files to Create/Modify:**

- `apps/web/src/components/SkeletonSection.tsx`
- `apps/web/src/components/Toast.tsx`
- `apps/web/src/hooks/useOptimisticUpdate.ts`

**Branch:** `feature/f-2.12-optimistic-ui`

---

### Task 2.13: Keyboard Shortcuts 🔲

**Estimate:** 2 hours
**Priority:** Low (nice-to-have)

**Acceptance Criteria:**

- [ ] Space: Play/Pause
- [ ] L: Lock/unlock focused section
- [ ] R: Regenerate focused section
- [ ] A/B: Switch A/B comparison
- [ ] ↑/↓: Navigate sections
- [ ] Esc: Cancel active job (if possible)
- [ ] Shortcuts panel (? key to show)
- [ ] Don't trigger when typing in inputs

**Files to Create/Modify:**

- `apps/web/src/hooks/useKeyboardShortcuts.ts`
- `apps/web/src/components/ShortcutsPanel.tsx`

**Branch:** `feature/f-2.13-keyboard-shortcuts`

---

## Integration & Testing

### Task 2.14: Integration Testing 🔲

**Estimate:** 3-4 hours
**Priority:** High (quality gate)

**Acceptance Criteria:**

- [ ] Frontend → API integration tests (Testcontainers + Next.js)
- [ ] SSE event flow test (plan → render → complete)
- [ ] WebAudio graph test (load stems, play, A/B switch)
- [ ] Section regeneration test (regen → replace → verify audio)
- [ ] Coverage: ≥70% (up from 60% in Sprint 1)

**Files to Create/Modify:**

- `apps/web/src/test/integration/preview-flow.test.ts`
- `apps/web/src/test/integration/section-regen.test.ts`

**Branch:** `feature/f-2.14-integration-tests`

---

### Task 2.15: Performance Validation 🔲

**Estimate:** 2-3 hours
**Priority:** High (meets SLOs)

**Acceptance Criteria:**

- [ ] TTFP P50 ≤45s (measure with real backend stubs)
- [ ] Section regen P50 ≤20s
- [ ] WebAudio load time <2s for 30s preview
- [ ] UI responsive during jobs (no frame drops)
- [ ] Lighthouse score: Performance >80, Accessibility >90
- [ ] Bundle size <500KB (gzip)

**Validation Method:**

- Load testing with k6 or Playwright
- WebPageTest for real-world metrics
- Lighthouse CI in GitHub Actions

**Branch:** `feature/f-2.15-performance`

---

## Sprint 2 Checklist

**Week 1 Focus:** Deferred Frontend Foundation (Tasks 2.1-2.5)

- [x] Next.js workspace setup (2.1)
- [ ] shadcn/ui components (2.2)
- [ ] API client package (2.3)
- [ ] SSE client (2.4)
- [ ] WebAudio engine (2.5)

**Week 2 Focus:** User Workflow + New Features (Tasks 2.6-2.15)

- [ ] Lyrics input (2.6)
- [ ] Job timeline (2.7)
- [ ] Section lock/unlock (2.9)
- [ ] Section regeneration (2.10)
- [ ] A/B comparison (2.11)
- [ ] Optimistic UI (2.12)
- [ ] E2E tests (2.8)
- [ ] Integration tests (2.14)
- [ ] Performance validation (2.15)

**Optional (if time permits):**

- [ ] Keyboard shortcuts (2.13)
- [ ] Observability (OpenTelemetry browser SDK)
- [ ] Storybook for component docs

---

## Success Metrics

| Metric                | Target        | Measured |
| --------------------- | ------------- | -------- |
| **Tests Passing**     | 200+          | -        |
| **Coverage**          | ≥70%          | -        |
| **TTFP P50**          | ≤45s          | -        |
| **Section Regen P50** | ≤20s          | -        |
| **WebAudio Load**     | <2s           | -        |
| **Bundle Size**       | <500KB (gzip) | -        |
| **Lighthouse Perf**   | >80           | -        |
| **Lighthouse A11y**   | >90           | -        |

---

## Daily Standup Template

**Yesterday:**

- Completed: [Task numbers]
- Progress: [What worked, what didn't]

**Today:**

- Focus: [Task numbers]
- Blockers: [Any issues]

**Metrics:**

- Tests: X/Y passing
- Coverage: Z%
- Build time: N seconds

---

## Sprint 2 Completion Criteria

- [ ] All high-priority tasks complete (2.1-2.6, 2.9-2.10, 2.14-2.15)
- [ ] User can complete workflow: lyrics → preview → lock section → regen section → A/B compare → download
- [ ] Test coverage ≥70%
- [ ] 0 TypeScript/ESLint errors
- [ ] Performance targets met (TTFP ≤45s, section regen ≤20s)
- [ ] E2E tests passing in CI
- [ ] Documentation updated (DEVELOPMENT_LOG.md, SPRINT_2_COMPLETE.md)
- [ ] Ready to merge to `develop` and deploy to staging

---

**Status:** 🔄 **IN PROGRESS** (started: 13 December 2024)
