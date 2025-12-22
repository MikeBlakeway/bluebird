---
sidebar_position: 6
---

# Deployment Checklist

Pre-deployment and post-deployment verification procedures for staging and production releases. Use this checklist before deploying to any environment.

## Pre-Deployment (All Environments)

### Code Quality

- [ ] All CI checks passing (lint, typecheck, tests)
- [ ] Code reviewed and approved by at least 1 team member
- [ ] No merge conflicts with target branch (develop for staging, main for production)
- [ ] Branch up-to-date with latest target commits
- [ ] Conventional commits used for all changes

### Testing

- [ ] Unit tests passing (100% of test suite)
- [ ] Integration tests passing
- [ ] Contract tests passing (OpenAPI schema validated)
- [ ] Manual testing completed for new features
- [ ] No flaky tests or skipped tests

### Documentation

- [ ] README updated (if changes affect setup)
- [ ] API documentation updated (Method.md or Docusaurus)
- [ ] CHANGELOG.md updated with version and changes
- [ ] Migration guides written (if breaking changes)
- [ ] Code comments updated (TSDoc, inline explanations)

### Dependencies

- [ ] `npm audit` shows no high-severity vulnerabilities
- [ ] Dependency updates reviewed (no major version surprises)
- [ ] Lock file committed (`pnpm-lock.yaml`)
- [ ] All new packages are intended (no accidental installs)

### Configuration

- [ ] All environment variables documented (.env.example)
- [ ] New secrets added to GitHub Secrets (don't commit)
- [ ] Feature flags configured (if using feature gates)
- [ ] Backwards compatibility maintained (or breaking change noted)

### Database

- [ ] Schema migrations tested locally
- [ ] Migration rollback tested (if applicable)
- [ ] No data loss expected
- [ ] Backup strategy in place

---

## Staging Deployment Checklist

### Before Deployment (develop → staging)

**Release Readiness**:

- [ ] All Sprint tasks completed and merged to develop
- [ ] Release branch created (`release/vX.Y.Z`)
- [ ] Version bumped in `package.json` files
- [ ] Integration tests passing on develop branch
- [ ] No known critical bugs or regressions

**Database Preparation**:

- [ ] Database migrations tested locally (with Testcontainers)
- [ ] Staging database backup created
- [ ] Backup verified and restorable

**Infrastructure**:

- [ ] Staging environment health checked (CPU, memory, disk)
- [ ] Database connections tested
- [ ] Redis/cache available and responding
- [ ] S3 storage accessible

**Communication**:

- [ ] QA team notified of deployment
- [ ] Sprint demo scheduled (if needed)
- [ ] Slack notification posted to #deployments

### After Deployment (Immediate — 5 minutes)

**System Health**:

- [ ] Health check endpoint responding (HTTP 200)
- [ ] API responding to requests
- [ ] Web frontend loading
- [ ] Database migrations applied successfully
- [ ] No error spikes in logs

**Service Status**:

- [ ] Queue workers running (BullMQ status)
- [ ] Redis connection healthy
- [ ] S3/MinIO accessible
- [ ] Telemetry/OpenTelemetry pipeline working

**Basic Validation**:

- [ ] Login flow works (magic link)
- [ ] JWT tokens valid and refreshing
- [ ] API routes responding with expected data format

### Smoke Tests (Within 15 minutes)

**Critical Paths**:

- [ ] Sign up flow completes successfully
- [ ] Login flow completes successfully
- [ ] Create project flow works
- [ ] Generate preview renders audio
- [ ] Export flow accessible (no errors)

**API Health**:

- [ ] All canonical endpoints responding (POST /plan/song, etc.)
- [ ] Error handling working (invalid requests return 4xx, not 5xx)
- [ ] Idempotency working (same request twice = same result)
- [ ] Rate limiting enforced (reqs limited appropriately)

**Browser**:

- [ ] No console errors (check DevTools)
- [ ] No Network tab failures (except expected 404s)
- [ ] Mobile view responsive
- [ ] Dark mode rendering correctly

### QA Validation (Within 1 hour)

**Feature Testing**:

- [ ] New features work as designed
- [ ] UI matches requirements
- [ ] Forms validate input correctly
- [ ] Error messages helpful and accurate

**Regression Testing**:

- [ ] Previous features still work
- [ ] User can complete end-to-end flow
- [ ] No performance degradation
- [ ] Database data correct and consistent

**Performance**:

- [ ] Page load times acceptable (≤3s)
- [ ] API response times acceptable (P95 ≤500ms)
- [ ] No memory leaks (check task manager)
- [ ] No CPU spikes during normal use

### Ongoing Monitoring (First 24 hours)

**Error Tracking**:

- [ ] Error rate normal (≤1% of requests)
- [ ] No new error patterns in logs
- [ ] Stack traces meaningful (not obfuscated)
- [ ] Error alerts not triggering frequently

**Performance Metrics**:

- [ ] TTFP (Time-to-First-Preview) on target (≤45s P50)
- [ ] Database query times normal
- [ ] API response times stable
- [ ] Queue processing times consistent

**Resource Usage**:

- [ ] CPU utilization normal (≤70% average)
- [ ] Memory usage stable (no growth over time)
- [ ] Disk space not filling up
- [ ] Network bandwidth expected

**User Activity**:

- [ ] New sign-ups processing correctly
- [ ] Audio files rendering and downloading
- [ ] Jobs completing without errors
- [ ] User reports of issues (none expected)

### Rollback Decision

- [ ] **Proceed**: No critical issues found; stable for 24 hours → approve for production
- [ ] **Watch**: Minor issues noted but manageable; continue monitoring → decision in 6 hours
- [ ] **Rollback**: Critical bugs or major regression → revert to previous release

---

## Production Deployment Checklist

### Before Deployment (release/vX.Y.Z → main)

**All Pre-Deployment Checks** (see above)

**Production-Specific**:

- [ ] Staging deployment stable for ≥24 hours
- [ ] No critical issues in staging
- [ ] Release notes written and reviewed
- [ ] Changelog complete and accurate
- [ ] Deployment runbook created (steps to release)

**Security**:

- [ ] Security scan passing (Snyk, OWASP)
- [ ] No secrets committed (grep for AWS keys, JWT, etc.)
- [ ] CORS policy correct (no overly permissive)
- [ ] Rate limiting configured for production load

**Scalability**:

- [ ] Load testing completed (target: 50 concurrent users)
- [ ] Auto-scaling configured (if using cloud)
- [ ] Database connection pooling adequate
- [ ] CDN cache headers correct

**Backup & Recovery**:

- [ ] Production database backup verified
- [ ] Disaster recovery plan documented
- [ ] Rollback procedure tested (can revert within 30 min)
- [ ] Data retention policies in place (GDPR, privacy)

**Approval**:

- [ ] Product owner approved release
- [ ] Tech lead reviewed architecture changes
- [ ] DevOps/Infrastructure sign-off
- [ ] Security team reviewed (if applicable)

### After Deployment (Immediate — 10 minutes)

**Verify Deploy Success**:

- [ ] Health check endpoint responding (HTTP 200)
- [ ] All services running (ps aux, docker ps)
- [ ] Database migrations applied
- [ ] No error logs in first 2 minutes
- [ ] Metrics pipeline working (OpenTelemetry)

**Production Systems**:

- [ ] Production database responsive
- [ ] Backups running on schedule
- [ ] Monitoring/alerting active
- [ ] Log aggregation working (Datadog, ELK, etc.)

**DNS & Routing**:

- [ ] DNS resolving to correct IP
- [ ] Load balancer routing requests
- [ ] CDN cache populated (if applicable)
- [ ] HTTPS certificates valid

### Smoke Tests (Within 30 minutes)

**User-Facing Flows**:

- [ ] Homepage loads
- [ ] Sign up completes
- [ ] Login works
- [ ] Create project and generate preview
- [ ] Export and download master

**API Layer**:

- [ ] All canonical endpoints available
- [ ] Error handling correct
- [ ] Idempotency keys working
- [ ] Rate limits enforced

**Integrations**:

- [ ] S3/CDN serving files
- [ ] Email notifications sending (if applicable)
- [ ] Third-party integrations working
- [ ] Webhooks triggering (if applicable)

### Post-Deployment Monitoring (First 48 hours)

**Error Rates**:

- [ ] Error rate ≤0.5% (better than staging)
- [ ] No spike in 5xx errors
- [ ] Error patterns match expectations
- [ ] Customer error reports (none expected)

**Performance SLOs**:

- [ ] TTFP ≤45s P50 (maintained)
- [ ] API response ≤500ms P95
- [ ] Page load ≤3s
- [ ] Database queries ≤100ms P95

**Capacity**:

- [ ] CPU ≤70% average, ≤85% peak
- [ ] Memory stable (no leaks)
- [ ] Disk space adequate (>10% free)
- [ ] Disk space adequate (≥10% free)
- [ ] Network bandwidth expected

**User Impact**:

- [ ] Signups and active users normal
- [ ] No support tickets about new issues
- [ ] Feedback positive (Slack, Twitter)
- [ ] Feature adoption as expected

### Rollback Procedure (if needed)

**Decision Criteria** (rollback if any true):

- [ ] Critical bug affecting >1% of users
- [ ] Critical bug affecting ≥1% of users
- [ ] Performance regression >50% degradation
- [ ] Performance regression ≥50% degradation
- [ ] Data corruption or data loss
- [ ] Security vulnerability discovered

**Rollback Steps**:

1. Notify team in Slack (#incidents)
2. Stop deployments (no new releases)
3. Revert to last stable production tag: `git checkout v0.2.0`
4. Redeploy previous version
5. Verify health (5 min)
6. Communicate status to users
7. Post-mortem scheduled (within 24 hours)

**Time Target**: Rollback complete within 30 minutes of decision

---

## Communication Template

### Deployment Notification (Slack)

```
@channel 🚀 Deploying v0.3.0 to staging
Branch: release/v0.3.0
ETA: 15 minutes
Changes: Priority 1 doc migration, CI integration, TypeScript setup
QA team: Please test [feature list] after deployment

Health check: staging.bluebird.app/health
Logs: [link to log aggregation]
Support: React in thread with any issues
```

### Post-Deployment Notification

```
✅ v0.3.0 deployed to staging (12:30 PM)
All systems healthy. QA testing in progress.
Expected production deploy: Monday 9 AM

Known issues: None
Performance: TTFP 42s (target 45s) ✅
Errors: 0.2% (target ≤1%) ✅
```

### Incident Notification (if needed)

```
🚨 INCIDENT: v0.3.0 production deployment
Issue: API endpoint timing out (TTFP >90s)
Issue: API endpoint timing out (TTFP ≥90s)
Impact: Preview generation failing
Status: Investigating root cause
ETA to resolution: 15 minutes

Workaround: Use previous feature (if available)
Updates: Posted in #incidents channel
```

---

## Post-Deployment Sprint Review

After deployment stabilizes (24+ hours), review:

1. **What went well**
   - Smooth deployment process
   - Good communication
   - Metrics aligned with expectations

2. **What went wrong** (if anything)
   - Unexpected issues
   - Performance surprises
   - Monitoring gaps

3. **Improvements for next deployment**
   - Process changes
   - Additional tests
   - Better monitoring

---

## Related Documentation

- [Branching Strategy](branching-strategy.md) — Sprint workflow and release process
- [CI/CD Pipeline](ci-cd.md) — Automated testing and validation gates
- [Performance Targets](performance.md) — SLOs and baseline metrics

---

**Questions?** Reach out in #development or #devops Slack channels.
