---
sidebar_position: 4
---

# Performance & Optimization

> Performance targets, baselines, and optimization strategies for Bluebird.

## Performance Targets (Hard Constraints)

All values are **P50 (median) unless otherwise noted**. These are non-negotiable guardrails.

| Metric                    | Target | Status | Notes                                       |
| ------------------------- | ------ | ------ | ------------------------------------------- |
| **TTFP** (Preview)        | ≤45s   | ✅ Met | Time-to-first-preview must be ≤45s P50      |
| **Section Regeneration**  | ≤20s   | ✅ Met | Per-section regen without full re-run       |
| **UI Responsiveness**     | ≤100ms | ✅ Met | User interactions (button click → response) |
| **API Endpoint Response** | ≤500ms | ✅ Met | Non-job endpoints (auth, project ops)       |
| **Database Query**        | ≤50ms  | ✅ Met | 95th percentile, cached queries excluded    |

## Current Baseline (Sprint 2)

**TTFP Breakdown** (local development, no GPU):

- Planning: 12s
- Music synthesis: 20s
- Vocal synthesis: 8s
- Mixing: 2s
- **Total: 42s** ✅ Under 45s budget

**Caching Impact**:

- Cache hit rate: ~65% (stems by seed)
- Cache miss → full regenerate: adds 3-5s
- Cache TTL: 24 hours (MinIO lifecycle)

## Cost Targets

| Component     | Budget   | Current | Status        |
| ------------- | -------- | ------- | ------------- |
| GPU/inference | $0.40    | $0.32   | ✅ 20% margin |
| Storage (S3)  | $5/month | $2.10   | ✅ 58% margin |
| Bandwidth     | $1/month | $0.25   | ✅ 75% margin |

## Optimization Strategies

### Database

```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_takes_project_id ON takes(project_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_jobs_take_id ON jobs(take_id);

-- Monitor slow queries
EXPLAIN ANALYZE SELECT * FROM takes WHERE project_id = $1;
```

### Caching

**Redis** (session data, job status):

- Key pattern: `session:{sessionId}`
- TTL: 24 hours for session tokens

**MinIO/S3** (stem caching):

- Key pattern: `projects/{projectId}/takes/{takeId}/sections/{idx}/music/{stem}.wav`
- TTL: 24 hours (auto-delete via lifecycle policy)
- Hit rate target: >60%

### API Layer

**Response compression**:

```typescript
// In Fastify server setup
app.register(require('@fastify/compress'))
```

**Request deduplication**:

```typescript
// Use Idempotency-Key header to prevent duplicate processing
const idempotencyKey = request.headers['idempotency-key']
if (await cache.has(idempotencyKey)) {
  return cache.get(idempotencyKey) // Return cached response
}
```

### Web/UI

**Code splitting**:

- Routes lazy-loaded via Next.js dynamic imports
- Bundle size target: ≤500KB (gzipped)

**Image optimization**:

- Use Next.js Image component
- Docusaurus plugin-ideal-image for docs

**SSE subscription**:

- Heartbeat every 15s to prevent timeouts
- Exponential backoff on reconnection (500ms → 8s max)

## Monitoring & Metrics

### Key Metrics to Track

1. **TTFP P50/P95**: Measured at end of mixing stage
2. **Section regen P50**: From request to completion
3. **API response times**: P50, P95 for each endpoint
4. **Cache hit rate**: Stems cache (target: >60%)
5. **Cost per preview**: USD (target: ≤$0.40)

### Observability

**OpenTelemetry Spans**:

- `planner.run`: Planning stage duration
- `music.synth`: Music synthesis duration
- `voice.synth`: Vocal synthesis duration
- `mix.final`: Mixing stage duration
- `export.check`: Similarity check duration

**Logs**:

- Query timing in Postgres logs
- GPU utilization in pod logs
- Cache hit/miss in API logs

## Benchmarking

### Local Performance Test

```bash
# Run performance tests
pnpm -F web run test:performance

# Expected output: TTFP ≤45s, section regen ≤20s
```

### Load Testing

```bash
# Test API under load (k6)
k6 run tests/performance/load-test.js
```

## Golden Rules

1. **Measure before optimizing**: Use OpenTelemetry to identify bottlenecks
2. **Per-section regen**: Never regenerate full song for one section (saves 2-3x GPU)
3. **Cache aggressively**: Same seed → identical output → cacheable
4. **Monitor costs**: GPU minutes directly impact profitability
5. **UI responsiveness**: Never block user while rendering (use SSE/WebSocket)

## Related Documentation

- [TTFP_BASELINE.md](../../docs/development/TTFP_BASELINE.md): Detailed baseline methodology
- [PERFORMANCE_REPORT.md](../../docs/development/PERFORMANCE_REPORT.md): Sprint 2 validation results
- [Non-Functional-Requirements.md](../../docs/project/requirements/Non-Functional-Requirements.md): Full SLO spec
