---
sidebar_position: 1
---

# Architecture Overview

Bluebird is a distributed AI music composition platform with clear separation of concerns across frontend, API orchestrator, and stateless inference pods.

## System Design

```
┌─────────────────────────────────────────────────────────────┐
│                      Web Frontend (Next.js)                 │
│                    apps/web (React 18 + TS)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
                        HTTPS / REST / SSE
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   API Orchestrator (Fastify)                │
│              apps/api (Node.js + TypeScript)                │
│  - Routes, Queue Manager, Job Scheduler                      │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        HTTP POST (jobs)             HTTP GET (results)
               │                               │
┌──────────────▼──────────────┐  ┌────────────▼────────────────┐
│   Pod Network (Python)      │  │   Data Stores               │
│   (FastAPI Services)        │  │                             │
│  Analyzer, Planner, Melody, │  │  - PostgreSQL (metadata)    │
│  Music, Voice, Similarity,  │  │  - Redis (cache/sessions)   │
│  Mix, Exporter              │  │  - MinIO/S3 (audio/files)   │
│  (stateless, containerized) │  │                             │
└─────────────────────────────┘  └─────────────────────────────┘
```

## Key Components

### Frontend (Web)

- **Framework**: Next.js 14+ with App Router
- **Styling**: Tailwind CSS + HeroUI components
- **Real-time**: SSE for job status, WebAudio for preview
- **Features**: Auth, project management, mixing, export

### Backend API

- **Framework**: Fastify v4 (Node.js + TypeScript)
- **Database**: Prisma ORM + PostgreSQL
- **Job Queue**: BullMQ with Redis
- **Features**: REST endpoints, SSE stream, idempotency, Zod validation

### Inference Pods

- **Language**: Python 3.10+ FastAPI
- **Stateless**: All state via S3, HTTP coordination
- **Audio I/O**: WAV file handling via S3
- **Pods**: Analyzer, Planner, Melody, Music, Voice, Similarity, Mix, Exporter

### Data Layer

- **PostgreSQL**: User accounts, projects, takes, jobs
- **Redis**: Sessions, job queue, cache
- **MinIO/S3**: Audio stems, features, reference audio

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

- [Architecture Overview](/docs/architecture/overview)
- [Database Schema](https://github.com/MikeBlakeway/bluebird/tree/develop/apps/api/prisma)
- [API Endpoints](/docs/api/overview)
