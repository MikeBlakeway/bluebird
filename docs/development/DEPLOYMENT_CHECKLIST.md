# Deployment Checklist

> Pre-deployment and post-deployment checklists for staging and production releases.

---

## Pre-Deployment Checklist

### All Deployments (Staging & Production)

**Code Quality**:

- [ ] All CI checks passing (lint, typecheck, tests)
- [ ] Code reviewed and approved
- [ ] No merge conflicts with target branch
- [ ] Branch up-to-date with target

**Testing**:

- [ ] Unit tests passing (100% of suite)
- [ ] Integration tests passing
- [ ] Contract tests passing (no schema drift)
- [ ] Manual testing completed for new features

**Documentation**:

- [ ] README updated (if needed)
- [ ] API documentation updated
- [ ] Changelog updated with changes
- [ ] Migration guides written (if breaking changes)

**Dependencies**:

- [ ] No high-severity vulnerabilities (npm audit)
- [ ] Dependency updates reviewed
- [ ] Lock file committed (pnpm-lock.yaml)

**Configuration**:

- [ ] Environment variables documented
- [ ] Secrets added to GitHub Secrets (if new)
- [ ] Feature flags configured (if applicable)

---

## Staging Deployment Checklist

### Pre-Deploy (develop → staging)

**Validation**:

- [ ] All Sprint tasks completed and merged
- [ ] Integration tests passing on develop
- [ ] No known critical bugs

**Preparation**:

- [ ] Database migrations tested locally
- [ ] Staging database backup created
- [ ] Staging environment health checked

**Communication**:

- [ ] Team notified of deployment
- [ ] QA team ready for validation

### Post-Deploy (staging)

**Verification** (within 5 minutes):

- [ ] Health check endpoint responding (200 OK)
- [ ] Database migrations applied successfully
- [ ] No error spikes in logs
- [ ] Queue workers running
- [ ] Redis connection healthy

**Smoke Tests** (within 15 minutes):

- [ ] Authentication flow works
- [ ] Critical API endpoints responding
- [ ] Web app loads without errors
- [ ] No console errors in browser

**QA Validation** (within 1 hour):

- [ ] QA team validates new features
- [ ] Regression testing on key flows
- [ ] Performance baseline checked
- [ ] No critical issues found

**Monitoring** (ongoing):

- [ ] Error rates normal (< 1%)
- [ ] Response times acceptable (P95 < 500ms)
- [ ] No memory leaks detected
- [ ] Database query performance normal

**Rollback Decision**:

- [ ] No rollback needed → proceed with sprint
- [ ] Issues found → fix and redeploy OR rollback

---

## Production Deployment Checklist

### Pre-Deploy (release → main)

**Staging Validation**:

- [ ] Staging deployment successful
- [ ] QA sign-off received
- [ ] Performance metrics acceptable
- [ ] Security scan passed

**Release Preparation**:

- [ ] Release branch created (`release/vX.Y.Z`)
- [ ] Version bumped in package.json files
- [ ] Release notes written (`docs/releases/vX.Y.Z.md`)
- [ ] Changelog updated

**Production Readiness**:

- [ ] Production database backup verified
- [ ] Rollback plan documented
- [ ] Incident response team on standby
- [ ] Customer communication prepared (if needed)

**Risk Assessment**:

- [ ] Breaking changes identified
- [ ] Migration impact assessed
- [ ] Rollback time estimated (< 30 min)
- [ ] User impact minimized

**Approvals**:

- [ ] Code review approved (2+ reviewers)
- [ ] QA approval received
- [ ] Product owner approval (if major release)
- [ ] DevOps approval

### Deploy Window

**Timing**:

- [ ] Deploy during low-traffic period
- [ ] Avoid Fridays/holidays
- [ ] Team available for monitoring
- [ ] Customer support informed

**Execution**:

- [ ] Merge release to main
- [ ] Tag release: `git tag -a vX.Y.Z`
- [ ] Push tag: `git push origin vX.Y.Z`
- [ ] Monitor GitHub Actions workflow
- [ ] Watch deployment logs

### Post-Deploy (production)

**Immediate Verification** (within 5 minutes):

- [ ] Health check endpoint responding (200 OK)
- [ ] Database migrations applied successfully
- [ ] No error spikes in production logs
- [ ] All services running (api, workers, web)
- [ ] Redis/PostgreSQL connections healthy

**Critical Smoke Tests** (within 10 minutes):

- [ ] User login working
- [ ] Project creation working
- [ ] Music generation working (if applicable)
- [ ] Key API endpoints responding
- [ ] Web app loads for users

**Performance Validation** (within 30 minutes):

- [ ] Response time P95 < 500ms (baseline)
- [ ] Error rate < 0.5%
- [ ] Database query performance normal
- [ ] Queue throughput normal
- [ ] No memory/CPU spikes

**User Impact** (within 1 hour):

- [ ] No increase in support tickets
- [ ] User sessions stable
- [ ] No user-reported issues
- [ ] Active user count normal

**Monitoring** (ongoing - 24 hours):

- [ ] Error tracking dashboard green
- [ ] Performance metrics stable
- [ ] No infrastructure alerts
- [ ] Business metrics tracking normally

### Post-Deployment Tasks

**Documentation**:

- [ ] Update deployment log in `docs/development/DEVELOPMENT_LOG.md`
- [ ] Document any issues encountered
- [ ] Update runbooks if new procedures added

**Communication**:

- [ ] Notify team of successful deployment
- [ ] Update release notes with actual deployment time
- [ ] Announce to users (if feature release)

**Cleanup**:

- [ ] Merge release branch back to develop
- [ ] Delete release branch
- [ ] Archive build artifacts (if needed)

**Review** (within 24 hours):

- [ ] Retrospective on deployment process
- [ ] Document lessons learned
- [ ] Update checklists if needed
- [ ] Celebrate successful release! 🎉

---

## Rollback Checklist

### When to Rollback

**Immediate Rollback Triggers**:

- Error rate > 5%
- Critical functionality broken
- Data integrity issues
- Security vulnerability exposed
- Database migration failed

**Consider Rollback If**:

- Error rate 1-5%
- Performance degraded > 50%
- User complaints increasing
- Unable to fix forward quickly

### Rollback Procedure

**Preparation** (1-2 minutes):

- [ ] Assess impact and decide to rollback
- [ ] Notify team in incident channel
- [ ] Identify last known good version

**Execution** (5-10 minutes):

- [ ] Revert to previous git tag/commit
- [ ] Redeploy previous version
- [ ] Rollback database migrations (if needed)
- [ ] Clear caches if necessary

**Verification** (5 minutes):

- [ ] Health checks passing
- [ ] Error rates back to normal
- [ ] Critical flows working
- [ ] User impact minimized

**Communication** (ongoing):

- [ ] Update incident status
- [ ] Notify stakeholders
- [ ] Plan fix-forward strategy
- [ ] Schedule post-incident review

---

## Deployment Metrics

### Track for Each Deployment

**Timing**:

- Deploy started: \***\*\_\_\_\*\***
- Deploy completed: \***\*\_\_\_\*\***
- Duration: \***\*\_\_\_\*\***
- Total downtime: \***\*\_\_\_\*\*** (target: 0 seconds)

**Quality**:

- Tests passed: **\_** / **\_**
- Security issues: **\_**
- Breaking changes: Yes / No
- Database migrations: Yes / No

**Impact**:

- Services deployed: \***\*\_\_\_\*\***
- Users affected: \***\*\_\_\_\*\***
- Rollback required: Yes / No
- Incidents triggered: **\_**

---

## Emergency Contacts

**On-Call Rotation**:

- Primary: \***\*\_\_\_\*\***
- Secondary: \***\*\_\_\_\*\***
- Escalation: \***\*\_\_\_\*\***

**Incident Channels**:

- Slack: #incidents
- Discord: #deployment-alerts
- Email: devops@bluebird.app

---

## Related Documentation

- [CI/CD Pipeline Guide](CI_CD_GUIDE.md)
- [Branching Strategy](BRANCHING_STRATEGY.md)
- [Incident Response Playbook](INCIDENT_RESPONSE.md) (TODO)

---

## Status

- **Active**: Checklist in use as of Sprint 1
- **Review**: Update after each deployment
- **Feedback**: Improve based on lessons learned
