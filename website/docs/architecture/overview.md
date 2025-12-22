---
sidebar_position: 1
---

# Architecture Overview

Bluebird's architecture is designed for **scalability, type safety, and performance**.

## Key Principles

1. **Monorepo for Shared Types** — Single source of truth for DTOs
2. **Separate Python Inference** — CUDA/PyTorch isolation from Node.js
3. **Job Queue Pattern** — Async composition via BullMQ + workers
4. **OpenTelemetry Instrumentation** — Observability at every layer
5. **Type Safety First** — Zod validation at API boundaries

## Component Layers

```bash
┌─────────────────────────────────────┐
│      Web (Next.js App Router)       │
│  - React UI + WebAudio preview     │
│  - SSE for real-time job updates   │
└─────────────┬───────────────────────┘
              │ (REST + JSON)
┌─────────────▼───────────────────────┐
│    API (Fastify + OpenAPI)          │
│  - Route handlers + middleware      │
│  - Zod validation + JWT auth        │
│  - BullMQ job enqueue               │
└─────────────┬───────────────────────┘
              │ (Job queue + Redis)
┌─────────────▼───────────────────────┐
│    Workers (Node.js processes)      │
│  - Music/Voice/Mix/Export workers   │
│  - S3 state persistence             │
│  - OpenTelemetry tracing            │
└─────────────┬───────────────────────┘
              │ (HTTP + S3)
┌─────────────▼───────────────────────┐
│   Python Pods (Docker services)     │
│  - Melody synthesizer               │
│  - Voice synthesizer                │
│  - Similarity analyzer              │
│  - Mixer                            │
└─────────────────────────────────────┘
```

## Data Flow

1. **User submits song** → Web UI
2. **API creates Take** → Database
3. **Planner job enqueued** → Redis queue
4. **Worker processes** → Calls Python pods via HTTP
5. **Artifacts stored** → MinIO S3
6. **SSE events emitted** → Web UI updates in real-time
7. **User exports** → Similarity check gate
8. **Master + stems** → S3 presigned URLs

## See Also

- [Monorepo Structure](/docs/architecture/monorepo)
- [Database Schema](https://github.com/MikeBlakeway/bluebird/tree/develop/apps/api/prisma)
- [API Endpoints](/docs/api/overview)
