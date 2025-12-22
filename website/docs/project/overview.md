---
sidebar_position: 2
---

# System Overview

## High-Level Architecture

Bluebird is built as a **monorepo** with separate concerns:

### Frontend (Next.js)

- `apps/web` — React 19 + Next.js 15 App Router
- Interactive UI for song creation and editing
- Real-time SSE updates for long-running jobs
- WebAudio for local preview

### Backend (Fastify)

- `apps/api` — Fastify orchestrator with BullMQ workers
- Route handlers for planning, composition, rendering
- OpenAPI documentation with Swagger UI
- JWT authentication and rate limiting

### Shared Packages

- `@bluebird/types` — Zod DTOs and OpenAPI schemas
- `@bluebird/client` — Fetch-based API client
- `@bluebird/telemetry` — OpenTelemetry instrumentation

### Python Services (Separate repo: bluebird-infer)

- CUDA-optimized inference pods
- Melody, voice, similarity, and mix models
- Stateless design for horizontal scaling

## Key Technologies

- **TypeScript** — Type-safe frontend and backend
- **Next.js** — Production-grade React framework
- **Fastify** — High-performance Node.js server
- **Zod** — Runtime schema validation
- **Prisma** — Type-safe database ORM
- **BullMQ** — Distributed job queue
- **Redis** — Cache and job storage
- **PostgreSQL** — Primary data store
- **MinIO** — S3-compatible object storage

## Workflow

1. User submits lyrics and preferences
2. **Planner** creates arrangement (BPM, key, structure, instruments)
3. **Music Synthesizer** generates melody, harmony, drums
4. **Voice Synthesizer** generates vocal performance
5. **Mixer** combines stems with EQ and dynamics
6. **Similarity Checker** gates export if too close to reference
7. **Exporter** produces master and stems

## Performance Targets

- **TTFP**: ≤45s P50 (time-to-first-preview)
- **Section Regen**: ≤20s per section
- **GPU Cost**: ≤$0.40 per 30s preview

## See Also

- [Architecture Overview](/docs/architecture/overview)
- [API Reference](/docs/api/overview)
- [Getting Started](/docs/development/getting-started) — Development setup
