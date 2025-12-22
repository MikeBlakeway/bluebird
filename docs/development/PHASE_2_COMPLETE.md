# Phase 2: Swagger UI & OpenAPI Setup — Complete

> Documentation infrastructure Phase 2: REST API documentation via Swagger/OpenAPI

## Summary

Successfully integrated Swagger UI and OpenAPI spec generation for the Bluebird API. Routes already decorated with Zod schemas auto-generate interactive documentation.

## What's Complete

### Swagger UI (Live)

- **Endpoint**: `http://localhost:4000/documentation` (when API running)
- **Source**: `@fastify/swagger` + `@fastify/swagger-ui` (already in deps)
- **Config**: Server setup in `apps/api/src/server.ts`
  - OpenAPI 3.0.0 metadata
  - Cookie-based JWT auth scheme
  - Zod→JSON Schema transformation

### Route Decoration

All routes already follow the pattern:

```typescript
const app = fastify.withTypeProvider<ZodTypeProvider>()

app.post(
  '/endpoint',
  {
    schema: {
      body: RequestSchema, // From @bluebird/types
      response: {
        200: ResponseSchema,
        400: ErrorSchema,
      },
      tags: ['FeatureName'], // Grouping in Swagger UI
      description: 'What it does',
    },
    preHandler: [requireIdempotencyKey],
  },
  handlerFunction
)
```

### OpenAPI Export Script

New utility to export spec for external use (code generation, documentation portals):

```bash
# Output to stdout
pnpm -F api run swagger:export

# Save to file
pnpm -F api run swagger:export:write  # Saves to ../web/public/openapi.json
```

- Location: `apps/api/src/export-openapi.ts`
- Output: Valid OpenAPI 3.0.3 JSON
- Use case: Feed to Docusaurus (Phase 3), code generators, etc.

### Documentation

Added comprehensive guides:

- **[docs/api/SWAGGER_SETUP.md](docs/api/SWAGGER_SETUP.md)** — Setup details, route patterns, best practices
- **Updated [docs/api/README.md](docs/api/README.md)** — Added Swagger overview and export instructions

## Validation

✅ **Type check**: No errors
✅ **Lint**: No errors
✅ **Swagger export**: Generates valid OpenAPI 3.0.3 spec
✅ **Endpoints detected**: /health, /auth/\*, and all other routes

Example exported spec structure:

```json
{
  "openapi": "3.0.3",
  "info": {
    "title": "Bluebird API",
    "version": "0.1.0"
  },
  "paths": {
    "/auth/magic-link": {
      /* ... */
    },
    "/projects": {
      /* ... */
    },
    "/plan/song": {
      /* ... */
    }
  }
}
```

## Changes Made

1. **apps/api/src/export-openapi.ts** — New script to export OpenAPI spec
2. **apps/api/package.json** — Added `swagger:export` and `swagger:export:write` scripts
3. **docs/api/SWAGGER_SETUP.md** — New setup guide
4. **docs/api/README.md** — Updated with Swagger overview

## Next: Phase 3

Tasks for Docusaurus unified portal:

- [ ] Install Docusaurus + plugins
- [ ] Create site skeleton with API docs category
- [ ] Migrate existing markdown docs to Docusaurus
- [ ] Set up automated OpenAPI spec sync to API reference pages
- [ ] Configure CI to rebuild docs on API changes

## How Developers Use This

**While developing the API:**

```bash
pnpm -F api run dev
# Open http://localhost:4000/documentation
# Try out endpoints interactively
```

**For code generation / external tools:**

```bash
# Get spec
pnpm -F api run swagger:export > openapi.json

# Feed to generators
npx openapi-generator-cli generate -i openapi.json -g typescript-axios -o ./generated
```

**For Docusaurus (Phase 3):**

Spec will be auto-synced to docs build via CI, enabling a single source of truth for API documentation.

## Phase Completion Checklist

- [x] Swagger UI configured and verified
- [x] Routes already have Zod schemas and tags
- [x] OpenAPI export script created and tested
- [x] Documentation guides written
- [x] All quality gates pass (format, lint, typecheck, docs)
- [ ] ~~CI deployment validation~~ (Phase 3: docs build)

**Phase 2 Status: COMPLETE** ✓
