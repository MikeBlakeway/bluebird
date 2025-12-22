<!-- markdownlint-disable MD024 MD036 -->

# TypeScript Type Safety Audit Report

**Date:** 2025-12-14
**Perspective:** @typescript-pro
**Scope:** Compliance with § 5.0 Type Safety Rules

---

## EXECUTIVE SUMMARY

**Overall Grade: B+ (Good with Notable Issues)**

The codebase demonstrates strong foundational type safety practices with excellent Zod schema usage and strict TypeScript configuration. However, **critical violations** exist in production route handlers where unsafe type assertions bypass runtime validation, directly contradicting § 5.0 Type Safety rules.

**Key Findings:**

- ✅ Excellent: Zod schema-first approach in `@bluebird/types`
- ✅ Strong: Worker validation of DB JSON fields
- ✅ Good: Discriminated union usage for state machines
- ❌ **CRITICAL**: Unsafe route parameter casts in production
- ⚠️ Warning: One unjustified `as any` in production
- ⚠️ Minor: Missing branded types for domain IDs

---

## TYPESCRIPT CONFIGURATION ANALYSIS

### tsconfig.base.json Strictness: ✅ EXCELLENT

```jsonc
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedIndexedAccess": true, // ⭐ Critical for array safety
  "useUnknownInCatchVariables": true, // ⭐ Forces proper error handling
  "exactOptionalPropertyTypes": false, // Acceptable for DTO compatibility
  "noImplicitOverride": true,
}
```

**Assessment:** World-class strictness. `noUncheckedIndexedAccess` and `useUnknownInCatchVariables` are advanced settings that many projects skip. This configuration enforces § 5.0 at compile-time.

---

## TYPE SAFETY STRENGTHS

### 1. Zod Schema-First Architecture ✅

**Location:** `packages/types/src/index.ts`

**Pattern:**

```typescript
export const ArrangementSpecSchema = z.object({
  projectId: ProjectIdSchema,
  jobId: JobIdSchema,
  bpm: z.number().int().min(60).max(200),
  key: z.string().min(1).max(3),
  // ... full validation
})
export type ArrangementSpec = z.infer<typeof ArrangementSpecSchema>
```

**Why This is Excellent:**

- Single source of truth for types AND validation
- Runtime guarantees match compile-time types
- Zero TypeScript-only types that could drift from validation
- All 20+ DTOs follow this pattern consistently

**Grade: A+**

---

### 2. Worker JSON Field Validation ✅

**Example:** [apps/api/src/lib/workers/music-worker.ts:58-67](apps/api/src/lib/workers/music-worker.ts#L58-L67)

```typescript
// Validate arrangement plan with Zod for type safety
const parseResult = ArrangementSpecSchema.safeParse(take.plan)
if (!parseResult.success) {
  throw new Error(`Invalid arrangement plan: ${parseResult.error.message}`)
}
const arrangement = parseResult.data // Type-safe + validated
```

**Assessment:** Perfect implementation of § 5.0 rules for DB JSON fields. Prisma's `Json?` type is never cast directly; always validated with descriptive errors.

**Also Found In:**

- [apps/api/src/lib/workers/voice-worker.ts:64-70](apps/api/src/lib/workers/voice-worker.ts#L64-L70)
- [apps/api/src/lib/workers/mix-worker.ts:63-69](apps/api/src/lib/workers/mix-worker.ts#L63-L69)

**Grade: A+**

---

### 3. Safe Unknown Usage in Error Handling ✅

**Example:** [apps/api/src/lib/jwt.ts:50-53](apps/api/src/lib/jwt.ts#L50-L53)

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(err as any).cause = error
```

**Assessment:** Properly justified `as any` with ESLint disable comment. This is assigning to a non-standard property (`cause`) on Error, which requires escaping the type system. Acceptable per § 5.0 exception rules.

**Grade: A** (documented exception)

---

### 4. Discriminated Unions for Job Stages ✅

**Location:** [packages/types/src/index.ts:177-190](packages/types/src/index.ts#L177-L190)

```typescript
export const JobStageSchema = z.enum([
  'queued',
  'analyzing',
  'planning',
  'melody-gen',
  'music-render',
  'vocal-render',
  'mixing',
  'similarity-check',
  'exporting',
  'completed',
  'failed',
])
export type JobStage = z.infer<typeof JobStageSchema>
```

**Pattern:** Used throughout for state machines (PlaybackState, TrackState, etc.). Enables exhaustiveness checking in switch statements.

**Grade: A**

---

## CRITICAL VIOLATIONS (§ 5.0)

### 🚨 VIOLATION 1: Unsafe Route Parameter Casts

**Severity:** CRITICAL
**Impact:** Bypasses runtime validation, breaks type safety guarantees

#### Locations

1. **[apps/api/src/routes/projects.ts:100](apps/api/src/routes/projects.ts#L100)**

   ```typescript
   const { projectId } = request.params as { projectId: string }
   ```

2. **[apps/api/src/routes/projects.ts:143](apps/api/src/routes/projects.ts#L143)**

   ```typescript
   const { projectId } = request.params as { projectId: string }
   ```

3. **[apps/api/src/routes/projects.ts:194](apps/api/src/routes/projects.ts#L194)**

   ```typescript
   const { projectId } = request.params as { projectId: string }
   ```

4. **[apps/api/src/routes/export.ts:57](apps/api/src/routes/export.ts#L57)**

   ```typescript
   const { takeId } = request.params as { takeId: string }
   ```

#### Why This is Wrong

Per § 5.0:

> **Route parameters**: Use Fastify type inference or validate with Zod; avoid `as { param: string }`

**Current Pattern:**

```typescript
// ❌ WRONG: Assumes structure without validation
const { projectId } = request.params as { projectId: string }

// Could be undefined, wrong type, or malicious input
// No runtime check before database query
const project = await prisma.project.findUnique({
  where: { id: projectId }, // What if projectId is undefined?
})
```

**Correct Pattern (from jobs.ts):**

```typescript
// ✅ CORRECT: Honest about uncertainty, validate with Zod
const params = request.params as { jobId?: unknown }
const parsed = JobIdSchema.safeParse(params.jobId)
if (!parsed.success) {
  return reply.code(400).send({ error: 'Invalid job ID' })
}
const jobId = parsed.data // Type-safe + validated
```

#### Security Impact:

1. **SQL Injection Risk:** Unvalidated params passed to Prisma (mitigated by Prisma's parameterization, but still poor practice)
2. **DoS Risk:** Malformed UUIDs could cause database exceptions
3. **Type Confusion:** Code assumes `string` but could be `undefined` or array

#### Fix Required:

Replace all unsafe casts with Zod validation:

```typescript
// projects.ts - getProjectHandler
const params = request.params as { projectId?: unknown }
const parsed = ProjectIdSchema.safeParse(params.projectId)
if (!parsed.success) {
  return reply.code(400).send({ error: 'Invalid project ID' })
}
const projectId = parsed.data

// export.ts - getExportStatusHandler
const params = request.params as { takeId?: unknown }
const parsed = TakeIdSchema.safeParse(params.takeId)
if (!parsed.success) {
  return reply.code(400).send({ error: 'Invalid take ID' })
}
const takeId = parsed.data
```

**Grade: F** (direct violation of § 5.0)

---

### ⚠️ VIOLATION 2: Unjustified `as any` in Production

**Severity:** MEDIUM
**Location:** [apps/api/src/server.ts:24](apps/api/src/server.ts#L24)

```typescript
const fastify = Fastify({
  logger: logger as any,
  bodyLimit: 1024 * 1024,
  // ...
})
```

#### Why This is Wrong:

1. No ESLint disable comment (violates § 5.0 exception rules)
2. No justification for why cast is needed
3. Likely fixable with proper Pino/Fastify type alignment

#### Likely Root Cause:

Pino logger type mismatch with Fastify's expected logger interface. Fastify expects a logger with specific methods; Pino exports a compatible but not identical type.

#### Fix Options:

**Option A: Type the logger correctly**

```typescript
import type { FastifyBaseLogger } from 'fastify'
import { logger as pinoLogger } from './lib/logger.js'

const logger = pinoLogger as FastifyBaseLogger
```

**Option B: Configure Fastify's logger expectations**

```typescript
const fastify = Fastify<Server, IncomingMessage, ServerResponse, FastifyBaseLogger>({
  logger: logger,
  // ...
})
```

**Option C: Document the exception**

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Pino logger interface is compatible but types don't align; safe runtime cast
logger: logger as any,
```

**Grade: D** (production `as any` without justification)

---

### ⚠️ VIOLATION 3: Unsafe Header Type Assertion

**Severity:** LOW
**Location:** [apps/api/src/routes/orchestrator.ts:35](apps/api/src/routes/orchestrator.ts#L35)

```typescript
const idempotencyKey = request.headers['idempotency-key'] as string | undefined
```

#### Why This is Suboptimal:

1. Headers can be `string | string[] | undefined` in Fastify
2. Cast assumes it's never an array (which is correct for this header, but not type-safe)

#### Correct Pattern:

```typescript
const idempotencyKey = request.headers['idempotency-key']
const key = Array.isArray(idempotencyKey) ? idempotencyKey[0] : idempotencyKey

// Or validate with Zod
const IdempotencyKeySchema = z.string().optional()
const key = IdempotencyKeySchema.parse(
  Array.isArray(idempotencyKey) ? idempotencyKey[0] : idempotencyKey
)
```

**Grade: C** (technically unsafe but low impact)

---

## MISSING TYPE SAFETY FEATURES

### 1. Branded Types for Domain IDs ⚠️

**Current:**

```typescript
export const ProjectIdSchema = z.string().cuid2()
export type ProjectId = z.infer<typeof ProjectIdSchema> // Just `string`

export const TakeIdSchema = z.string().cuid2()
export type TakeId = z.infer<typeof TakeIdSchema> // Just `string`
```

**Issue:** `ProjectId` and `TakeId` are both `string`, allowing accidental mixing:

```typescript
function getProject(projectId: ProjectId) {
  /* ... */
}
function getTake(takeId: TakeId) {
  /* ... */
}

const projectId: ProjectId = 'clx123...'
const takeId: TakeId = 'clx456...'

getProject(takeId) // ❌ Should error, but compiles (both are string)
```

**Recommended: Branded Types**

```typescript
export type ProjectId = string & { readonly __brand: 'ProjectId' }
export type TakeId = string & { readonly __brand: 'TakeId' }

export const ProjectIdSchema = z
  .string()
  .cuid2()
  .transform((val) => val as ProjectId)

// Now this is a compile error:
getProject(takeId) // ❌ Type 'TakeId' is not assignable to 'ProjectId'
```

**Benefits:**

- Prevents ID mixing bugs at compile-time
- Self-documenting: `ProjectId` is more meaningful than `string`
- Zero runtime cost (types erased at compilation)

**Grade: B-** (functional but could be stricter)

---

### 2. Missing Generic Constraints in Queue Types ⚠️

**Current:** [apps/api/src/lib/queue.ts:28-75](apps/api/src/lib/queue.ts#L28-L75)

```typescript
export interface PlanJobData {
  projectId: ProjectId
  jobId: JobId
  lyrics: string
  genre: string
  seed?: number
  isPro?: boolean
}

export interface MusicJobData {
  projectId: ProjectId
  jobId: JobId
  sectionIndex: number
  instrument: string
  seed: number
  isPro?: boolean
}
```

**Opportunity:** Generic job data base with discriminated union

```typescript
type JobDataBase<T extends string> = {
  type: T
  projectId: ProjectId
  jobId: JobId
  isPro?: boolean
}

type PlanJobData = JobDataBase<'plan'> & {
  lyrics: string
  genre: string
  seed?: number
}

type MusicJobData = JobDataBase<'music'> & {
  sectionIndex: number
  instrument: string
  seed: number
}

type AllJobData = PlanJobData | MusicJobData | VoiceJobData | MixJobData
```

**Benefits:**

- Exhaustiveness checking in job processors
- Shared fields enforced at type level
- Better IDE autocomplete

**Grade: B** (current approach works but could be more sophisticated)

---

## TEST FILE TYPE SAFETY ✅

**Assessment:** Test files appropriately use `as any` for mocking, all with proper comments or clear mock contexts.

**Examples:**

- [apps/web/src/lib/audio-engine.test.ts:56](apps/web/src/lib/audio-engine.test.ts#L56): Mock AudioContext
- [apps/web/src/lib/sse-client.test.ts:50](apps/web/src/lib/sse-client.test.ts#L50): Mock EventSource
- [apps/web/src/hooks/use-audio-engine.test.ts:360](apps/web/src/hooks/use-audio-engine.test.ts#L360): Access private members for testing

**Per § 5.0:** Test files exempt from `as any` restrictions.

**Grade: A**

---

## CONST ASSERTIONS ✅

**Pattern:** Properly used for literal type preservation

**Examples:**

```typescript
// queue.ts:20
export const QUEUE_NAMES = {
  PLAN: 'plan',
  SYNTH: 'synth',
  // ...
} as const

// routes/render.ts:60
return reply.code(200).send({
  status: 'queued' as const,
})
```

**Assessment:** Correct usage. `as const` is safe; creates readonly literal types with no runtime risk.

**Grade: A**

---

## RECOMMENDATIONS

### Priority 1: Fix Route Parameter Validation (CRITICAL)

**Files to Update:**

1. `apps/api/src/routes/projects.ts` (lines 100, 143, 194)
2. `apps/api/src/routes/export.ts` (line 57)

**Pattern to Apply:**

```typescript
// Before
const { projectId } = request.params as { projectId: string }

// After
const params = request.params as { projectId?: unknown }
const parsed = ProjectIdSchema.safeParse(params.projectId)
if (!parsed.success) {
  return reply.code(400).send({ error: 'Invalid project ID' })
}
const projectId = parsed.data
```

**Estimated Effort:** 30 minutes
**Risk:** Low (defensive changes only add validation)

---

### Priority 2: Fix Fastify Logger Type (MEDIUM)

**File:** `apps/api/src/server.ts:24`

**Action:** Either type correctly or document the exception with ESLint disable + comment.

**Estimated Effort:** 15 minutes

---

### Priority 3: Add Branded Types for Domain IDs (OPTIONAL)

**File:** `packages/types/src/index.ts`

**Action:** Implement branded types for `ProjectId`, `TakeId`, `JobId`, `UserId`.

**Benefits:**

- Compile-time ID mixing prevention
- Better developer experience

**Estimated Effort:** 1 hour
**Risk:** Medium (requires testing to ensure Zod transform works correctly)

---

### Priority 4: Add Fastify Type Schemas (ENHANCEMENT)

**Current:** Manual Zod validation in route bodies
**Opportunity:** Use Fastify's schema compilation for automatic validation

**Example:**

```typescript
fastify.post(
  '/projects/:projectId',
  {
    schema: {
      params: ProjectIdSchema,
      body: UpdateProjectRequestSchema,
      response: {
        200: ProjectSchema,
      },
    },
    preHandler: requireAuth,
  },
  async (request, reply) => {
    // request.params.projectId is now typed AND validated automatically
    const projectId = request.params.projectId // Type: ProjectId (if branded)
    // ...
  }
)
```

**Benefits:**

- Automatic validation (no manual parse calls)
- OpenAPI generation from schemas
- Better error messages

**Estimated Effort:** 4 hours (refactor all routes)

---

## TYPE GUARD USAGE

**Current State:** Minimal explicit type guards; relies on Zod validation

**Example of Good Practice:**

```typescript
// lib/jwt.ts:46
error instanceof Error ? `Token verification failed: ${error.message}` : 'Invalid or expired token'
```

**Assessment:** Type narrowing is handled correctly where used. Zod schemas act as runtime type guards, which is a superior pattern.

**Grade: A**

---

## SUMMARY BY FILE

| File                                  | Grade | Issues          | Notes                               |
| ------------------------------------- | ----- | --------------- | ----------------------------------- |
| `packages/types/src/index.ts`         | A+    | None            | Perfect Zod-first architecture      |
| `apps/api/src/lib/workers/*.ts`       | A+    | None            | Excellent DB JSON validation        |
| `apps/api/src/routes/jobs.ts`         | A+    | None            | Reference implementation for params |
| `apps/api/src/routes/projects.ts`     | **F** | 3 unsafe casts  | Fix route param validation          |
| `apps/api/src/routes/export.ts`       | **F** | 1 unsafe cast   | Fix route param validation          |
| `apps/api/src/routes/orchestrator.ts` | C     | Header cast     | Low priority fix                    |
| `apps/api/src/server.ts`              | **D** | Logger `as any` | Document or fix                     |
| `apps/api/src/lib/jwt.ts`             | A     | None            | Documented exception                |
| `apps/api/src/lib/queue.ts`           | B     | None            | Could use discriminated unions      |
| `apps/web/src/lib/*.ts`               | A     | None            | Clean frontend code                 |
| `tsconfig.base.json`                  | A+    | None            | Excellent strictness                |

---

## COMPLIANCE CHECKLIST

- [x] Zod schema usage vs. TypeScript-only types: **PASS** (100% Zod-first)
- [x] Discriminated unions for state machines: **PASS** (JobStage, PlaybackState, etc.)
- [x] Generic type usage and constraints: **GOOD** (could be enhanced)
- [x] Type guards and narrowing: **PASS** (via Zod + instanceof)
- [ ] **Route parameter type safety: FAIL** (4 violations)
- [ ] **Production `as any` usage: FAIL** (1 unjustified)
- [x] Test file `as any` usage: **PASS** (all justified)
- [x] JSON field validation patterns: **PASS** (workers validate correctly)
- [x] Unknown usage in error handling: **PASS** (`useUnknownInCatchVariables` enabled)

---

## FINAL GRADE: B+

**Strengths:**

- World-class TypeScript configuration
- Excellent Zod schema-first architecture
- Perfect worker validation of DB JSON fields
- No TypeScript errors in production code

**Critical Issues:**

- 4 unsafe route parameter casts (§ 5.0 violations)
- 1 unjustified `as any` in production

**Action Items:**

1. Fix route parameter validation (30 min, critical)
2. Fix or document logger cast (15 min, medium)
3. Consider branded types for IDs (1 hour, optional)

**With fixes applied, grade would be: A**

---

## APPENDIX: Type Safety Best Practices Reference

### Pattern: Safe Route Parameter Handling

```typescript
// ✅ CORRECT
const params = request.params as { id?: unknown }
const parsed = IdSchema.safeParse(params.id)
if (!parsed.success) {
  return reply.code(400).send({ error: 'Invalid ID' })
}
const id = parsed.data

// ❌ WRONG
const { id } = request.params as { id: string }
```

### Pattern: Safe DB JSON Field Access

```typescript
// ✅ CORRECT
const parseResult = MySchema.safeParse(dbRecord.jsonField)
if (!parseResult.success) {
  throw new Error(`Invalid data: ${parseResult.error.message}`)
}
const data = parseResult.data

// ❌ WRONG
const data = dbRecord.jsonField as MyType
```

### Pattern: Documented Exception

```typescript
// ✅ CORRECT (when truly necessary)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Pino types don't align with Fastify but are runtime-compatible
const logger = pinoLogger as any

// ❌ WRONG
const logger = pinoLogger as any // No comment
```

---

**Report Generated:** 2025-12-14
**Auditor:** @typescript-pro
**Next Review:** After Priority 1 & 2 fixes
