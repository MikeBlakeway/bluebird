# Contributing to Bluebird

## Development Workflow

### Before Starting

1. **Understand the scope:** Check `docs/project/FEATURES.MD` for feature IDs and acceptance criteria
2. **Read agent guidance:** Review `.github/copilot-instructions.md` or `AGENTS.MD` for coding patterns and conventions
3. **Check development memory:** See `docs/development/DEVELOPMENT_LOG.md` for completed work and lessons learned

### Branches

- **main**: Release-ready code. Protected branch—requires PR review.
- **develop**: Integration branch. All feature branches merge here first.
- **feature/***: Feature branches for new features (e.g., `feature/F-MVP-GEN-01-arrangement-planner`)
- **bugfix/***: Bugfix branches (e.g., `bugfix/sse-reconnect-timeout`)
- **chore/***: Maintenance, docs, tooling (e.g., `chore/upgrade-prettier`)

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `chore`: Maintenance, deps, tooling
- `refactor`: Code restructuring (no feature change)
- `perf`: Performance improvement
- `test`: Add or update tests

**Scope examples:** `api`, `web`, `worker`, `similarity`, `sse`, `types`

**Subject:**

- Imperative mood: "add" not "adds" or "added"
- No period at end
- Max 50 characters

**Body:**

- Explain *what* and *why*, not *how*
- Wrap at 72 characters
- Reference issues: "Fixes #123" or "Related to F-MVP-GEN-01"

**Example:**

```text
feat(api): add idempotency-key validation to /render/section

Validates Idempotency-Key header on all POST endpoints to prevent
duplicate job submissions and ensure exactly-once semantics.
Enforces UUID v4 format via Zod schema.

Related to F-MVP-GEN-02: Section regeneration
```

### Making Changes

#### 1. Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/F-MVP-GEN-01-arrangement-planner
```

#### 2. Write Code & Tests

- Follow patterns in `.github/copilot-instructions.md`
- Write tests alongside code (Vitest for Node, PyTest for Python)
- Keep commits atomic and logical

#### 3. Validate

```bash
# Node (web + api)
pnpm test
pnpm test:integration
pnpm test:e2e

# Python (pods)
cd ../bluebird-infer
poetry run pytest

# Linting & formatting
pnpm lint
pnpm format
```

#### 4. Update Development Memory

After completing a feature or sprint:

1. **Update `docs/development/DEVELOPMENT_LOG.md`:**
   - What was completed
   - Architectural decisions made
   - Integration points created
   - Performance/cost observations
   - Lessons learned & anti-patterns avoided

2. **Update `.github/copilot-instructions.md` §11:**
   - Add new patterns that worked
   - Record gotchas for future reference

**Example entry:**

```markdown
## Sprint 1: Preview Path (Dec 12–23)
- Integrated SSE for realtime job progress; heartbeat every 15s with exp backoff
- WebAudio transport synced to buffer position; pre-roll 512 samples to avoid clicks
- Music/Voice synth stubs emit click patterns + sine tones aligned to syllables
- Performance baseline: 12s (planner) + 20s (music) + 8s (voice) + 2s (mix) = 42s TTFP (under 45s budget)
- Learned: Must extract reference features BEFORE melody generation; order matters for budget control
```

#### 5. Commit & Push

```bash
git add <files>
git commit -m "feat(web): add WebAudio mixer with A/B compare

Implements per-track gain/mute/pan controls and era preset selection.
Local preview allows instant A/B comparison without GPU job.

Performance: A/B switch <50ms latency; no new inference calls.
"

git push origin feature/F-MVP-GEN-01-arrangement-planner
```

#### 6. Create Pull Request

- **Title:** Use conventional commit format
- **Description:** Link to feature ID (e.g., "Implements F-MVP-GEN-01")
- **Checklist:**
  - [ ] Tests pass locally (`pnpm test`)
  - [ ] Linting passes (`pnpm lint`)
  - [ ] Follows patterns in `.github/copilot-instructions.md`
  - [ ] Updates development memory (`DEVELOPMENT_LOG.md`)
  - [ ] Documentation updated (README, inline comments)

#### 7. Code Review & Merge

- Address feedback; push updates to same branch
- Once approved, squash-merge to `develop` (keeps history clean)
- Delete feature branch after merge

### Merging to Main (Release)

1. Ensure all tests pass on `develop`
2. Create PR from `develop` → `main` with release notes
3. Require 2 approvals for main
4. After merge, tag release: `git tag -a v0.1.0 -m "MVP Sprint 0 release"`

## Testing Standards

### Node (apps/api, apps/web, packages/*)

- **Unit:** Vitest + React Testing Library (≥80% coverage for critical paths)
- **Contract:** OpenAPI snapshot tests (must pass diff check in CI)
- **Integration:** Testcontainers with real PG/Redis/MinIO
- **E2E:** Playwright (user flows: signup→lyrics→preview→export)

### Python (bluebird-infer)

- **Unit:** PyTest + Hypothesis (property-based for n-grams, DTW)
- **Golden:** WAV fixtures (10–30s) with expected features/verdicts
- **Integration:** Spin pods in CI; call /run with S3 objects
- **Benchmark:** pytest-benchmark; hold GPU cost budget ≤$0.40/30s

## Code Quality

### Linting & Formatting

```bash
# Format all code
pnpm format

# Run ESLint
pnpm lint

# Check types
pnpm typecheck
```

### TypeScript Strict Mode

All code must be strict TypeScript:

- No `any`
- No implicit `any`
- All function params/returns typed
- Use branded types (e.g., `type ProjectId = string & { readonly brand: "ProjectId" }`) for IDs

### Documentation

- **Inline comments:** Explain *why*, not *what*

  ```ts
  // GOOD: Explains non-obvious behavior
  // NOTE: Must extract features BEFORE melody generation; order matters for cost budget

  // BAD: States the obvious
  // increment counter
  counter++
  ```

- **Public APIs:** JSDoc with examples

  ```ts
  /**
   * Compute similarity between two melodies.
   * @param ref - Reference melody features
   * @param gen - Generated melody features
   * @returns Similarity score [0, 1]; higher = more similar
   * @example
   * const score = similarity(ref, gen); // 0.31 (pass)
   */
  ```

## Release Process

1. **Version:** Follow [Semantic Versioning](https://semver.org/)
   - MAJOR: Breaking changes (API contract changes)
   - MINOR: New features, non-breaking
   - PATCH: Bug fixes

2. **Changelog:** Add entry to `docs/CHANGELOG.md` before release

3. **Tag & Release:**

   ```bash
   git tag -a v0.2.0 -m "Sprint 1 complete: Preview path with WebAudio"
   git push origin v0.2.0
   ```

## Debugging & Help

- **Agent guidance:** `.github/copilot-instructions.md` §11 (Knowledge for Development)
- **Development history:** `docs/development/DEVELOPMENT_LOG.md`
- **API contracts:** `docs/project/requirements/Method.md`
- **Feature scope:** `docs/project/FEATURES.MD`
- **Performance budget:** `docs/project/requirements/Non-Functional-Requirements.md`

---

**Questions?** Check the README or open an issue referencing the relevant feature ID (e.g., F-MVP-GEN-01).
