# Bluebird Branching Strategy

> Purpose: Define a sprint-based branching workflow that integrates with CI/CD and ensures stable releases.

---

## Overview

Bluebird uses a **sprint-based gitflow strategy** where:

- Each sprint corresponds to a version/release
- Development happens on `develop` branch
- Production releases go to `main` branch
- Features are developed in isolated branches

---

## Branch Structure

### Protected Branches

#### `main`

- **Purpose**: Production-ready code; each commit represents a release
- **Protection**:
  - Requires PR review
  - Must pass all CI checks
  - No direct commits allowed
- **Versioning**: Tagged with semantic versions (v0.1.0, v0.2.0, etc.)
- **Deployment**: Auto-deploys to production environment

#### `develop`

- **Purpose**: Integration branch for the current sprint
- **Protection**:
  - Requires PR review
  - Must pass all CI checks
  - No direct commits (except hotfixes)
- **Versioning**: Pre-release versions (v0.2.0-sprint.1, v0.2.0-rc.1)
- **Deployment**: Auto-deploys to staging environment

### Working Branches

#### Feature Branches: `feature/<feature-id>-<short-description>`

- **Base**: `develop`
- **Merge to**: `develop`
- **Naming**: `feature/f-1.1-music-worker`, `feature/f-2.3-remix-upload`
- **Lifecycle**: Created at sprint start, merged before sprint end
- **Example**: `feature/f-1.1-music-synthesis-worker`

#### Bugfix Branches: `bugfix/<issue-id>-<short-description>`

- **Base**: `develop`
- **Merge to**: `develop`
- **Naming**: `bugfix/123-redis-type-mismatch`, `bugfix/456-s3-path-encoding`
- **Lifecycle**: Short-lived; merged ASAP

#### Hotfix Branches: `hotfix/<version>-<description>`

- **Base**: `main`
- **Merge to**: **both** `main` and `develop`
- **Naming**: `hotfix/v0.2.1-auth-jwt-expiry`, `hotfix/v0.1.2-s3-presign-timeout`
- **Lifecycle**: Created for critical production bugs; merged immediately after fix + test
- **Versioning**: Increments patch version (v0.2.0 → v0.2.1)

#### Release Branches: `release/<version>`

- **Base**: `develop`
- **Merge to**: `main` (then tag) and back to `develop`
- **Naming**: `release/v0.2.0`, `release/v1.0.0`
- **Lifecycle**: Created at sprint end; stabilization + final testing
- **Changes allowed**: Bug fixes, version bumps, documentation updates (NO new features)

---

## Sprint-to-Release Workflow

### Sprint Planning (Start of Sprint)

1. **Create sprint branch** (optional, for large teams):

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b sprint/s-2-preview-path
   ```

2. **Create feature branches** from `develop`:

   ```bash
   git checkout develop
   git checkout -b feature/f-1.1-music-worker
   ```

3. **Tag sprint start** (optional):
   ```bash
   git tag -a v0.2.0-sprint.start -m "Sprint 2 start"
   git push origin v0.2.0-sprint.start
   ```

### During Sprint (Development)

1. **Work on feature branches**:

   ```bash
   git checkout feature/f-1.1-music-worker
   # Make changes, commit frequently
   git add .
   git commit -m "feat(api): implement music synthesis worker"
   ```

2. **Keep feature branch updated** with `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/f-1.1-music-worker
   git rebase develop  # OR: git merge develop
   ```

3. **Open PR to `develop`** when feature is complete:
   - PR title: `feat(api): Music synthesis worker (Task 1.1)`
   - PR description: Link to task, acceptance criteria, testing notes
   - Request review from team
   - Ensure CI passes (tests, linting, type checks)

4. **Merge to `develop`** after approval:
   - Use **squash merge** for clean history (optional)
   - Delete feature branch after merge

### Sprint End (Release Preparation)

1. **Create release branch** from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b release/v0.2.0
   ```

2. **Bump version** in package.json files:

   ```bash
   # Update version in root package.json and workspace packages
   pnpm version minor  # or: pnpm version patch
   ```

3. **Finalize release documentation**:
   - Update `docs/releases/v0.2.0.md`
   - Update CHANGELOG.md (if used)
   - Review and update README if needed

4. **Stabilization period** (bug fixes only):

   ```bash
   git checkout release/v0.2.0
   # Fix critical bugs found in testing
   git commit -m "fix(api): resolve redis connection leak in queue"
   ```

5. **Create PR from `release/v0.2.0` to `main`**:
   - Title: `Release v0.2.0 - Sprint 1 Complete`
   - Description: Link to release notes, sprint summary, key features
   - Require all CI checks to pass
   - Require team review

6. **Merge to `main`**:

   ```bash
   git checkout main
   git pull origin main
   git merge --no-ff release/v0.2.0
   git tag -a v0.2.0 -m "Release v0.2.0: Preview Path Complete"
   git push origin main --tags
   ```

7. **Merge back to `develop`**:

   ```bash
   git checkout develop
   git pull origin develop
   git merge --no-ff release/v0.2.0
   git push origin develop
   ```

8. **Delete release branch**:
   ```bash
   git branch -d release/v0.2.0
   git push origin --delete release/v0.2.0
   ```

### Hotfix Workflow (Production Bugs)

1. **Create hotfix branch** from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/v0.2.1-auth-jwt-expiry
   ```

2. **Fix the bug**:

   ```bash
   git add .
   git commit -m "fix(api): extend JWT expiry to 7 days"
   ```

3. **Bump patch version**:

   ```bash
   pnpm version patch  # v0.2.0 → v0.2.1
   ```

4. **Merge to `main`**:

   ```bash
   git checkout main
   git merge --no-ff hotfix/v0.2.1-auth-jwt-expiry
   git tag -a v0.2.1 -m "Hotfix v0.2.1: Fix JWT expiry"
   git push origin main --tags
   ```

5. **Merge to `develop`**:

   ```bash
   git checkout develop
   git merge --no-ff hotfix/v0.2.1-auth-jwt-expiry
   git push origin develop
   ```

6. **Delete hotfix branch**:
   ```bash
   git branch -d hotfix/v0.2.1-auth-jwt-expiry
   git push origin --delete hotfix/v0.2.1-auth-jwt-expiry
   ```

---

## CI/CD Integration

### CI Triggers

**On `feature/*` and `bugfix/*` branches**:

- Run unit tests
- Run linting (ESLint, Prettier)
- Run type checking (TypeScript)
- Run integration tests (Testcontainers)
- Build packages (no deployment)

**On `develop` branch** (after merge):

- All checks from feature branches
- Run E2E tests (Playwright)
- Build Docker images
- Deploy to **staging** environment
- Run smoke tests on staging

**On `release/*` branches**:

- All checks from develop
- Run performance tests
- Run security scans (OWASP, Snyk)
- Generate release notes

**On `main` branch** (after merge/tag):

- All checks from release
- Build production Docker images
- Deploy to **production** environment
- Run production smoke tests
- Notify team of deployment

**On `hotfix/*` branches**:

- Same as release branches
- Fast-tracked deployment (skip some non-critical checks if needed)

### Deployment Environments

| Branch      | Environment | URL                            | Purpose                |
| ----------- | ----------- | ------------------------------ | ---------------------- |
| `feature/*` | None        | N/A                            | Local development only |
| `develop`   | Staging     | `https://staging.bluebird.app` | Integration testing    |
| `release/*` | Pre-prod    | `https://preprod.bluebird.app` | Final validation       |
| `main`      | Production  | `https://bluebird.app`         | Live users             |

---

## Versioning Strategy

### Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH` (e.g., v1.2.3)

- **MAJOR**: Breaking changes (API contract changes, removed features)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

### Sprint Versioning

- **Sprint 0**: v0.1.0 (Foundation)
- **Sprint 1**: v0.2.0 (Preview Path)
- **Sprint 2**: v0.3.0 (Remix Features)
- **Sprint 3**: v0.4.0 (Export & Similarity)
- **MVP Release**: v1.0.0

### Pre-release Tags

- `v0.2.0-sprint.1`: Sprint in progress
- `v0.2.0-rc.1`: Release candidate (on release branch)
- `v0.2.0`: Final release (on main)

---

## Branch Protection Rules

### `main` Branch

- ✅ Require pull request reviews (min 1)
- ✅ Require status checks to pass:
  - `test-unit`
  - `test-integration`
  - `test-e2e`
  - `lint`
  - `typecheck`
  - `security-scan`
- ✅ Require branches to be up to date before merging
- ✅ Require signed commits (optional)
- ✅ Include administrators (no bypass)
- ❌ Allow force pushes
- ❌ Allow deletions

### `develop` Branch

- ✅ Require pull request reviews (min 1)
- ✅ Require status checks to pass:
  - `test-unit`
  - `test-integration`
  - `lint`
  - `typecheck`
- ✅ Require branches to be up to date before merging
- ❌ Allow force pushes
- ❌ Allow deletions

---

## Commit Message Standards

Follow **Conventional Commits** (see § 13 in copilot-instructions.md):

```
type(scope): brief subject line

Detailed description (optional)

BREAKING CHANGE: description (if applicable)
```

**Types**: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `chore`, `ci`, `style`

**Examples**:

- `feat(api): implement music synthesis worker`
- `fix(api): resolve redis connection leak`
- `docs: add branching strategy guide`
- `test: add integration tests for planner flow`

---

## Merge Strategies

### Feature → Develop

- **Strategy**: Squash merge (optional) or regular merge
- **Reason**: Clean history, group related commits

### Release → Main

- **Strategy**: Merge commit (`--no-ff`)
- **Reason**: Preserve release history, clear merge points

### Hotfix → Main/Develop

- **Strategy**: Merge commit (`--no-ff`)
- **Reason**: Preserve hotfix history, ensure traceability

### Develop → Release (at sprint end)

- **Strategy**: Regular merge or rebase
- **Reason**: Carry all sprint work into release branch

---

## AI Agent Guidelines

### When Creating Feature Branches

1. **Always base on `develop`** (not main):

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/f-X.Y-description
   ```

2. **Use feature ID from FEATURES.MD**:
   - Correct: `feature/f-1.1-music-worker`
   - Incorrect: `feature/music-worker`

3. **Keep branches focused**: One feature = one branch

### When Creating PRs

1. **Target `develop`** (not main) for features/bugfixes
2. **Target `main`** only for releases and hotfixes
3. **Use conventional commit format** in PR title
4. **Link to sprint tasks** or feature IDs in description
5. **Request reviews** before merging

### When Merging Code

1. **Never commit directly to `main` or `develop`**
2. **Always create PR** even for small changes
3. **Wait for CI to pass** before merging
4. **Delete feature branches** after merge

### Sprint Boundaries

1. **Start of sprint**: Create feature branches from latest `develop`
2. **During sprint**: Merge features to `develop` as completed
3. **End of sprint**: Create `release/vX.Y.Z` from `develop`
4. **After sprint**: Merge release to `main`, tag, merge back to `develop`

---

## Quick Reference

### Common Commands

```bash
# Start new feature
git checkout develop && git pull
git checkout -b feature/f-1.1-music-worker

# Update feature branch with latest develop
git checkout develop && git pull
git checkout feature/f-1.1-music-worker
git rebase develop

# Create release branch (sprint end)
git checkout develop && git pull
git checkout -b release/v0.2.0

# Tag release on main
git checkout main && git pull
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin main --tags

# Create hotfix
git checkout main && git pull
git checkout -b hotfix/v0.2.1-description
```

### Decision Tree

**Where should I create my branch?**

- New feature → `develop`
- Bug fix → `develop`
- Production bug → `main` (hotfix)
- Sprint release → `develop` (release branch)

**Where should I merge my PR?**

- Feature/bugfix → `develop`
- Release → `main` (then back to `develop`)
- Hotfix → `main` AND `develop`

**What's the current sprint?**

- Check `docs/project/sprints/` for sprint plans
- Check `develop` branch tags for sprint markers

---

## FAQ

**Q: Can I commit directly to develop for small fixes?**
A: No. Always use PRs to ensure CI runs and maintain audit trail.

**Q: What if I need to make changes during a release branch?**
A: Only bug fixes allowed. New features go to the next sprint.

**Q: How do I know what version to use?**
A: Check the sprint plan. Each sprint increments the minor version.

**Q: What if a hotfix conflicts with develop?**
A: Resolve conflicts when merging hotfix back to develop. Prefer develop's changes unless hotfix is critical.

**Q: Can I have multiple feature branches for one sprint?**
A: Yes. Create separate branches for each feature/task.

**Q: Should I rebase or merge when updating feature branches?**
A: Either works. Rebase keeps cleaner history; merge preserves exact history.

---

## Status

- **Active**: This branching strategy is in effect as of Sprint 1
- **Review**: Strategy will be reviewed at end of each quarter
- **Updates**: Document updates require PR review
