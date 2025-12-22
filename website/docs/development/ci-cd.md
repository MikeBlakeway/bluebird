---
sidebar_position: 3
---

# CI/CD Pipeline

> Comprehensive guide to Bluebird's CI/CD infrastructure and deployment strategies.

## Overview

Bluebird uses GitHub Actions for CI/CD with a tiered testing strategy aligned to our branching model. Each branch type triggers appropriate checks and deployments.

## Pipeline Architecture

### Branch-Based Testing Tiers

| Branch Type             | Tests Run                         | Deploy     |
| ----------------------- | --------------------------------- | ---------- |
| `feature/*`, `bugfix/*` | Unit + Integration + Lint + Types | No         |
| `develop`               | All Basic + E2E                   | Staging    |
| `release/*`             | All + Security Scan               | No         |
| `main`                  | All + E2E + Security              | Production |

## Quality Gates

### Pre-Commit (Git Hook)

```bash
pnpm run format:check   # Prettier formatting
```

### Pre-Push (Git Hook)

```bash
pnpm run check          # Full quality suite:
  ├─ pnpm lint          # ESLint validation
  ├─ pnpm typecheck     # TypeScript strict mode
  ├─ pnpm test          # Unit + integration tests
  └─ pnpm docs:check    # TypeDoc coverage (treatWarningsAsErrors)
```

### CI Pipeline (GitHub Actions)

**On PR to develop/main**:

1. Lint (ESLint + Prettier)
2. Type check (TypeScript)
3. Unit tests
4. Integration tests
5. Contract tests (OpenAPI spec validation)
6. Build verification

**On develop branch** (after merge):

- All above checks
- E2E tests (Playwright)
- Build Docker images
- Deploy to staging

**On main branch** (release):

- All above checks
- E2E tests
- Security scan (OWASP/Snyk)
- Performance test
- Deploy to production

## Running Tests Locally

```bash
# Format check
pnpm run format:check

# Lint
pnpm run lint

# Type check
pnpm run typecheck

# Unit + integration tests
pnpm run test

# Full quality check (as run in git pre-push hook)
pnpm run check

# Build verification
pnpm run build
```

## Common Issues

### Test Failures

1. **Clear cache**: `pnpm -r run clean`
2. **Fresh install**: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
3. **Check database**: Ensure Postgres/Redis running locally

### Type Errors

```bash
# Find and fix all type errors
pnpm typecheck --showConfig
pnpm lint --fix
```

### Coverage Issues

```bash
# Run tests with coverage report
pnpm test --coverage
```

## Deployment Strategy

### Staging Deployment

- Triggered on every develop branch push
- Runs full E2E tests
- 5-minute deployment window

### Production Deployment

- Manual PR approval to main
- Automated after merge
- Includes security scanning
- Automatic rollback on failed health checks

## Troubleshooting

**CI failing but tests pass locally?**

- Clear GitHub Actions cache: Settings → Actions → Clear all caches
- Check Node version: Must match in package.json `engines.node`
- Verify environment variables are set in GitHub Secrets

**Docker image build fails?**

- Check docker/ directory for Dockerfile and .dockerignore
- Ensure all dependencies are in package.json
- Test build locally: `docker build -t bluebird .`

## References

- Full guide: [CI_CD_GUIDE.md](../../docs/development/CI_CD_GUIDE.md) (in repo)
- GitHub Actions: See `.github/workflows/` directory
- Deployment checklist: [DEPLOYMENT_CHECKLIST.md](../../docs/development/DEPLOYMENT_CHECKLIST.md)
