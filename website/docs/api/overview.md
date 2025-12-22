---
sidebar_position: 1
---

# API Overview

## Live Swagger UI

When the API is running locally:

```bash
pnpm -F api run dev
# Open http://localhost:4000/documentation
```

## Canonical Endpoints

All endpoints follow RESTful principles with idempotent POSTs:

### Planning

- `POST /plan/song` — Create arrangement from lyrics
- `POST /plan/arrangement` (alias)
- `POST /plan/vocals` (alias)

### Composition

- `POST /remix/reference/upload` — Upload reference audio for vibe guidance
- `POST /remix/melody` — Regenerate melody guided by reference
- `POST /render/preview` — Full composition preview
- `POST /render/section` — Render specific section

### Quality & Export

- `POST /check/similarity` — Check export-gating similarity report
- `POST /mix/final` — Final mix with EQ/compression
- `POST /export` — Export master + stems

### Jobs

- `GET /jobs/:jobId/events` — Server-Sent Events (SSE) stream for real-time updates

### Utilities

- `GET /health` — Health check
- `POST /auth/magic-link` — Request magic link
- `POST /auth/verify` — Verify token and get JWT

## Authentication

All endpoints (except `/auth` and `/health`) require **cookie-based JWT**:

```typescript
// Automatically handled by API client
import { createClient } from '@bluebird/client'

const client = createClient({
  baseUrl: 'http://localhost:4000',
})

await client.post('/plan/song', { lyrics: 'My song...' })
```

## Request/Response

All requests and responses use **JSON** with Zod schema validation:

```typescript
// Example: Create arrangement
POST /plan/song
Content-Type: application/json
Idempotency-Key: <uuid>

{
  "projectId": "uuid",
  "lyrics": "Verse text\nChorus text",
  "genre": "pop",
  "bpm": 120,
  "key": "C"
}

// Response
{
  "success": true,
  "jobId": "uuid",
  "arrangeSpec": { /* ... */ }
}
```

## Error Handling

Errors follow a consistent format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid lyrics format",
  "details": {
    "field": "lyrics",
    "reason": "Must contain at least one verse"
  }
}
```

## Rate Limiting

Global limits (per IP):

- **Normal endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes

## OpenAPI Spec

Export the OpenAPI spec for code generation or documentation:

```bash
pnpm -F api run swagger:export > openapi.json
```

## See Also

- GitHub repository: https://github.com/MikeBlakeway/bluebird
