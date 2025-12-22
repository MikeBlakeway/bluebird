# Sprint Status

**Date:** December 2025
**Status:** Sprint 2 Complete; Sprint 3 Planning

---

## Current Status

### Sprint 0: Foundation ✅ COMPLETE

**Shipped:** v0.1.0 (November 2024)

- Auth (magic link), database schema (Prisma), planning endpoints
- BullMQ queue architecture, Redis, MinIO S3 storage
- SSE event streaming foundation
- CLI tool (`bluebird plan`)
- Monorepo structure (pnpm workspaces)

**Quality:** 78 tests passing, 60%+ coverage

---

### Sprint 1: Backend Preview Pipeline ✅ COMPLETE

**Shipped:** v0.2.0 (January 2025)

**Completed (Backend):**

- Music synthesis worker with S3 storage
- Voice synthesis worker with S3 storage
- Mix worker combining music + vocals
- Export worker (master + stems + metadata)
- Integration tests (plan flow + preview flow)
- TTFP baseline: ~42s (within 45s target)

**Quality:** 127 tests passing, 60%+ coverage, 0 TypeScript/ESLint errors

---

### Sprint 2: Frontend + Section Regeneration ✅ COMPLETE

**Shipped:** v0.3.0 (December 2025)

**Sprint Goal:**
Complete frontend workspace UI (deferred from Sprint 1) + add section-level regeneration, local WebAudio preview/mixing, and A/B comparison capabilities.

**Progress:** 15 of 15 tasks complete (100%); all sprint 2 goals achieved

**Completed Tasks:**

- ✅ Task 2.1: Next.js workspace setup (apps/web with App Router, Tailwind, routing)
- ✅ Task 2.2: shadcn/ui components (shared UI package)
- ✅ Task 2.3: API client hardening (Idempotency-Key + Zod validation)
- ✅ Task 2.4: SSE client with reconnection + hook
- ✅ Task 2.5: Audio State Management (Zustand store, AudioEngine integration)
- ✅ Task 2.6: Export Modal (job timeline, download links, error handling)
- ✅ Task 2.7: Audio Loading & Error Handling (presigned URLs, retry logic, user feedback)
- ✅ Task 2.8: E2E Test Foundation (Playwright, Page Object Models, test fixtures)
- ✅ Task 2.9: Section Lock/Unlock (per-section state, lock icon, prevent regen of locked sections)
- ✅ Task 2.10: Per-Section Regeneration (music + vocals synthesis per section)
- ✅ Task 2.11: A/B Comparison (WebAudio local comparison, no GPU cost)
- ✅ Task 2.12: Optimistic UI Updates (toast notifications, skeleton loaders, state management)
- ✅ Task 2.13: Keyboard Shortcuts (Space/L/R/arrows/?, Help panel, comprehensive tests)
- ✅ Task 2.14: Integration Testing (SSE flow, regen, WebAudio, export API integration)
- ✅ Task 2.15: Performance Validation (TTFP, section regen, WebAudio, bundle size, Lighthouse)

**Key Achievements:**

- Frontend workspace operational (lyrics → preview flow working)
- Per-section regeneration: ≤20s P50
- WebAudio A/B comparison: instant, no GPU cost
- Keyboard shortcuts: Space, L, R, arrows, ?
- Optimistic UI with toast feedback
- Test coverage: ≥70% across frontend modules

---

### Sprint 3: Real Model Integration & Advanced Features 🔄 PLANNING

**Target:** v0.4.0 (January–February 2026)

**Duration:** 3–4 weeks

**Sprint Goal:**
Replace placeholder stubs with real synthesis models (music/voice), implement reference-guided remix (similarity-guarded), add export gating with similarity verdict, and achieve production-ready performance targets.

**Inference Strategy (Refined Dec 22):**

To support solo developer + zero-cost MVP:

- **Separate `bluebird-infer` repo** (Python, FastAPI, Poetry)
- **Music:** Procedural synthesis (drums/bass/guitar, <2s per section)
- **Voice:** Coqui TTS (open-source, multi-speaker, <5s per section)
- **Features:** librosa (key/BPM/contour/IOI extraction)
- **Similarity:** Pure logic (n-gram Jaccard, DTW, hard rules, no model)
- **Cost:** Zero (all open-source, no API bills)
- **Determinism:** Seed-based for reproducibility + caching

**Key Features:**

1. **Inference Repo Setup** (E3.0: Poetry, Docker, shared libs)
2. **Feature Extraction Pod** (E3.1: librosa-based analyzer)
3. **Music & Voice Synthesis** (E3.2–E3.3: procedural + Coqui TTS)
4. **API Worker Integration** (E3.4: music/voice workers in Node)
5. **Reference Upload & Remix** (E3.5–E3.6: ≤30s reference, remix endpoint)
6. **Similarity Checking & Export Gating** (E3.7–E3.8: verdict logic, hard rules)
7. **Performance Measurement** (E3.9: TTFP validation with real models)
8. **Integration Testing & Documentation** (E3.10–E3.11: contract tests, user guide)

**Success Metrics:**

- Music/voice synthesis working with open-source models
- TTFP P50 ≤45s (with real procedural + Coqui models)
- Section regen P50 ≤20s
- Similarity checker with golden fixtures
- Export gating enforced
- Test coverage ≥70%

**Status:** Detailed plan in [sprint_plan_s_3.md](sprint_plan_s_3.md)

---

### Roadmap (Future)

| Sprint | Version | Focus                    | Status      |
| ------ | ------- | ------------------------ | ----------- |
| S0     | v0.1.0  | Foundation & Auth        | ✅ Complete |
| S1     | v0.2.0  | Backend Preview Pipeline | ✅ Complete |
| S2     | v0.3.0  | Frontend + Section Regen | ✅ Complete |
| S3     | v0.4.0  | Real Models + Remix      | 🔄 Planning |
| S4     | v0.5.0  | Duets, Era FX, Pro Tier  | ⏳ Planned  |
| S5+    | v1.0.0  | MVP Completion, DAW-lite | ⏳ Backlog  |

---

## Next Steps (End of Sprint 2 → Sprint 3)

1. Review Sprint 3 detailed plan: [sprint_plan_s_3.md](sprint_plan_s_3.md)
2. Confirm pod availability (music, voice, feature extraction, similarity)
3. Set up feature flags for gradual rollout (remix, export gating)
4. Coordinate with inference pod team on API contracts
5. Plan golden fixtures for similarity testing
6. Begin Week 1 tasks (music + voice integration) immediately after Sprint 2 release

---

## Performance Baselines (Updated)

| Metric               | Sprint 1 | Sprint 2 | Sprint 3 Target | Notes                |
| -------------------- | -------- | -------- | --------------- | -------------------- |
| TTFP P50 (full song) | 42s      | 42s      | ≤45s            | With real models     |
| Section Regen P50    | N/A      | ≤20s     | ≤20s            | Locked sections only |
| WebAudio Preview     | N/A      | Instant  | Instant         | Local, no GPU        |
| GPU Cost/Preview     | N/A      | N/A      | ≤$0.40          | For 30s preview      |
| Test Coverage        | 60%+     | 70%+     | 70%+            | Core modules         |

- Per-section regen P50 ≤20s
- WebAudio A/B comparison works offline
- UI responsive during renders (optimistic updates)
- Test coverage ≥70%
- User can complete full workflow: lyrics → preview → lock section → regen different section → A/B compare → download

**Plan:** [sprint_plan_s_2.md](../project/sprints/sprint_plan_s_2.md)

---

## DevOps Infrastructure (Recently Added)

**Branching Strategy:** Sprint-based GitFlow

- `main`: production releases (tagged v0.X.0)
- `develop`: sprint integration (deploys to staging)
- `feature/f-X.Y-description`: feature development
- `release/vX.Y.Z`: release stabilization
- See [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)

**CI/CD Pipeline:** GitHub Actions with tiered testing

- All branches: lint, typecheck, unit tests, integration tests, contract tests
- `develop`: + E2E tests + deploy to staging
- `release/*`: + E2E tests + security scans
- `main`: + all tests + security scans + deploy to production
- See [CI_CD_GUIDE.md](CI_CD_GUIDE.md)

**Versioning:**

- Each sprint = minor version (Sprint 0: v0.1.0, Sprint 1: v0.2.0, Sprint 2: v0.3.0)
- Hotfixes = patch version (v0.2.0 → v0.2.1)

**Deployment:**

- Staging: `develop` push → <https://staging.bluebird.app>
- Production: `main` push → <https://bluebird.app>

---

## Quality Metrics Trends

| Metric                  | Sprint 0 | Sprint 1 | Sprint 2 Target |
| ----------------------- | -------- | -------- | --------------- |
| **Tests Passing**       | 78       | 127      | 200+            |
| **Coverage**            | 60%      | 60%      | 70%             |
| **TypeScript Errors**   | 0        | 0        | 0               |
| **ESLint Errors**       | 0        | 0        | 0               |
| **TTFP (P50)**          | N/A      | ~42s     | ≤45s            |
| **Section Regen (P50)** | N/A      | N/A      | ≤20s            |

---

## Technical Debt

**Acceptable (Documented):**

- Music/voice synthesis using stubs (click patterns, sine tones)
  - **Plan:** Replace with real models in Sprint 3+
  - **Impact:** Low (backend contracts stable, stub swap is isolated)

- GitHub Actions environment blocks commented out
  - **Plan:** Uncomment after creating staging/production environments in GitHub repo settings
  - **Impact:** Low (deployments will 404 until environments created)

- E2E tests not implemented
  - **Plan:** Add in Sprint 2 (Playwright framework ready)
  - **Impact:** Medium (manual testing required for now)

**To Address in Sprint 2:**

- Increase test coverage from 60% → 70%
- Add E2E tests for complete user flows
- Implement actual UI components (currently no frontend)

---

## Current Working State

**Git Status:**

- Branch: `main`
- Latest Commit: DevOps infrastructure (branching, CI/CD, deployment docs)
- Clean working tree (all changes committed)

**Next Actions:**

1. Switch to `develop` branch
2. Create feature branches for Sprint 2 work
3. Begin frontend foundation (Task 2.1: Next.js setup)

**Commands:**

```bash
git checkout develop
git pull origin develop
git checkout -b feature/f-2.1-nextjs-setup
```

---

## Sprint 2 Kickoff Checklist

**Documentation:**

- ✅ Sprint 1 scope change documented
- ✅ Sprint 2 plan updated with deferred work
- ✅ Branching strategy in place
- ✅ CI/CD pipeline functional
- ✅ AI agent instructions updated

**Infrastructure:**

- ✅ `develop` branch exists
- ✅ CI/CD pipeline tests on all branches
- ⏳ Create GitHub environments (staging, production) - manual step
- ⏳ Create Dockerfiles for apps/api and apps/web - Sprint 2 task

**Team Readiness:**

- ✅ Solo developer (Mike) ready to start Sprint 2
- ✅ Backend contracts stable (workers tested, DTOs finalized)
- ✅ AI agents configured with project context

**Sprint 2 Ready to Start:** ✅

---

## Key Decisions Made

**Sprint 1 Scope:**

- ✅ Focus on backend quality over frontend speed
- ✅ Defer frontend to Sprint 2 (no project delay)
- ✅ Establish DevOps infrastructure before multi-developer work

**Version Strategy:**

- ✅ Each sprint = minor version bump
- ✅ Sprint 0: v0.1.0, Sprint 1: v0.2.0, Sprint 2: v0.3.0
- ✅ Ship to `main` only at sprint completion

**Testing Strategy:**

- ✅ Unit + integration for backend (Vitest)
- ✅ E2E for frontend (Playwright, Sprint 2+)
- ✅ Contract tests for API stability (OpenAPI snapshots)
- ✅ 60% coverage minimum, 70% target

**Deployment Strategy:**

- ✅ Auto-deploy `develop` → staging
- ✅ Auto-deploy `main` → production
- ✅ Release branches for stabilization before production

---

## References

**Sprint Documentation:**

- [Sprint 2 Plan](../project/sprints/sprint_plan_s_2.md)
- [Release Notes - v0.3.0](../releases/v0.3.0.md)
- [Release Notes - v0.2.0](../releases/v0.2.0.md)

**DevOps:**

- [Branching Strategy](BRANCHING_STRATEGY.md)
- [CI/CD Guide](CI_CD_GUIDE.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

**Development:**

- [Development Log](DEVELOPMENT_LOG.md)
- [TTFP Baseline](TTFP_BASELINE.md)

**Project:**

- [Features](../project/FEATURES.MD)
- [Architecture Overview](../project/OVERVIEW.MD)
- [Non-Functional Requirements](../project/requirements/Non-Functional-Requirements.md)

---

**Status:** Ready for Sprint 2 🚀
